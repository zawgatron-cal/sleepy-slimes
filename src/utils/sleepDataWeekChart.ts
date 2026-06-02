/**
 * Weekly bar chart data for the Sleep Data screen (Mon–Sun of current week).
 */

import { SLEEP_DATA_CHART_MIN_HOURS } from '@/src/constants/sleepDataScreen';
import type { SleepSession } from '@/src/types';

const DAY_MS = 24 * 60 * 60 * 1000;

export const SLEEP_DATA_WEEKDAY_LABELS = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
] as const;

export type SleepDataWeekday = (typeof SLEEP_DATA_WEEKDAY_LABELS)[number];

export type SleepDataWeekDay = {
  date: Date;
  weekday: SleepDataWeekday;
  dayNum: number;
  hours: number;
};

function getMondayWeekStart(reference: Date): Date {
  const d = new Date(reference);
  d.setHours(0, 0, 0, 0);
  const diffToMonday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diffToMonday);
  return d;
}

export function buildSleepDataWeekDays(
  sessions: readonly SleepSession[],
  reference = new Date()
): SleepDataWeekDay[] {
  const monday = getMondayWeekStart(reference);
  return SLEEP_DATA_WEEKDAY_LABELS.map((weekday, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const startMs = date.getTime();
    const endMs = startMs + DAY_MS;
    const hours = sessions
      .filter((s) => s.startedAt >= startMs && s.startedAt < endMs)
      .reduce((sum, s) => sum + (s.durationHours || 0), 0);
    return { date, weekday, dayNum: date.getDate(), hours };
  });
}

export function getSleepDataWeekMonthLabel(weekDays: readonly SleepDataWeekDay[]): string {
  return weekDays[0]?.date.toLocaleString(undefined, { month: 'long' }) ?? '';
}

/** Y-axis max for the week chart — scales up when any day exceeds the minimum. */
export function getSleepDataChartMaxHours(
  weekDays: readonly Pick<SleepDataWeekDay, 'hours'>[]
): number {
  const peak = weekDays.reduce((max, day) => Math.max(max, day.hours), 0);
  if (peak <= SLEEP_DATA_CHART_MIN_HOURS) {
    return SLEEP_DATA_CHART_MIN_HOURS;
  }
  return Math.ceil(peak);
}
