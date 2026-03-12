/**
 * Sleep reward logic: validate session (min 30s), compute candies and spawn slimes.
 * PRD: 1 candy/hour base; slimes from zone spawn table (weighted). Valid session = >= 30 seconds.
 */

import { getMinValidSleepSeconds } from '../constants/sleep';
import { CANDIES_PER_HOUR, MIN_CANDIES_PER_VALID_SESSION, MIN_VALID_SLEEP_SECONDS } from '@/src/constants/game';
import { getZoneSpawnWeights } from '@/src/db';
import type { Slime, SleepSession } from '@/src/types';

export interface SleepRewardResult {
  valid: boolean;
  durationSeconds: number;
  candies: number;
  slimes: Slime[];
  session: SleepSession;
}

/** Weighted random: pick one index from weights (sum need not be 1). */
function pickWeightedIndex(weights: number[]): number {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum <= 0) return 0;
  let r = Math.random() * sum;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
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
  return Math.max(
    MIN_CANDIES_PER_VALID_SESSION,
    Math.floor(durationHours * CANDIES_PER_HOUR)
  );
}

/**
 * Compute the number of slimes to spawn for a session.
 *
 * Intuition:
 * - Longer sleep can earn more slimes, but we cap it so nights stay readable.
 * - We look at how many “valid chunks” of sleep you completed based on
 *   `minSeconds` and turn that into a count.
 * - The final count is clamped between 1 and 3, so every valid session gets
 *   at least 1 slime and at most 3 slimes, even if you sleep a very long time.
 */
function calculateSlimeCount(durationSeconds: number, minSeconds: number): number {
  return Math.min(3, Math.max(1, Math.floor(durationSeconds / minSeconds)));
}

export async function computeSleepRewards(
  startedAt: number,
  endedAt: number,
  zoneId: string,
  quality: number = 0.5
): Promise<SleepRewardResult> {
  const durationMs = endedAt - startedAt;
  const durationSeconds = durationMs / 1000;
  const durationHours = durationMs / (1000 * 60 * 60);

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


  const candies = calculateCandyCount(durationHours);
  session.candiesEarned = candies;

  const spawnTable = await getZoneSpawnWeights(zoneId);
  const slimes: Slime[] = [];
  const count = calculateSlimeCount(durationSeconds, MIN_VALID_SLEEP_SECONDS); // 1–3 slimes
  if (spawnTable.length > 0) {
    const ids = spawnTable.map((r) => r.speciesId);
    const weights = spawnTable.map((r) => r.weight);
    for (let i = 0; i < count; i++) {
      const idx = pickWeightedIndex(weights);
      slimes.push({
        id: `slime_${endedAt}_${i}_${Math.random().toString(36).slice(2, 9)}`,
        speciesId: ids[idx],
        acquiredAt: endedAt,
        source: 'sleep',
      });
    }
  }

  return { valid: true, durationSeconds, candies, slimes, session };
}
