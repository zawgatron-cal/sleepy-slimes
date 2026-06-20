/**
 * Coordinates sleep candy-collect overlay with the header `CandyCounterPill`.
 */

import { create } from 'zustand';
import { candyCollectScrimOpacity } from '@/src/components/sleep/candyCollectScrimOpacity';

export type CandyPillWindowRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface CandyCollectStore {
  active: boolean;
  displayCount: number | null;
  targetRect: CandyPillWindowRect | null;
  pulseGeneration: number;
  begin: (startCount: number) => void;
  setDisplayCount: (count: number) => void;
  setTargetRect: (rect: CandyPillWindowRect) => void;
  pulse: () => void;
  reset: () => void;
}

export const useCandyCollectStore = create<CandyCollectStore>((set) => ({
  active: false,
  displayCount: null,
  targetRect: null,
  pulseGeneration: 0,
  begin: (startCount) =>
    set({ active: true, displayCount: startCount, pulseGeneration: 0 }),
  setDisplayCount: (displayCount) => set({ displayCount }),
  setTargetRect: (targetRect) => set({ targetRect }),
  pulse: () => set((s) => ({ pulseGeneration: s.pulseGeneration + 1 })),
  reset: () => {
    candyCollectScrimOpacity.setValue(0);
    set({ active: false, displayCount: null, targetRect: null, pulseGeneration: 0 });
  },
}));
