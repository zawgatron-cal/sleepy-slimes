import { useTutorialStepComplete, useTutorialStore } from '@/src/stores/useTutorialStore';

/** True while early onboarding runs — lifts once Kate unlocks Fuse (fusion itself is optional). */
export function useTutorialOnboardingLocked(): boolean {
  const hydrated = useTutorialStore((s) => s.hydrated);
  const fuseUnlockComplete = useTutorialStepComplete('fuse_unlock');
  return hydrated && !fuseUnlockComplete;
}

export function isTutorialOnboardingLocked(): boolean {
  const { hydrated, completedSteps } = useTutorialStore.getState();
  return hydrated && !completedSteps.includes('fuse_unlock');
}
