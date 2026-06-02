/** Sleep Data screen — placeholder metrics until scoring ships. */

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

export const SLEEP_DATA_CHART_MAX_HOURS = 8;

export const SLEEP_DATA_STATIC_AVG_DURATION = '6 h 30 m';
export const SLEEP_DATA_STATIC_CONSISTENCY = '0.5';
export const SLEEP_DATA_STATIC_AVG_QUALITY = '0.5';

export const SLEEP_DATA_INFO_COPY = {
  quality: {
    title: 'Avg Sleep Quality',
    body:
      'Sleep quality is a score from 0 to 1 for each session. This screen shows a placeholder average until the scoring system is finalized.',
  },
  consistency: {
    title: 'Sleep Consistency',
    body:
      'Sleep consistency measures how regular your sleep schedule is. This screen shows a placeholder score until the metric is implemented.',
  },
} as const;
