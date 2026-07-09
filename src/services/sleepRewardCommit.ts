/**
 * Apply sleep rewards to SQLite + Zustand after a valid session.
 */

import { persistSleepRewardsAtomic } from '@/src/db';
import type { SleepRewardResult } from '@/src/services/sleepRewards';
import { recordEquippedSlimeSleepNight } from '@/src/services/slimeProgression';
import { useCandiesStore, useCollectionStore } from '@/src/stores';

/** Persist rewards atomically, then sync in-memory stores. */
export async function commitSleepRewards(result: SleepRewardResult): Promise<void> {
  if (!result.valid) {
    throw new Error('Cannot commit rewards for an invalid session');
  }

  const candiesState = useCandiesStore.getState();
  const candyTotal = candiesState.total + result.candies;
  const candyLastUpdatedAt = Date.now();

  await persistSleepRewardsAtomic({
    session: result.session,
    slimes: result.slimes,
    candyTotal,
    candyLastUpdatedAt,
  });

  useCandiesStore.getState().hydrate({ total: candyTotal, lastUpdatedAt: candyLastUpdatedAt });

  for (const slime of result.slimes) {
    useCollectionStore.getState().addSlime(slime);
  }

  const { maybeQueueZoneUnlockTutorial } = await import('@/src/services/tutorialZoneUnlock');
  const discoveredSpeciesIds = [...new Set(result.slimes.map((slime) => slime.speciesId))];
  await Promise.all(discoveredSpeciesIds.map((speciesId) => maybeQueueZoneUnlockTutorial(speciesId)));

  await recordEquippedSlimeSleepNight();
}
