/**
 * Candies store — universal currency (PRD).
 * Earned: 1 candy/hour base + sleep quality bonus + streak bonus.
 * Spent: fusion only. No premium currency at MVP.
 */

import { create } from 'zustand';

interface CandiesStore {
  /** Current candy balance. */
  total: number;
  /** Last update timestamp (epoch ms). */
  lastUpdatedAt: number;
  add: (amount: number) => void;
  spend: (amount: number) => boolean;
  setTotal: (total: number) => void;
  reset: () => void;
}

const initialState = { total: 0, lastUpdatedAt: Date.now() };

export const useCandiesStore = create<CandiesStore>((set) => ({
  ...initialState,
  add: (amount) =>
    set((state) => ({
      total: state.total + amount,
      lastUpdatedAt: Date.now(),
    })),
  spend: (amount) => {
    let ok = false;
    set((state) => {
      if (state.total >= amount) {
        ok = true;
        return { total: state.total - amount, lastUpdatedAt: Date.now() };
      }
      return state;
    });
    return ok;
  },
  setTotal: (total) => set({ total, lastUpdatedAt: Date.now() }),
  reset: () => set(initialState),
}));
