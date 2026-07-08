/**
 * Contextual tutorial progress — persisted in player_settings.
 */

import { create } from 'zustand';
import { TUTORIAL_STEPS, type TutorialStepId } from '@/src/constants/tutorial';
import { PLAYER_SETTING_KEYS } from '@/src/constants/playerSettings';
import { getPlayerSetting, setPlayerSetting } from '@/src/db';

export type { TutorialStepId };

interface TutorialStore {
  hydrated: boolean;
  completedSteps: TutorialStepId[];
  fusionIntroSeen: boolean;
  /** Session flag — player opened the Fuse tab (tap prompt can dismiss). */
  fuseTabOpened: boolean;
  /** Set when the player closes the buddy slime modal — triggers Kate's fuse unlock dialogue. */
  fuseUnlockRequested: boolean;
  hydrate: (steps: TutorialStepId[]) => void;
  isStepComplete: (step: TutorialStepId) => boolean;
  completeStep: (step: TutorialStepId) => void;
  requestFuseUnlockTutorial: () => void;
  clearFuseUnlockRequest: () => void;
  markFusionIntroSeen: () => void;
  markFuseTabOpened: () => void;
  resetFusionIntroSeen: () => void;
  /** Dev / testing — replace completed steps and persist. */
  setCompletedSteps: (steps: TutorialStepId[]) => void;
  /** Clear all tutorial progress. */
  resetTutorial: () => void;
  isOnboardingComplete: () => boolean;
}

function isTutorialStepId(value: string): value is TutorialStepId {
  return (TUTORIAL_STEPS as readonly string[]).includes(value);
}

export const useTutorialStore = create<TutorialStore>((set, get) => ({
  hydrated: false,
  completedSteps: [],
  fusionIntroSeen: false,
  fuseTabOpened: false,
  fuseUnlockRequested: false,
  hydrate: (steps) => set({ hydrated: true, completedSteps: steps }),
  isStepComplete: (step) => get().completedSteps.includes(step),
  completeStep: (step) => {
    if (get().completedSteps.includes(step)) return;
    const completedSteps = [...get().completedSteps, step];
    set({ completedSteps });
    void setPlayerSetting(
      PLAYER_SETTING_KEYS.TUTORIAL_COMPLETED_STEPS,
      JSON.stringify(completedSteps)
    ).catch((err) => console.warn('Tutorial persist failed:', err));
  },
  markFusionIntroSeen: () => set({ fusionIntroSeen: true }),
  markFuseTabOpened: () => set({ fuseTabOpened: true }),
  requestFuseUnlockTutorial: () => set({ fuseUnlockRequested: true }),
  clearFuseUnlockRequest: () => set({ fuseUnlockRequested: false }),
  resetFusionIntroSeen: () => set({ fusionIntroSeen: false, fuseTabOpened: false }),
  setCompletedSteps: (steps) => {
    const completedSteps = steps.filter(
      (s, i) => TUTORIAL_STEPS.includes(s) && steps.indexOf(s) === i
    );
    set({ completedSteps, fusionIntroSeen: false, fuseUnlockRequested: false, fuseTabOpened: false });
    void setPlayerSetting(
      PLAYER_SETTING_KEYS.TUTORIAL_COMPLETED_STEPS,
      completedSteps.length > 0 ? JSON.stringify(completedSteps) : null
    ).catch((err) => console.warn('Tutorial persist failed:', err));
  },
  resetTutorial: () => {
    set({ completedSteps: [], fusionIntroSeen: false, fuseUnlockRequested: false, fuseTabOpened: false });
    void setPlayerSetting(PLAYER_SETTING_KEYS.TUTORIAL_COMPLETED_STEPS, null).catch((err) =>
      console.warn('Tutorial reset failed:', err)
    );
  },
  isOnboardingComplete: () => get().completedSteps.includes('fusion_guide'),
}));

/** Subscribe to a single step — re-renders when completedSteps changes. */
export function useTutorialStepComplete(step: TutorialStepId): boolean {
  return useTutorialStore((s) => s.completedSteps.includes(step));
}

export function useTutorialCompletedSteps(): TutorialStepId[] {
  return useTutorialStore((s) => s.completedSteps);
}

export async function hydrateTutorialFromDb(): Promise<void> {
  const raw = await getPlayerSetting(PLAYER_SETTING_KEYS.TUTORIAL_COMPLETED_STEPS);
  if (!raw) {
    useTutorialStore.getState().hydrate([]);
    return;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const steps = Array.isArray(parsed)
      ? parsed.filter((s): s is TutorialStepId => typeof s === 'string' && isTutorialStepId(s))
      : [];
    useTutorialStore.getState().hydrate(steps);
  } catch {
    useTutorialStore.getState().hydrate([]);
  }
}
