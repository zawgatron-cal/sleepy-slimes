import type { TutorialStepId } from '@/src/constants/tutorial';

type UnlockCheck = {
  hydrated: boolean;
  isStepComplete: (step: TutorialStepId) => boolean;
  isOnboardingComplete: boolean;
  slimesCount: number;
};

/** Collection opens after the first valid sleep. */
export function isCollectionTabUnlocked({
  hydrated,
  isStepComplete,
  isOnboardingComplete,
  slimesCount,
}: UnlockCheck): boolean {
  if (!hydrated) return false;
  if (isOnboardingComplete) return true;
  return isStepComplete('start_sleep') || slimesCount > 0;
}

/** Fusion opens after Kate unlocks it in the buddy follow-up. */
export function isFusionTabUnlocked({
  hydrated,
  isStepComplete,
  isOnboardingComplete,
}: UnlockCheck): boolean {
  if (!hydrated) return false;
  if (isOnboardingComplete) return true;
  return isStepComplete('fuse_unlock');
}
