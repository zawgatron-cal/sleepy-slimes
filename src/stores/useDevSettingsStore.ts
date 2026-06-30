/**
 * Dev-only toggles (__DEV__ screens should gate reads with __DEV__).
 */

import { create } from 'zustand';

interface DevSettingsStore {
  unlockSlimepedia: boolean;
  slimeArtCacheBust: number;
  /** Replace sleep slime rolls with a fixed 5-tier reveal sequence. */
  fixedTierRevealTest: boolean;
  setUnlockSlimepedia: (enabled: boolean) => void;
  bumpSlimeArtCache: () => void;
  setFixedTierRevealTest: (enabled: boolean) => void;
}

export const useDevSettingsStore = create<DevSettingsStore>((set) => ({
  unlockSlimepedia: false,
  slimeArtCacheBust: 0,
  fixedTierRevealTest: false,
  setUnlockSlimepedia: (enabled) => set({ unlockSlimepedia: enabled }),
  bumpSlimeArtCache: () =>
    set((state) => ({ slimeArtCacheBust: state.slimeArtCacheBust + 1 })),
  setFixedTierRevealTest: (enabled) => set({ fixedTierRevealTest: enabled }),
}));

export function isDevSlimepediaUnlocked(): boolean {
  return __DEV__ && useDevSettingsStore.getState().unlockSlimepedia;
}
