/**
 * Sleep store — current session, zone, and streaks (PRD).
 * Tracks: active session (start/stop), selected zone, duration/quality (manual or from times).
 * Streak and candies computation can use this + SQLite history.
 */

import { create } from 'zustand';
import type { ZoneId } from '@/src/types';

export type SleepPhase = 'idle' | 'sleeping';

interface SleepStore {
  phase: SleepPhase;
  /** Zone selected for this session (or next). */
  selectedZoneId: ZoneId;
  /** When current session started (epoch ms). Set when user taps "Start sleep". */
  sessionStartedAt: number | null;
  /** Manual duration in hours (for morning log). */
  durationHours: number;
  /** Sleep quality 0–1 or 1–5 (for morning log). */
  quality: number;
  /** Consecutive days with completed sleep. */
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string | null;

  setPhase: (phase: SleepPhase) => void;
  setSelectedZone: (zoneId: ZoneId) => void;
  startSession: () => void;
  endSession: () => void;
  setDurationHours: (hours: number) => void;
  setQuality: (q: number) => void;
  setStreak: (current: number, longest: number, lastDate: string | null) => void;
  reset: () => void;
}

const defaultZone: ZoneId = 'cozy_bedroom';

export const useSleepStore = create<SleepStore>((set) => ({
  phase: 'idle',
  selectedZoneId: defaultZone,
  sessionStartedAt: null,
  durationHours: 0,
  quality: 0.5,
  currentStreak: 0,
  longestStreak: 0,
  lastStreakDate: null,

  setPhase: (phase) => set({ phase }),
  setSelectedZone: (selectedZoneId) => set({ selectedZoneId }),
  startSession: () =>
    set({ phase: 'sleeping', sessionStartedAt: Date.now() }),
  endSession: () =>
    set({ phase: 'idle', sessionStartedAt: null }),
  setDurationHours: (durationHours) => set({ durationHours }),
  setQuality: (quality) => set({ quality }),
  setStreak: (currentStreak, longestStreak, lastStreakDate) =>
    set({ currentStreak, longestStreak, lastStreakDate }),
  reset: () =>
    set({
      phase: 'idle',
      selectedZoneId: defaultZone,
      sessionStartedAt: null,
      durationHours: 0,
      quality: 0.5,
      currentStreak: 0,
      longestStreak: 0,
      lastStreakDate: null,
    }),
}));
