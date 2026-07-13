import type { Router } from 'expo-router';
import { preloadCollectionForTransition } from '@/src/services/collectionPreload';
import { useCollectionRevealStore } from '@/src/stores';
import { areRevealAnimationsEnabled } from '@/src/stores/useAnimationSettingsStore';

/** Same handoff as sleep → collection: grid pop-in for new slimes. */
export function navigateToCollectionWithReveal(
  router: Pick<Router, 'navigate'>,
  slimeIds: string[]
): void {
  if (slimeIds.length === 0) return;

  if (areRevealAnimationsEnabled()) {
    useCollectionRevealStore.getState().queueReveal(slimeIds);
  }

  const navigate = () => router.navigate('/(tabs)/collection');

  if (areRevealAnimationsEnabled()) {
    void preloadCollectionForTransition().catch((e) => {
      console.warn('Collection preload failed', e);
    });
    setTimeout(navigate, 180);
    return;
  }

  void preloadCollectionForTransition().then(navigate).catch(() => navigate());
}
