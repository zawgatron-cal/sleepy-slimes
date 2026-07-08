import type { Router } from 'expo-router';
import { preloadCollectionForTransition } from '@/src/services/collectionPreload';
import { useCollectionRevealStore } from '@/src/stores';

/** Same handoff as sleep → collection: grid pop-in for new slimes. */
export function navigateToCollectionWithReveal(
  router: Pick<Router, 'navigate'>,
  slimeIds: string[]
): void {
  if (slimeIds.length === 0) return;

  useCollectionRevealStore.getState().queueReveal(slimeIds);
  void preloadCollectionForTransition().catch((e) => {
    console.warn('Collection preload failed', e);
  });

  setTimeout(() => {
    router.navigate('/(tabs)/collection');
  }, 180);
}
