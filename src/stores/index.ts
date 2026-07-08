// Re-export stores for app use.
export { useCandiesStore } from './useCandiesStore';
export { useCollectionStore } from './useCollectionStore';
export { useSleepStore } from './useSleepStore';
export { useEquippedSlimeStore, hydrateEquippedSlimeFromDb } from './useEquippedSlimeStore';
export {
  useSoundSettingsStore,
  hydrateSoundSettingsFromDb,
  isMusicEnabled,
  isSfxEnabled,
  getMusicVolume,
  getSfxVolume,
} from './useSoundSettingsStore';
export { useDevSettingsStore, isDevSlimepediaUnlocked } from './useDevSettingsStore';
export {
  useFoilAnimationStore,
  collectionGridFoilMotion,
  type FoilMotion,
} from './useFoilAnimationStore';
export { useCollectionRevealStore } from './useCollectionRevealStore';
export { useCandyCollectStore, type CandyPillWindowRect } from './useCandyCollectStore';
export {
  useTutorialStore,
  hydrateTutorialFromDb,
  useTutorialStepComplete,
  useTutorialCompletedSteps,
  type TutorialStepId,
} from './useTutorialStore';
export { useTutorialOnboardingLocked, isTutorialOnboardingLocked } from '@/src/utils/tutorialOnboardingLock';
