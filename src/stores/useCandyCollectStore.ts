/**
 * Coordinates sleep candy-collect overlay with the header `CandyCounterPill`.
 */

import { create } from 'zustand';
import { candyCollectScrimOpacity } from '@/src/components/sleep/candyCollectScrimOpacity';
import { areRevealAnimationsEnabled } from '@/src/stores/useAnimationSettingsStore';

export type CandyPillWindowRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

interface CandyCollectStore {
  active: boolean;
  overlayVisible: boolean;
  candiesEarned: number;
  displayCount: number | null;
  targetRect: CandyPillWindowRect | null;
  pulseGeneration: number;
  onOverlayComplete: (() => void) | null;
  showOverlay: (candiesEarned: number) => void;
  setOnOverlayComplete: (handler: (() => void) | null) => void;
  begin: (startCount: number) => void;
  setDisplayCount: (count: number) => void;
  setTargetRect: (rect: CandyPillWindowRect) => void;
  pulse: () => void;
  reset: () => void;
}

export const useCandyCollectStore = create<CandyCollectStore>((set, get) => ({
  active: false,
  overlayVisible: false,
  candiesEarned: 0,
  displayCount: null,
  targetRect: null,
  pulseGeneration: 0,
  onOverlayComplete: null,
  showOverlay: (candiesEarned) => {
    if (!areRevealAnimationsEnabled()) {
      set({ overlayVisible: false, candiesEarned });
      const complete = get().onOverlayComplete;
      if (complete) {
        queueMicrotask(() => complete());
      }
      return;
    }
    set({ overlayVisible: true, candiesEarned });
  },
  setOnOverlayComplete: (onOverlayComplete) => set({ onOverlayComplete }),
  begin: (startCount) =>
    set({ active: true, displayCount: startCount, pulseGeneration: 0 }),
  setDisplayCount: (displayCount) => set({ displayCount }),
  setTargetRect: (targetRect) => set({ targetRect }),
  pulse: () => set((s) => ({ pulseGeneration: s.pulseGeneration + 1 })),
  reset: () => {
    candyCollectScrimOpacity.setValue(0);
    set({
      active: false,
      overlayVisible: false,
      candiesEarned: 0,
      displayCount: null,
      targetRect: null,
      pulseGeneration: 0,
    });
  },
}));
