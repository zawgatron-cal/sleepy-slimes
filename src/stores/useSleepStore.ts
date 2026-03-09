/**
 * Sleep store — current session, zone, and streaks (PRD).
 * Tracks: active session (start/stop), selected zone, duration/quality (manual or from times).
 * Phases: idle → tracking → summary (rewards) → reveal (slimes one by one).
 */

import { create } from 'zustand';
import type { ZoneId } from '@/src/types';
import type { Slime } from '@/src/types';

export type SleepPhase = 'idle' | 'tracking' | 'summary' | 'reveal';

interface SleepStore {
  phase: SleepPhase;
  /** Zone selected for this session (or next). */
  selectedZoneId: ZoneId;
  /** When current session started (epoch ms). Set when user taps "Sleep". */
  sessionStartedAt: number | null;
  /** When session ended (epoch ms). Set when user taps "Stop sleeping". */
  sessionEndedAt: number | null;
  /** Manual duration in hours (for morning log). */
  durationHours: number;
  /** Sleep quality 0–1 or 1–5 (for morning log). */
  quality: number;
  /** Consecutive days with completed sleep. */
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string | null;

  /** Rewards from last valid session (summary phase). */
  summaryCandies: number;
  summarySlimes: Slime[];
  /** Slimes to show one-by-one in reveal phase. */
  slimesToReveal: Slime[];
  revealIndex: number;

  setPhase: (phase: SleepPhase) => void;
  setSelectedZone: (zoneId: ZoneId) => void;
  startSession: () => void;
  endSession: () => void;
  setSessionEndedAt: (ms: number | null) => void;
  setSummaryRewards: (candies: number, slimes: Slime[]) => void;
  startReveal: () => void;
  nextReveal: () => void;
  finishReveal: () => void;
  setDurationHours: (hours: number) => void;
  setQuality: (q: number) => void;
  setStreak: (current: number, longest: number, lastDate: string | null) => void;
  reset: () => void;
}

const defaultZone: ZoneId = 'cozy_bedroom';

const initialRewards = {
  summaryCandies: 0,
  summarySlimes: [] as Slime[],
  slimesToReveal: [] as Slime[],
  revealIndex: 0,
};

export const useSleepStore = create<SleepStore>((set, get) => ({
  phase: 'idle',
  selectedZoneId: defaultZone,
  sessionStartedAt: null,
  sessionEndedAt: null,
  durationHours: 0,
  quality: 0.5,
  currentStreak: 0,
  longestStreak: 0,
  lastStreakDate: null,
  ...initialRewards,

  setPhase: (phase) => set({ phase }),
  setSelectedZone: (selectedZoneId) => set({ selectedZoneId }),
  startSession: () =>
    set({ phase: 'tracking', sessionStartedAt: Date.now(), sessionEndedAt: null }),
  endSession: () =>
    set({ phase: 'idle', sessionStartedAt: null, sessionEndedAt: null }),
  setSessionEndedAt: (sessionEndedAt) => set({ sessionEndedAt }),
  setSummaryRewards: (summaryCandies, summarySlimes) =>
    set({ phase: 'summary', summaryCandies, summarySlimes }),
  startReveal: () => {
    const { summarySlimes } = get();
    set({ phase: 'reveal', slimesToReveal: [...summarySlimes], revealIndex: 0 });
  },
  nextReveal: () =>
    set((s) => ({ revealIndex: s.revealIndex + 1 })),
  finishReveal: () =>
    set({ phase: 'idle', ...initialRewards }),

  setDurationHours: (durationHours) => set({ durationHours }),
  setQuality: (quality) => set({ quality }),
  setStreak: (currentStreak, longestStreak, lastStreakDate) =>
    set({ currentStreak, longestStreak, lastStreakDate }),
  reset: () =>
    set({
      phase: 'idle',
      selectedZoneId: defaultZone,
      sessionStartedAt: null,
      sessionEndedAt: null,
      durationHours: 0,
      quality: 0.5,
      currentStreak: 0,
      longestStreak: 0,
      lastStreakDate: null,
      ...initialRewards,
    }),
}));
