import { create } from 'zustand';
import type { ZoneUnlockProgress } from '@/src/utils/zoneUnlock';

interface ZoneUnlockStore extends ZoneUnlockProgress {
  hydrated: boolean;
  hydrate: (progress: ZoneUnlockProgress) => void;
  reset: () => void;
}

const initialState: ZoneUnlockProgress & { hydrated: boolean } = {
  hydrated: false,
  ultraRareDiscoveryCount: 0,
  candies: 0,
  unlockedZoneIds: [],
};

export const useZoneUnlockStore = create<ZoneUnlockStore>((set) => ({
  ...initialState,
  hydrate: (progress) => set({ ...progress, hydrated: true }),
  reset: () => set(initialState),
}));
