/**
 * Warm collection data + slime artwork before navigating from sleep → collection.
 */

import { Asset } from 'expo-asset';
import { getSpecies, getSlimes } from '@/src/db';
import { useCollectionStore } from '@/src/stores';
import { getSlimeImageSourcesForPreload } from '@/src/utils/slimeAssets';
import type { Species } from '@/src/types';
import { SLEEP_TRACKING_LOGO } from '@/src/constants/sleepTrackingAssets';

let cachedSpecies: Species[] | null = null;
let preloadReady = false;

export function isCollectionPreloadReady(): boolean {
  return preloadReady;
}

export function getCachedCollectionSpecies(): Species[] | null {
  return cachedSpecies;
}

export async function preloadCollectionForTransition(): Promise<void> {
  const [species, dbSlimes] = await Promise.all([getSpecies(), getSlimes()]);
  cachedSpecies = species;

  const store = useCollectionStore.getState();
  store.setSlimes(dbSlimes);
  store.setLoading(false);

  const speciesIds = dbSlimes.map((slime) => slime.speciesId);
  await Asset.loadAsync([
    SLEEP_TRACKING_LOGO,
    ...getSlimeImageSourcesForPreload(speciesIds),
  ]);
  preloadReady = true;
}
