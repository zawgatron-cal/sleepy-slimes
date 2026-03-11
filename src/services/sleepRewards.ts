/**
 * Sleep reward logic: validate session (min 30s), compute candies and spawn slimes.
 * PRD: 1 candy/hour base; slimes from species by zone. Valid session = >= 30 seconds.
 */

import { getMinValidSleepSeconds } from '../constants/sleep';
import { getSpecies } from '@/src/db';
import type { Slime, SleepSession, ZoneId } from '@/src/types';

const CANDIES_PER_HOUR = 1;
const MIN_CANDIES_FOR_VALID_SESSION = 1;

export interface SleepRewardResult {
  valid: boolean;
  durationSeconds: number;
  candies: number;
  slimes: Slime[];
  session: SleepSession;
}

/**
 * Validate duration >= 30s, compute candies and slimes, build session object.
 * Does not persist; caller should insertSleepSession, insertSlime, update stores.
 */
export async function computeSleepRewards(
  startedAt: number,
  endedAt: number,
  zoneId: ZoneId,
  quality: number = 0.5
): Promise<SleepRewardResult> {
  const durationMs = endedAt - startedAt;
  const durationSeconds = durationMs / 1000;
  const durationHours = durationMs / (1000 * 60 * 60);
  const minSeconds = getMinValidSleepSeconds();

  const session: SleepSession = {
    id: `session_${startedAt}`,
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

  const allSpecies = await getSpecies();
  const spawnable = allSpecies.filter((s) => !s.fusionOnly);
  const slimes: Slime[] = [];
  const minSec = getMinValidSleepSeconds();
  const count = Math.min(3, Math.max(1, Math.floor(durationSeconds / minSec))); // 1–3 slimes
  for (let i = 0; i < count && spawnable.length > 0; i++) {
    const species = spawnable[Math.floor(Math.random() * spawnable.length)];
    slimes.push({
      id: `slime_${endedAt}_${i}_${Math.random().toString(36).slice(2, 9)}`,
      speciesId: species.id,
      acquiredAt: endedAt,
      source: 'sleep',
    });
  }

  return { valid: true, durationSeconds, candies, slimes, session };
}
