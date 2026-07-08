/**
 * Slime IDs queued for pop-in animation when entering Collection after sleep/fusion.
 */

import { create } from 'zustand';

interface CollectionRevealStore {
  pendingSlimeIds: string[];
  /** Bumps whenever a reveal is queued — collection listens while focused. */
  revealTrigger: number;
  isRevealing: boolean;
  queueReveal: (ids: string[]) => void;
  setPendingSlimeIds: (ids: string[]) => void;
  clearPendingSlimeIds: () => void;
  setRevealing: (isRevealing: boolean) => void;
}

export const useCollectionRevealStore = create<CollectionRevealStore>((set) => ({
  pendingSlimeIds: [],
  revealTrigger: 0,
  isRevealing: false,
  queueReveal: (ids) =>
    set((state) => ({
      pendingSlimeIds: ids,
      revealTrigger: state.revealTrigger + 1,
    })),
  setPendingSlimeIds: (pendingSlimeIds) => set({ pendingSlimeIds }),
  clearPendingSlimeIds: () => set({ pendingSlimeIds: [] }),
  setRevealing: (isRevealing) => set({ isRevealing }),
}));
