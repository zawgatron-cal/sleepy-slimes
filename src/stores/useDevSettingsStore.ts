/**
 * Dev-only toggles (__DEV__ screens should gate reads with __DEV__).
 */

import { create } from 'zustand';

interface DevSettingsStore {
  unlockSlimepedia: boolean;
  slimeArtCacheBust: number;
  setUnlockSlimepedia: (enabled: boolean) => void;
  bumpSlimeArtCache: () => void;
}

export const useDevSettingsStore = create<DevSettingsStore>((set) => ({
  unlockSlimepedia: false,
  slimeArtCacheBust: 0,
  setUnlockSlimepedia: (enabled) => set({ unlockSlimepedia: enabled }),
  bumpSlimeArtCache: () =>
    set((state) => ({ slimeArtCacheBust: state.slimeArtCacheBust + 1 })),
}));

export function isDevSlimepediaUnlocked(): boolean {
  return __DEV__ && useDevSettingsStore.getState().unlockSlimepedia;
}
