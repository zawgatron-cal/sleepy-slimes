/**
 * Which slime instance is equipped during sleep (counts toward level-up nights).
 */

import { create } from 'zustand';
import { getEquippedSlimeId, setEquippedSlimeId as persistEquippedSlimeId } from '@/src/db';

interface EquippedSlimeStore {
  equippedSlimeId: string | null;
  setEquippedSlimeId: (id: string | null) => void;
  hydrate: (id: string | null) => void;
  reset: () => void;
}

export const useEquippedSlimeStore = create<EquippedSlimeStore>((set) => ({
  equippedSlimeId: null,
  setEquippedSlimeId: (id) => {
    set({ equippedSlimeId: id });
    void persistEquippedSlimeId(id).catch((err) =>
      console.warn('Equipped slime persist failed:', err)
    );
  },
  hydrate: (equippedSlimeId) => set({ equippedSlimeId }),
  reset: () => set({ equippedSlimeId: null }),
}));

export async function hydrateEquippedSlimeFromDb(): Promise<void> {
  const id = await getEquippedSlimeId();
  useEquippedSlimeStore.getState().hydrate(id);
}
