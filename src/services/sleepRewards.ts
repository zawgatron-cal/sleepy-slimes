/**
 * Sleep reward logic: validate session (min 30s), compute candies and spawn slimes.
 * PRD: 1 candy/hour base; slimes from zone spawn table (weighted). Valid session = >= 30 seconds.
 */

import { getMinValidSleepSeconds } from '../constants/sleep';
import { getZoneSpawnWeights } from '@/src/db';
import type { Slime, SleepSession } from '@/src/types';

const CANDIES_PER_HOUR = 1;
const MIN_CANDIES_FOR_VALID_SESSION = 1;

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
 * Validate duration >= 30s, compute candies and slimes, build session object.
 * Does not persist; caller should insertSleepSession, insertSlime, update stores.
 * Spawn candidates and weights come from DB (zone_spawn_weights) for the given zone.
 */
export async function computeSleepRewards(
  startedAt: number,
  endedAt: number,
  zoneId: string,
  quality: number = 0.5
): Promise<SleepRewardResult> {
  const durationMs = endedAt - startedAt;
  const durationSeconds = durationMs / 1000;
  const durationHours = durationMs / (1000 * 60 * 60);
  const minSeconds = getMinValidSleepSeconds();

  const session: SleepSession = {
    id: `session_${Date.now()}`,
    zoneId,
    startedAt,
    endedAt,
    durationHours,
    quality,
    candiesEarned: 0,
  };

  if (durationSeconds < minSeconds) {
    return { valid: false, durationSeconds, candies: 0, slimes: [], session };
  }

  // PRD: 1 candy/hour; give at least 1 for any valid session
  const candies = Math.max(MIN_CANDIES_FOR_VALID_SESSION, Math.floor(durationHours * CANDIES_PER_HOUR));
  session.candiesEarned = candies;

  const spawnTable = await getZoneSpawnWeights(zoneId);
  const slimes: Slime[] = [];
  const count = Math.min(3, Math.max(1, Math.floor(durationSeconds / minSeconds))); // 1–3 slimes
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
