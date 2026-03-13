/**
 * Candies store — universal currency (PRD).
 * Earned: 1 candy/hour base + sleep quality bonus + streak bonus.
 * Spent: fusion only. No premium currency at MVP.
 */

import { create } from 'zustand';
import { upsertCandiesState } from '@/src/db';

interface CandiesStore {
  /** Current candy balance. */
  total: number;
  /** Last update timestamp (epoch ms). */
  lastUpdatedAt: number;
  add: (amount: number) => void;
  spend: (amount: number) => boolean;
  setTotal: (total: number) => void;
  hydrate: (state: { total: number; lastUpdatedAt: number }) => void;
  reset: () => void;
}

const initialState = { total: 0, lastUpdatedAt: Date.now() };

export const useCandiesStore = create<CandiesStore>((set) => ({
  ...initialState,
  add: (amount) =>
    set((state) => {
      const total = state.total + amount;
      const lastUpdatedAt = Date.now();
      void upsertCandiesState(total, lastUpdatedAt).catch((err) =>
        console.warn('Candies persist failed:', err)
      );
      return { total, lastUpdatedAt };
    }),
  spend: (amount) => {
    let ok = false;
    set((state) => {
      if (state.total >= amount) {
        ok = true;
        const total = state.total - amount;
        const lastUpdatedAt = Date.now();
        void upsertCandiesState(total, lastUpdatedAt).catch((err) =>
          console.warn('Candies persist failed:', err)
        );
        return { total, lastUpdatedAt };
      }
      return state;
    });
    return ok;
  },
  setTotal: (total) =>
    set(() => {
      const lastUpdatedAt = Date.now();
      void upsertCandiesState(total, lastUpdatedAt).catch((err) =>
        console.warn('Candies persist failed:', err)
      );
      return { total, lastUpdatedAt };
    }),
  hydrate: ({ total, lastUpdatedAt }) => set({ total, lastUpdatedAt }),
  reset: () =>
    set(() => {
      void upsertCandiesState(initialState.total, initialState.lastUpdatedAt).catch((err) =>
        console.warn('Candies persist failed:', err)
      );
      return initialState;
    }),
}));
