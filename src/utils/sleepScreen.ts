/**
 * Pure helpers for the sleep tab: time display, alarm scheduling math, reveal ordering.
 */

import type { SleepSession, Slime, Species } from '@/src/types';

/** 12-hour time string for UI (e.g. "9:05 AM"). */
export function formatTime(ms: number): string {
  const d = new Date(ms);
  const h = d.getHours();
  const m = d.getMinutes();
  const am = h < 12;
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${am ? 'AM' : 'PM'}`;
}

/**
 * Next occurrence of `time`'s clock today or tomorrow, relative to `now`.
 * Daytime window (9:00–21:59): if that time today is still in the future, use it; else tomorrow.
 * Late night / early morning: always treat as "tomorrow" from product rules.
 */
export function computeNextAlarmDateFromTime(time: Date, now: Date = new Date()): Date {
  const hours = time.getHours();
  const minutes = time.getMinutes();

  const candidate = new Date(now);
  candidate.setHours(hours, minutes, 0, 0);

  const inDayWindow = hours >= 9 && hours < 22;

  if (inDayWindow) {
    if (candidate > now) return candidate;
    candidate.setDate(candidate.getDate() + 1);
    return candidate;
  }

  candidate.setDate(candidate.getDate() + 1);
  return candidate;
}

/** Default alarm picker anchor: 9:00 AM, snapped through `computeNextAlarmDateFromTime`. */
export function getDefaultAlarmDate(): Date {
  const base = new Date();
  base.setHours(9, 0, 0, 0);
  return computeNextAlarmDateFromTime(base);
}

/**
 * Mutates `slimes`: lower tier first, then by species id (rarer slimes later in reveal order).
 */
export function sortSlimesByTierForReveal(slimes: Slime[], speciesList: Species[]): void {
  const tierOf = (speciesId: string) =>
    speciesList.find((s) => s.id === speciesId)?.tier ?? 0;
  slimes.sort((a, b) => {
    const ta = tierOf(a.speciesId);
    const tb = tierOf(b.speciesId);
    if (ta !== tb) return ta - tb;
    return a.speciesId.localeCompare(b.speciesId);
  });
}

/** Summary card: value + suffix for "You slept for … hours/minutes". */
export function formatSleepDurationSummary(hours: number): { value: string; suffix: string } {
  if (hours < 1 / 60) return { value: '0', suffix: 'minutes' };
  if (hours < 1) {
    const mins = Math.max(1, Math.round(hours * 60));
    return { value: String(mins), suffix: 'minutes' };
  }
  const rounded = Math.round(hours * 10) / 10;
  const value = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return { value, suffix: 'hours' };
}

/** Human-readable duration from fractional hours (e.g. "2h 30m", "45m"). */
export function formatDurationHours(durationHours: number): string {
  const totalMinutes = Math.max(0, Math.round(durationHours * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Sleep log UI only shows sessions from the last N days. */
export const SLEEP_LOG_VISIBLE_DAYS = 14;

export function filterSleepSessionsSince(
  sessions: readonly SleepSession[],
  days: number,
  nowMs: number = Date.now()
): SleepSession[] {
  const cutoff = nowMs - days * DAY_MS;
  return sessions.filter((s) => s.startedAt >= cutoff);
}
