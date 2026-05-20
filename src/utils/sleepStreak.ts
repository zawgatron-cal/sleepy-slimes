/**
 * Derive streak stats from completed sleep sessions (local calendar days).
 */

import type { SleepSession } from '@/src/types';
import { MIN_VALID_SLEEP_SECONDS } from '@/src/constants/game';

function localDateKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDaysToKey(key: string, delta: number): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + delta);
  return localDateKey(dt.getTime());
}

function isValidSessionForStreak(s: SleepSession): boolean {
  const seconds = Math.max(0, s.durationHours * 3600);
  return seconds >= MIN_VALID_SLEEP_SECONDS;
}

function sessionDayKey(s: SleepSession): string | null {
  const t = s.endedAt ?? s.startedAt;
  return localDateKey(t);
}

export function computeStreakStats(sessions: SleepSession[]): {
  currentStreak: number;
  longestStreak: number;
  lastStreakDate: string | null;
} {
  const daySet = new Set<string>();
  for (const s of sessions) {
    if (!isValidSessionForStreak(s)) continue;
    const key = sessionDayKey(s);
    if (key) daySet.add(key);
  }

  if (daySet.size === 0) {
    return { currentStreak: 0, longestStreak: 0, lastStreakDate: null };
  }

  const sorted = [...daySet].sort();

  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === addDaysToKey(sorted[i - 1], 1)) {
      run++;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 1;
    }
  }

  const today = localDateKey(Date.now());
  const yesterday = addDaysToKey(today, -1);

  let anchor: string | null = null;
  if (daySet.has(today)) anchor = today;
  else if (daySet.has(yesterday)) anchor = yesterday;

  let currentStreak = 0;
  let lastStreakDate: string | null = null;

  if (anchor) {
    lastStreakDate = anchor;
    let d = anchor;
    while (daySet.has(d)) {
      currentStreak++;
      d = addDaysToKey(d, -1);
    }
  }

  return { currentStreak, longestStreak, lastStreakDate };
}
