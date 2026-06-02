/**
 * Sleep consistency via circular mean resultant length (bed + wake times).
 * Uses the most recent N sessions with a known wake time.
 */

import { SLEEP_DATA_CONSISTENCY_LOOKBACK } from '@/src/constants/sleepDataScreen';
import type { SleepSession } from '@/src/types';

const MINUTES_PER_DAY = 1440;
const TWO_PI = 2 * Math.PI;

export function minutesFromMidnight(epochMs: number): number {
  const d = new Date(epochMs);
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

function meanResultantLength(timesMinutes: readonly number[]): number {
  const n = timesMinutes.length;
  if (n === 0) return 0;

  let sumSin = 0;
  let sumCos = 0;
  for (const t of timesMinutes) {
    const theta = (t / MINUTES_PER_DAY) * TWO_PI;
    sumSin += Math.sin(theta);
    sumCos += Math.cos(theta);
  }

  const meanSin = sumSin / n;
  const meanCos = sumCos / n;
  return Math.sqrt(meanSin * meanSin + meanCos * meanCos);
}

export function getSessionWakeEpochMs(session: SleepSession): number | null {
  if (session.endedAt != null) return session.endedAt;
  if (session.durationHours > 0) {
    return session.startedAt + session.durationHours * 3600 * 1000;
  }
  return null;
}

/** Score in [0, 1], or null when there are no usable sessions. */
export function computeSleepConsistencyScore(
  sessions: readonly SleepSession[],
  lookback = SLEEP_DATA_CONSISTENCY_LOOKBACK
): number | null {
  const recent = [...sessions]
    .filter((s) => s.startedAt > 0 && getSessionWakeEpochMs(s) != null)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, lookback);

  if (recent.length === 0) return null;

  const bedtimes = recent.map((s) => minutesFromMidnight(s.startedAt));
  const waketimes = recent.map((s) => minutesFromMidnight(getSessionWakeEpochMs(s)!));

  const rBedtime = meanResultantLength(bedtimes);
  const rWake = meanResultantLength(waketimes);
  return (rBedtime + rWake) / 2;
}

export function formatSleepConsistencyScore(score: number | null): string {
  if (score == null) return '—';
  return score.toFixed(1);
}
