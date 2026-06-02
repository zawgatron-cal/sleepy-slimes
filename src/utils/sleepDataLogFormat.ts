/**
 * Sleep log row formatting for the Sleep Data screen.
 */

import { SLEEP_DATA_LOG_MAX_SESSIONS } from '@/src/constants/sleepDataScreen';
import { formatTime } from '@/src/utils/sleepScreen';
import type { SleepSession } from '@/src/types';

/** Most recent sleep sessions for the Sleep Data log. */
export function getSleepDataLogSessions(
  sessions: readonly SleepSession[],
  maxSessions = SLEEP_DATA_LOG_MAX_SESSIONS
): SleepSession[] {
  return [...sessions]
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, maxSessions);
}

export function formatSleepLogDate(ms: number): string {
  const d = new Date(ms);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}/${dd}`;
}

export function formatSleepLogDuration(hours: number): string {
  const totalMinutes = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(totalMinutes / 60);
  if (h <= 0) return `${totalMinutes} min`;
  return h === 1 ? '1 hr' : `${h} hrs`;
}

export function formatSleepLogTimeRange(session: SleepSession): string {
  if (session.endedAt == null) {
    return formatTime(session.startedAt);
  }
  return `${formatTime(session.startedAt)} - ${formatTime(session.endedAt)}`;
}
