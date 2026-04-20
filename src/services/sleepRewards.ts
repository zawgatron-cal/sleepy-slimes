/**
 * Sleep reward logic: validate session (min 30s), compute candies and spawn slimes.
 * PRD: 1 candy/hour base; slimes from zone spawn table (weighted). Valid session = >= 30 seconds.
 */


import {
  CANDIES_PER_HOUR,
  MAX_CANDIES_PER_SESSION,
  MIN_CANDIES_PER_VALID_SESSION,
  MIN_VALID_SLEEP_SECONDS,
  STREAK_BONUS_MIN_STREAK,
  STREAK_CANDY_FLAT_BONUS,
  Tier,
} from '@/src/constants/game';
import { SPECIES, ZONE_TIER_WEIGHTS } from '@/src/data';
import { getSleepSessions, getSpawnTableEntries } from '@/src/db';
import type { Slime, SleepSession, SpawnTableEntry } from '@/src/types';
import { streakValueForNewSession } from '@/src/services/sleepStreak';
import { generateSlimeSeed, pickWeightedIndex } from '@/src/utils/util';


/** Pick one species from the table using entry weights. (Assumes entries non-empty.) */
function pickOneSpeciesByWeight(entries: SpawnTableEntry[]): string {
  const weights = entries.map((e) => e.weight);
  const idx = pickWeightedIndex(weights);
  return entries[idx].speciesId;
}

/** Spawn table entries whose species is the given tier. (Assumes at least one per tier in every zone.) */
function slimesOfTier(spawnTable: SpawnTableEntry[], tier: Tier): SpawnTableEntry[] {
  const speciesById = Object.fromEntries(Object.values(SPECIES).map((s) => [s.id, s]));

  return spawnTable.filter((e) => speciesById[e.speciesId].tier === tier);
}

/**
 * Pick one species: roll tier by zone rarity weights, then pick a species of that tier by entry weight.
 * Assumes every zone has all tiers, full rarity weights, and at least one species per tier.
 */
function chooseSpecies(spawnTable: SpawnTableEntry[], zoneRarity: Record<Tier, number>): string {
  const tier_order: Tier[] = [Tier.COMMON, Tier.UNCOMMON, Tier.RARE, Tier.ULTRA_RARE];

  const tierWeights = tier_order.map((t) => zoneRarity[t]);
  const chosenTier = tier_order[pickWeightedIndex(tierWeights)];
  const species = slimesOfTier(spawnTable, chosenTier);
  return pickOneSpeciesByWeight(species);
}

export interface SleepRewardResult {
  valid: boolean;
  durationSeconds: number;
  candies: number;
  slimes: Slime[];
  session: SleepSession;
}

/**
 * Compute candies earned from a session.
 *
 * Intuition:
 * - Candies scale linearly with how long you sleep: more hours → more candies.
 * - The base rate is `CANDIES_PER_HOUR` candies per hour of valid sleep.
 * - Very short but still “valid” sessions are boosted up to
 *   `MIN_CANDIES_PER_VALID_SESSION` so every valid night feels rewarding.
 */
function calculateCandyCount(durationHours: number): number {
  return Math.min(Math.max(
    MIN_CANDIES_PER_VALID_SESSION,
    Math.floor(durationHours * CANDIES_PER_HOUR)
  ), MAX_CANDIES_PER_SESSION);
}

/**
 * Compute the number of slimes to spawn for a session.
 *
 * Method:
 * - Minimum 1 slime, maximum 5 slimes.
 * - For short sessions near `minSeconds`, the distribution is skewed toward 1–2 slimes.
 * - Around 8–10 hours, the distribution is more generous (more 2–3 slime nights).
 * - After ~12 hours, probabilities gently fall back toward the baseline.
 */
function calculateSlimeCount(durationSeconds: number, minSeconds: number, bonus: boolean = false): number {
  // P[1 slime, 2, 3, 4, 5 slimes]
  const p_min = [0.5, 0.4, 0.05, 0.04, 0.01];
  const p_8 = [0.24, 0.6, 0.1, 0.05, 0.01];
  const p_10 = [0.2, 0.45, 0.23, 0.08, 0.04];
  const p_12 = p_min;


  //calculate probabilities

  // const durationHours = durationSeconds / 3600;
  // const minHours = minSeconds / 3600;
  const durationHours = durationSeconds / 3600;
  const minHours = minSeconds / 3600;

  const lerpArray = (a: number[], b: number[], t: number): number[] =>
    a.map((ai, i) => ai * (1 - t) + b[i] * t);

  let baseProbs: number[];
  if (durationHours <= minHours) {
    baseProbs = p_min;
  } else if (durationHours <= 8) {
    // Linear interpolation from [min, 8h]
    const t = Math.min(1, Math.max(0, (durationHours - minHours) / (8 - minHours)));
    baseProbs = lerpArray(p_min, p_8, t);
  } else if (durationHours <= 10) {
    // Slightly “curved” interpolation between 8h and 10h
    const t = Math.min(1, Math.max(0, (durationHours - 8) / (10 - 8)));
    const tExp = t * t;
    baseProbs = lerpArray(p_8, p_10, tExp);
  } else if (durationHours <= 12) {
    // Falloff back toward p_min by 12h
    const t = Math.min(1, Math.max(0, (durationHours - 10) / (12 - 10)));
    const tExp = t * t;
    baseProbs = lerpArray(p_10, p_12, tExp);
  } else {
    baseProbs = p_12;
  }

  // Normalize to sum 1.
  const sum = baseProbs.reduce((a, b) => a + b, 0);
  let normalized =
    sum > 0 ? baseProbs.map((p) => (p > 0 ? p / sum : 0)) : p_min;

  // Optionally apply streak-based tweak if bonus is enabled.
  if (bonus) {
    normalized = calculateStreakBonusProbabilities(normalized);
  }

  //pick slime
  const idx = pickWeightedIndex(normalized);
  const count = idx + 1; // index 0 => 1 slime, index 4 => 5 slimes
  return Math.min(5, Math.max(1, count));
}

function applyStreakCandiesBonus(baseCandies: number, streakValue: number): number {
  const flat =
    streakValue >= STREAK_BONUS_MIN_STREAK ? STREAK_CANDY_FLAT_BONUS : 0;
  return Math.min(MAX_CANDIES_PER_SESSION, baseCandies + flat);
}

/**
 * Apply a streak bonus to the slime-count distribution.
 *
 * Method:
 * - Give +10% absolute probability to the “3 slimes” bucket.
 * - Renormalize the other buckets so the total probability remains 1.
 * - If input is degenerate (e.g. all zeros), it falls back to the original array.
 */
function calculateStreakBonusProbabilities(probabilities: number[]): number[] {
  if (probabilities.length !== 5) return probabilities;

  const sum = probabilities.reduce((a, b) => a + b, 0);
  if (sum <= 0) return probabilities;

  // Normalize first.
  const base = probabilities.map((p) => (p > 0 ? p / sum : 0));

  const bonus = 0.1;
  const boostedThree = base[2] + bonus;
  const remaining = 1 - boostedThree;

  const otherSum = base[0] + base[1] + base[3] + base[4];
  if (otherSum <= 0 || remaining <= 0) {
    // Degenerate case: just renormalize with the raw boost.
    const rough = [base[0], base[1], boostedThree, base[3], base[4]];
    const s = rough.reduce((a, b) => a + b, 0);
    return s > 0 ? rough.map((p) => p / s) : probabilities;
  }

  const scale = remaining / otherSum;
  return [
    base[0] * scale,
    base[1] * scale,
    boostedThree,
    base[3] * scale,
    base[4] * scale,
  ];
}

/**
 * Core sleep reward routine.
 *
 * High-level behavior:
 * - Takes a start/end time, zone id, and quality value, and derives
 *   duration in seconds and hours.
 * - If the duration is below `MIN_VALID_SLEEP_SECONDS`, the session is
 *   marked invalid and returns 0 candies and 0 slimes (but still
 *   includes a session payload for logging/analytics if needed).
 * - For valid sessions:
 *   - Candies are computed via `calculateCandyCount`, so longer sleep
 *     yields more candies, with a guaranteed minimum.
 *   - It looks up that zone’s spawn table from SQLite and uses
 *     `calculateSlimeCount` plus a weighted picker to decide how many
 *     and which species of slimes you get.
 * - Returns both the rewards (candies + slimes) and a `SleepSession`
 *   object that the caller is responsible for persisting to the DB and
 *   reflecting in the stores.
 */
export async function computeSleepRewards(startedAt: number, endedAt: number, zoneId: string, quality: number = 0.5): Promise<SleepRewardResult> {
  const durationMs = endedAt - startedAt;
  const durationSeconds = durationMs / 1000;
  const durationHours = durationMs / (1000 * 60 * 60);

  const session: SleepSession = {id: `session_${Date.now()}`, zoneId, startedAt, endedAt, durationHours, quality, candiesEarned: 0};

  if (durationSeconds < MIN_VALID_SLEEP_SECONDS) {
    return { valid: false, durationSeconds, candies: 0, slimes: [], session };
  }

  const priorSessions = await getSleepSessions();
  const streakValue = streakValueForNewSession(priorSessions, startedAt);

  const baseCandies = calculateCandyCount(durationHours);
  const candies = applyStreakCandiesBonus(baseCandies, streakValue);
  session.candiesEarned = candies;

  const spawnTable = await getSpawnTableEntries(zoneId);
  const slimes: Slime[] = [];
  const slimeBonus = streakValue >= STREAK_BONUS_MIN_STREAK;
  const nSlimes = calculateSlimeCount(durationSeconds, MIN_VALID_SLEEP_SECONDS, slimeBonus);

  if (spawnTable.length > 0) {
    const zoneRarity = ZONE_TIER_WEIGHTS[zoneId]!;
    for (let i = 0; i < nSlimes; i++) {
      const speciesId = chooseSpecies(spawnTable, zoneRarity);
      slimes.push({
        id: `slime_${endedAt}_${i}_${Math.random().toString(36).slice(2, 9)}`,
        speciesId,
        seed: generateSlimeSeed(),
        acquiredAt: endedAt,
        source: 'sleep',
      });
    }
  }

  return { valid: true, durationSeconds, candies, slimes, session };
}
