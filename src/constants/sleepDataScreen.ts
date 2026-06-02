/** Sleep Data screen layout and copy constants. */

/** Info / stat pill layout (172px wide per design). */
export const SLEEP_DATA_INFO_PILL = {
  width: 172,
  minHeight: 76,
  labelFontSize: 14,
  labelLineHeight: 16,
  valueFontSize: 28,
  valueLineHeight: 30,
} as const;

/** Sleep log row + swipe-delete action share one corner radius. */
export const SLEEP_DATA_LOG_ENTRY_BORDER_RADIUS = 12;

/** Max sleep sessions shown in the Sleep Data log (most recent first). */
export const SLEEP_DATA_LOG_MAX_SESSIONS = 14;

/** Minimum chart Y-axis when the week's peak is at or below this (hours). */
export const SLEEP_DATA_CHART_MIN_HOURS = 8;

/** Sessions used for avg duration, quality, and consistency stats. */
export const SLEEP_DATA_CONSISTENCY_LOOKBACK = 7;
export const SLEEP_DATA_QUALITY_LOOKBACK = 7;

export const SLEEP_DATA_INFO_COPY = {
  quality: {
    title: 'Avg Sleep Quality',
    body:
      'Average of your last 7 sessions. Each night is scored 0–1 from hours slept vs an 8-hour target using a bell curve that drops faster when you undersleep (σ = 1.5h) than when you oversleep (σ = 2.5h).',
  },
  consistency: {
    title: 'Sleep Consistency',
    body:
      'A score from 0 to 1 based on your last 7 sleep sessions. Bedtimes and wake times are compared on a 24-hour clock (so midnight wraparound is handled correctly). 1 means perfectly regular; 0 means very scattered.',
  },
} as const;
