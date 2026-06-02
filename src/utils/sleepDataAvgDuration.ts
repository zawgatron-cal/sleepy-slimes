/**
 * Average sleep duration for the Sleep Data stats pill.
 */

import { SLEEP_DATA_QUALITY_LOOKBACK } from '@/src/constants/sleepDataScreen';
import type { SleepSession } from '@/src/types';

export function computeAverageSleepDurationHours(
  sessions: readonly SleepSession[],
  lookback = SLEEP_DATA_QUALITY_LOOKBACK
): number | null {
  const recent = [...sessions]
    .filter((s) => s.durationHours > 0)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, lookback);

  if (recent.length === 0) return null;

  const sum = recent.reduce((acc, s) => acc + s.durationHours, 0);
  return sum / recent.length;
}

/** e.g. "6 h 30 m", "1 h", "45 m" */
export function formatAverageSleepDuration(hours: number | null): string {
  if (hours == null) return '—';

  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;

  if (h <= 0) return `${m} m`;
  if (m === 0) return h === 1 ? '1 h' : `${h} h`;
  return `${h} h ${m} m`;
}
