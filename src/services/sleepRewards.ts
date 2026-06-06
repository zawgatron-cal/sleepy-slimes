import {
  CANDIES_PER_HOUR,
  MAX_CANDIES_PER_SESSION,
  MIN_CANDIES_PER_VALID_SESSION,
  MIN_VALID_SLEEP_SECONDS,
  MIN_SLIMES_PER_SLEEP_SESSION,
  MAX_SLIMES_PER_SLEEP_SESSION,
  STREAK_BONUS_MIN_STREAK,
  STREAK_CANDY_FLAT_BONUS,
  Tier,
  type SpawnableTier,
} from '@/src/constants/game';
import { SPECIES, ZONE_TIER_WEIGHTS } from '@/src/data';
import { getEquippedSlimeId, getSleepSessions, getSlimes, getSpecies, getSpawnTableEntries } from '@/src/db';
import {
  applyEquippedCandyBonus,
  applyEquippedExtraSlimeRoll,
  applyEquippedTierSpawnBonus,
  EMPTY_EQUIPPED_SLIME_BONUS,
  getEquippedSlimeBonus,
  type EquippedSlimeBonus,
} from '@/src/utils/equippedSlimeRewards';
import type { Slime, SleepSession, SpawnTableEntry } from '@/src/types';
import { streakValueForNewSession } from '@/src/services/sleepStreak';
import { initialSlimeLevel } from '@/src/utils/slimeLevel';
import { getSleepSecretVariantBonus } from '@/src/utils/sleepSecretVariantBonus';
import { computeSleepQualityScore } from '@/src/utils/sleepQuality';
import {
  mergeVariantDropBonus,
  rollSlimeVariant,
  type VariantDropBonus,
} from '@/src/utils/slimeVariant';
import { generateSlimeSeed, pickWeightedIndex } from '@/src/utils/util';

// --- Shared types ---

/** Inputs shared by candy + slime algorithms (resolved once per sleep session). */
export type SleepRewardModifiers = {
  /** Streak count after this session starts (used for candy flat bonus + slime count tweak). */
  streakValue: number;
  /** Bonuses from the slime equipped during this sleep session (by tier × level). */
  equippedBonus: EquippedSlimeBonus;
  /** Hidden bonus when sleep consistency + avg quality are both high (prior sessions only). */
  secretVariantBonus?: VariantDropBonus;
};

export interface SleepRewardResult {
  valid: boolean;
  durationSeconds: number;
  candies: number;
  slimes: Slime[];
  session: SleepSession;
};

export type GenerateSlimeParams = {
  zoneId: string;
  endedAt: number;
  durationSeconds: number;
  modifiers: SleepRewardModifiers;
};

// --- Modifiers (streak, future buddy) ---
//
// Flow: load prior sleep_sessions from SQLite → compute what streak will be when
// this session counts → pass the same struct into calculateCandy + generateSlime so
// bonuses stay inside those algorithms, not in the orchestrator.

/** Load equipped slime from DB and map tier × level → sleep bonuses. */
export async function resolveEquippedSlimeBonus(): Promise<EquippedSlimeBonus> {
  const equippedId = await getEquippedSlimeId();
  if (!equippedId) return { ...EMPTY_EQUIPPED_SLIME_BONUS };

  const [slimes, speciesList] = await Promise.all([getSlimes(), getSpecies()]);
  const slime = slimes.find((s) => s.id === equippedId);
  if (!slime) return { ...EMPTY_EQUIPPED_SLIME_BONUS };

  const species = speciesList.find((s) => s.id === slime.speciesId);
  if (!species) return { ...EMPTY_EQUIPPED_SLIME_BONUS };

  return getEquippedSlimeBonus(species.tier, slime.level);
}

export async function resolveSleepRewardModifiers(
  startedAt: number,
  /** Include in secret-variant check only (e.g. the session about to be saved). */
  pendingSession?: SleepSession
): Promise<SleepRewardModifiers> {
  const priorSessions = await getSleepSessions();
  const [streakValue, equippedBonus] = await Promise.all([
    Promise.resolve(streakValueForNewSession(priorSessions, startedAt)),
    resolveEquippedSlimeBonus(),
  ]);
  const sessionsForSecret = pendingSession
    ? [pendingSession, ...priorSessions]
    : priorSessions;
  const secretVariantBonus = getSleepSecretVariantBonus(sessionsForSecret);
  return { streakValue, equippedBonus, secretVariantBonus };
}

function variantDropBonusFromEquipped(equipped: EquippedSlimeBonus): VariantDropBonus | undefined {
  if (
    equipped.prismaticVariantPercentAdd <= 0 &&
    equipped.exoticVariantPercentAdd <= 0
  ) {
    return undefined;
  }
  return {
    prismaticPercentAdd: equipped.prismaticVariantPercentAdd || undefined,
    exoticPercentAdd: equipped.exoticVariantPercentAdd || undefined,
  };
}

/**
 * Base candies from duration only (no streak / buddy).
 *
 * Intuition:
 * - Candies scale linearly with how long you sleep: more hours → more candies.
 * - The base rate is `CANDIES_PER_HOUR` candies per hour of valid sleep.
 * - Very short but still “valid” sessions are boosted up to
 *   `MIN_CANDIES_PER_VALID_SESSION` so every valid night feels rewarding.
 */
function baseCandyFromDuration(durationHours: number): number {
  return Math.min(Math.max(
    MIN_CANDIES_PER_VALID_SESSION,
    Math.floor(durationHours * CANDIES_PER_HOUR)
  ), MAX_CANDIES_PER_SESSION);
}

/** Flat streak candy bonus when streak ≥ `STREAK_BONUS_MIN_STREAK`; capped by `MAX_CANDIES_PER_SESSION`. */
function applyStreakCandiesBonus(baseCandies: number, streakValue: number): number {
  const flat =
    streakValue >= STREAK_BONUS_MIN_STREAK ? STREAK_CANDY_FLAT_BONUS : 0;
  return Math.min(MAX_CANDIES_PER_SESSION, baseCandies + flat);
}

/**
 * Candies for a valid session.
 * Caller supplies modifiers from `resolveSleepRewardModifiers`.
 */
export function calculateCandy(
  durationHours: number,
  modifiers: SleepRewardModifiers
): number {
  const base = baseCandyFromDuration(durationHours);
  const withStreak = applyStreakCandiesBonus(base, modifiers.streakValue);
  return applyEquippedCandyBonus(withStreak, modifiers.equippedBonus);
}

// --- Slime ---
//
// Flow: load zone spawn table → roll how many slimes (duration + streak) → for each,
// roll tier from zone weights → pick species in tier → build Slime instance.
// Public entry: generateSlime.

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
function chooseSpecies(spawnTable: SpawnTableEntry[], zoneRarity: Record<SpawnableTier, number>): string {
  const tier_order: SpawnableTier[] = [Tier.COMMON, Tier.UNCOMMON, Tier.RARE, Tier.ULTRA_RARE];
  const tierWeights = tier_order.map((t) => zoneRarity[t]);
  const chosenTier = tier_order[pickWeightedIndex(tierWeights)];
  const species = slimesOfTier(spawnTable, chosenTier);
  return pickOneSpeciesByWeight(species);
}

/**
 * Apply a streak bonus to the slime-count distribution.
 *
 * Method:
 * - Give +10% absolute probability to the “3 slimes” bucket.
 * - Renormalize the other buckets so the total probability remains 1.
 * - If input is degenerate (e.g. all zeros), it falls back to the original array.
 */
function applyStreakSlimeCountBonus(probabilities: number[]): number[] {
  if (probabilities.length !== MAX_SLIMES_PER_SLEEP_SESSION) return probabilities;

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
 * Roll how many slimes (1–5) for this session.
 *
 * Method:
 * - Minimum 1 slime, maximum 5 slimes.
 * - For short sessions near `minSeconds`, the distribution is skewed toward 1–2 slimes.
 * - Around 8–10 hours, the distribution is more generous (more 2–3 slime nights).
 * - After ~12 hours, probabilities gently fall back toward the baseline.
 * - If streak ≥ `STREAK_BONUS_MIN_STREAK`, applies `applyStreakSlimeCountBonus` before picking.
 */
function slimeCountDistribution(
  durationSeconds: number,
  minSeconds: number,
  modifiers: SleepRewardModifiers
): number {
  // P[1 slime, 2, 3, 4, 5 slimes]
  const p_min = [0.5, 0.4, 0.05, 0.04, 0.01];
  const p_8 = [0.24, 0.6, 0.1, 0.05, 0.01];
  const p_10 = [0.2, 0.45, 0.23, 0.08, 0.04];
  const p_12 = p_min;

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
    baseProbs = lerpArray(p_8, p_10, t * t);
  } else if (durationHours <= 12) {
    // Falloff back toward p_min by 12h
    const t = Math.min(1, Math.max(0, (durationHours - 10) / (12 - 10)));
    baseProbs = lerpArray(p_10, p_12, t * t);
  } else {
    baseProbs = p_12;
  }

  // Normalize to sum 1.
  const sum = baseProbs.reduce((a, b) => a + b, 0);
  let normalized = sum > 0 ? baseProbs.map((p) => (p > 0 ? p / sum : 0)) : p_min;

  if (modifiers.streakValue >= STREAK_BONUS_MIN_STREAK) {
    normalized = applyStreakSlimeCountBonus(normalized);
  }

  const idx = pickWeightedIndex(normalized);
  let count = idx + 1; // index 0 => min slimes, index max-1 => max slimes
  count = Math.min(
    MAX_SLIMES_PER_SLEEP_SESSION,
    Math.max(MIN_SLIMES_PER_SLEEP_SESSION, count)
  );
  return applyEquippedExtraSlimeRoll(
    count,
    MAX_SLIMES_PER_SLEEP_SESSION,
    modifiers.equippedBonus
  );
}

/** One owned slime instance for the collection DB / store. */
function rollSleepSlimeInstance(
  endedAt: number,
  index: number,
  spawnTable: SpawnTableEntry[],
  zoneRarity: Record<SpawnableTier, number>,
  modifiers: SleepRewardModifiers
): Slime {
  const variantBonus = mergeVariantDropBonus(
    variantDropBonusFromEquipped(modifiers.equippedBonus),
    modifiers.secretVariantBonus
  );

  return {
    id: `slime_${endedAt}_${index}_${Math.random().toString(36).slice(2, 9)}`,
    speciesId: chooseSpecies(spawnTable, zoneRarity),
    variant: rollSlimeVariant(variantBonus),
    level: initialSlimeLevel(),
    equippedNights: 0,
    seed: generateSlimeSeed(),
    acquiredAt: endedAt,
    source: 'sleep',
  };
}

/**
 * All slimes earned from one valid sleep session in a zone.
 * Returns [] if the zone has no spawn table rows.
 */
export async function generateSlime(params: GenerateSlimeParams): Promise<Slime[]> {
  const { zoneId, endedAt, durationSeconds, modifiers } = params;
  const spawnTable = await getSpawnTableEntries(zoneId);
  if (spawnTable.length === 0) return [];

  const nSlimes = slimeCountDistribution(
    durationSeconds,
    MIN_VALID_SLEEP_SECONDS,
    modifiers
  );
  const baseRarity = ZONE_TIER_WEIGHTS[zoneId]!;
  const zoneRarity = applyEquippedTierSpawnBonus(baseRarity, modifiers.equippedBonus);
  const slimes: Slime[] = [];

  for (let i = 0; i < nSlimes; i++) {
    slimes.push(
      rollSleepSlimeInstance(endedAt, i, spawnTable, zoneRarity, modifiers)
    );
  }

  return slimes;
}

// --- Session orchestration ---
//
// Flow: derive duration → build session shell → invalid? early out → modifiers once →
// calculateCandy + generateSlime → attach candies to session → return.

/**
 * Core sleep reward routine (entry point from the Sleep screen).
 *
 * High-level behavior:
 * - Takes a start/end time and zone id; derives duration and sleep quality (0–1).
 * - If the duration is below `MIN_VALID_SLEEP_SECONDS`, the session is
 *   marked invalid and returns 0 candies and 0 slimes (but still
 *   includes a session payload for logging/analytics if needed).
 * - For valid sessions:
 *   - Resolves modifiers (streak today; buddy later).
 *   - Candies via `calculateCandy` (base + streak inside that function).
 *   - Slimes via `generateSlime` (count + species + instances; streak inside).
 * - Returns both the rewards (candies + slimes) and a `SleepSession`
 *   object that the caller is responsible for persisting to the DB and
 *   reflecting in the stores.
 */
export async function computeSleepRewards(
  startedAt: number,
  endedAt: number,
  zoneId: string
): Promise<SleepRewardResult> {
  const durationMs = endedAt - startedAt;
  const durationSeconds = durationMs / 1000;
  const durationHours = durationMs / (1000 * 60 * 60);
  const quality = computeSleepQualityScore(durationHours);

  const session: SleepSession = {
    id: `session_${Date.now()}`,
    zoneId,
    startedAt,
    endedAt,
    durationHours,
    quality,
    candiesEarned: 0,
  };

  if (durationSeconds < MIN_VALID_SLEEP_SECONDS) {
    return { valid: false, durationSeconds, candies: 0, slimes: [], session };
  }

  const modifiers = await resolveSleepRewardModifiers(startedAt, session);
  const candies = calculateCandy(durationHours, modifiers);
  const slimes = await generateSlime({ zoneId, endedAt, durationSeconds, modifiers });

  session.candiesEarned = candies;
  return { valid: true, durationSeconds, candies, slimes, session };
}
