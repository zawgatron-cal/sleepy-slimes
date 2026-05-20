/**
 * Collection store — player's slime inventory (PRD).
 * Slimes are stored in SQLite; this store holds in-memory state for the current session
 * and syncs with DB. Baseline: simple array; can be replaced with DB-backed list later.
 */

import { create } from 'zustand';
import type { Slime } from '@/src/types';

interface CollectionStore {
  slimes: Slime[];
  isLoading: boolean;
  setSlimes: (slimes: Slime[]) => void;
  addSlime: (slime: Slime) => void;
  removeSlime: (id: string) => void;
  updateSlime: (id: string, patch: Partial<Slime>) => void;
  getSlimeById: (id: string) => Slime | undefined;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const initialState = { slimes: [], isLoading: false };

export const useCollectionStore = create<CollectionStore>((set, get) => ({
  ...initialState,
  setSlimes: (slimes) => set({ slimes }),
  addSlime: (slime) => set((state) => ({ slimes: [...state.slimes, slime] })),
  removeSlime: (id) =>
    set((state) => ({ slimes: state.slimes.filter((s) => s.id !== id) })),
  updateSlime: (id, patch) =>
    set((state) => ({
      slimes: state.slimes.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    })),
  getSlimeById: (id) => get().slimes.find((s) => s.id === id),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set(initialState),
}));
