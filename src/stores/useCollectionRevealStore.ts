/**
 * Slime IDs queued for pop-in animation when entering Collection after sleep.
 */

import { create } from 'zustand';

interface CollectionRevealStore {
  pendingSlimeIds: string[];
  isRevealing: boolean;
  setPendingSlimeIds: (ids: string[]) => void;
  clearPendingSlimeIds: () => void;
  setRevealing: (isRevealing: boolean) => void;
}

export const useCollectionRevealStore = create<CollectionRevealStore>((set) => ({
  pendingSlimeIds: [],
  isRevealing: false,
  setPendingSlimeIds: (pendingSlimeIds) => set({ pendingSlimeIds }),
  clearPendingSlimeIds: () => set({ pendingSlimeIds: [] }),
  setRevealing: (isRevealing) => set({ isRevealing }),
}));
