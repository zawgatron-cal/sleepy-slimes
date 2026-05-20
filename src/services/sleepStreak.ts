/**
 * Sleep streak rules (PRD 2.4):
 * - Grace: streak continues if the new session starts < 48h after the previous session’s start.
 * - Also break if two local calendar nights are missed between starts.
 * - First ever session counts as streak 1 for reward scaling.
 */

import type { SleepSession } from '@/src/types';

const GRACE_MS = 48 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Whole local calendar days between the two start timestamps (can be 0, 1, 2, …). */
function calendarDaysApart(prevStartedAt: number, nextStartedAt: number): number {
  return Math.round((startOfLocalDay(nextStartedAt) - startOfLocalDay(prevStartedAt)) / DAY_MS);
}

/**
 * Whether the streak chain breaks before `nextStartedAt`.
 * Break if gap ≥ 48h since previous start, or two missed local nights (`calendarDaysApart - 1 >= 2`).
 */
export function shouldBreakStreak(prevStartedAt: number, nextStartedAt: number): boolean {
  if (nextStartedAt <= prevStartedAt) return true;
  const gapMs = nextStartedAt - prevStartedAt;
  if (gapMs >= GRACE_MS) return true;
  const nightsMissed = calendarDaysApart(prevStartedAt, nextStartedAt) - 1;
  return nightsMissed >= 2;
}

export type SleepStreakSummary = {
  currentStreak: number;
  longestStreak: number;
  /** Local calendar date (YYYY-MM-DD) of the latest session start in the chain. */
  lastStreakDate: string | null;
};

function toLocalYmd(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** `sessions` may be any order; uses each session's `startedAt`. */
export function computeStreakSummaryFromSessions(sessions: Pick<SleepSession, 'startedAt'>[]): SleepStreakSummary {
  if (sessions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, lastStreakDate: null };
  }
  const asc = [...sessions].sort((a, b) => a.startedAt - b.startedAt);
  let cur = 0;
  let longest = 0;
  for (let i = 0; i < asc.length; i++) {
    if (i === 0) cur = 1;
    else if (shouldBreakStreak(asc[i - 1].startedAt, asc[i].startedAt)) cur = 1;
    else cur += 1;
    longest = Math.max(longest, cur);
  }
  const last = asc[asc.length - 1]!;
  return { currentStreak: cur, longestStreak: longest, lastStreakDate: toLocalYmd(last.startedAt) };
}

/**
 * Streak index for the session being started at `newStartedAt` (not yet in DB).
 * Used for reward scaling: 1 = first / reset night, 2 = second night in a row, etc.
 */
export function streakValueForNewSession(
  existingSessions: Pick<SleepSession, 'startedAt'>[],
  newStartedAt: number
): number {
  if (existingSessions.length === 0) return 1;
  const asc = [...existingSessions].sort((a, b) => a.startedAt - b.startedAt);
  const last = asc[asc.length - 1]!;
  if (shouldBreakStreak(last.startedAt, newStartedAt)) return 1;

  let cur = 0;
  for (let i = 0; i < asc.length; i++) {
    if (i === 0) cur = 1;
    else if (shouldBreakStreak(asc[i - 1]!.startedAt, asc[i]!.startedAt)) cur = 1;
    else cur += 1;
  }
  return cur + 1;
}
