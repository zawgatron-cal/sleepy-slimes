/**
 * Sleep store — current session, zone, and streaks (PRD).
 * Tracks: active session (start/stop), selected zone, duration/quality (manual or from times).
 * Phases: idle → tracking → summary (rewards) → reveal (slimes one by one).
 */

import { create } from 'zustand';
import type { Slime } from '@/src/types';
import { ZONES } from '@/src/data';

export type SleepPhase = 'idle' | 'tracking' | 'summary' | 'reveal';

interface SleepStore {
  phase: SleepPhase;
  /** Zone selected for this session (or next). */
  selectedZoneId: string;
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
  /** Hours slept for the session that produced summary (for summary UI). */
  summaryDurationHours: number;
  summarySlimes: Slime[];
  /** Species first discovered in the session that produced summary (for reveal "New!" badge). */
  newSpeciesIds: string[];
  /** Slimes to show one-by-one in reveal phase. */
  slimesToReveal: Slime[];
  revealIndex: number;

  /** Alarm time (epoch ms). Null = no alarm. */
  alarmAt: number | null;

  setPhase: (phase: SleepPhase) => void;
  setAlarmAt: (ms: number | null) => void;
  setSelectedZone: (zoneId: string) => void;
  startSession: (alarmAt?: number | null) => void;
  /** Resume tracking after app relaunch (from persisted active session). */
  resumeSession: (payload: {
    startedAt: number;
    zoneId: string;
    alarmAt: number | null;
  }) => void;
  endSession: () => void;
  setSessionEndedAt: (ms: number | null) => void;
  setSummaryRewards: (
    candies: number,
    slimes: Slime[],
    durationHours: number,
    newSpeciesIds?: string[]
  ) => void;
  startReveal: () => void;
  nextReveal: () => void;
  finishReveal: () => void;
  setDurationHours: (hours: number) => void;
  setQuality: (q: number) => void;
  setStreak: (current: number, longest: number, lastDate: string | null) => void;
  reset: () => void;
}

const DEFAULT_ZONE_ID = ZONES.GRASSY_MEADOW.id;

const initialRewards = {
  summaryCandies: 0,
  summaryDurationHours: 0,
  summarySlimes: [] as Slime[],
  newSpeciesIds: [] as string[],
  slimesToReveal: [] as Slime[],
  revealIndex: 0,
};

export const useSleepStore = create<SleepStore>((set, get) => ({
  phase: 'idle',
  selectedZoneId: DEFAULT_ZONE_ID,
  sessionStartedAt: null,
  sessionEndedAt: null,
  alarmAt: null,
  durationHours: 0,
  quality: 0.5,
  currentStreak: 0,
  longestStreak: 0,
  lastStreakDate: null,
  ...initialRewards,

  setPhase: (phase) => set({ phase }),
  setAlarmAt: (alarmAt) => set({ alarmAt }),
  setSelectedZone: (selectedZoneId) => set({ selectedZoneId }),
  startSession: (alarmAt?: number | null) =>
    set((s) => ({
      phase: 'tracking',
      sessionStartedAt: Date.now(),
      sessionEndedAt: null,
      // Use passed value when provided (including null = no alarm); only fall back to previous when undefined.
      alarmAt: alarmAt !== undefined ? alarmAt : (s.alarmAt ?? null),
    })),
  resumeSession: ({ startedAt, zoneId, alarmAt }) =>
    set({
      phase: 'tracking',
      sessionStartedAt: startedAt,
      sessionEndedAt: null,
      selectedZoneId: zoneId,
      alarmAt,
    }),
  endSession: () =>
    set({ phase: 'idle', sessionStartedAt: null, sessionEndedAt: null, alarmAt: null }),
  setSessionEndedAt: (sessionEndedAt) => set({ sessionEndedAt }),
  setSummaryRewards: (summaryCandies, summarySlimes, summaryDurationHours, newSpeciesIds = []) =>
    set({
      phase: 'summary',
      summaryCandies,
      summaryDurationHours,
      summarySlimes,
      newSpeciesIds,
    }),
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
      selectedZoneId: DEFAULT_ZONE_ID,
      sessionStartedAt: null,
      sessionEndedAt: null,
      alarmAt: null,
      durationHours: 0,
      quality: 0.5,
      currentStreak: 0,
      longestStreak: 0,
      lastStreakDate: null,
      ...initialRewards,
    }),
}));
