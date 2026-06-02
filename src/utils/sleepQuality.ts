/**
 * Sleep quality from duration using an asymmetric Gaussian (bell) around a target.
 * Undersleeping is penalized more sharply than oversleeping (σ_L < σ_R).
 */

import { SLEEP_DATA_QUALITY_LOOKBACK } from '@/src/constants/sleepDataScreen';
import type { SleepSession } from '@/src/types';

export const SLEEP_QUALITY_TARGET_HOURS = 8;
export const SLEEP_QUALITY_SIGMA_LEFT = 1.5;
export const SLEEP_QUALITY_SIGMA_RIGHT = 2.5;

export function computeSleepQualityScore(
  hours: number,
  mu = SLEEP_QUALITY_TARGET_HOURS,
  sigmaLeft = SLEEP_QUALITY_SIGMA_LEFT,
  sigmaRight = SLEEP_QUALITY_SIGMA_RIGHT
): number {
  if (!Number.isFinite(hours) || hours < 0) return 0;

  const diff = hours - mu;
  const sigma = diff < 0 ? sigmaLeft : sigmaRight;
  return Math.exp(-(diff * diff) / (2 * sigma * sigma));
}

/** Prefer duration-based score so legacy rows with placeholder quality still display correctly. */
export function getSessionSleepQuality(
  session: Pick<SleepSession, 'durationHours' | 'quality'>
): number {
  if (session.durationHours > 0) {
    return computeSleepQualityScore(session.durationHours);
  }
  return session.quality;
}

export function computeAverageSleepQuality(
  sessions: readonly SleepSession[],
  lookback = SLEEP_DATA_QUALITY_LOOKBACK
): number | null {
  const recent = [...sessions]
    .filter((s) => s.durationHours > 0)
    .sort((a, b) => b.startedAt - a.startedAt)
    .slice(0, lookback);

  if (recent.length === 0) return null;

  const sum = recent.reduce((acc, s) => acc + computeSleepQualityScore(s.durationHours), 0);
  return sum / recent.length;
}

export function formatSleepQualityScore(score: number | null): string {
  if (score == null) return '—';
  return score.toFixed(1);
}
