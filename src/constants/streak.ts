import { STREAK_BONUS_MIN_STREAK, STREAK_CANDY_FLAT_BONUS } from '@/src/constants/game';
import type { StreakIconVariant } from '@/src/components/StreakGlyph';

export const STREAK_INFO_TITLE = 'Sleep Streak';

export const STREAK_INFO_INTRO = `Sleep on consecutive nights to build your sleep streak. After ${STREAK_BONUS_MIN_STREAK} nights in a row, you earn +${STREAK_CANDY_FLAT_BONUS} bonus candies and better odds of finding 3 slimes per sleep session.`;

export const STREAK_INFO_GRACE =
  'You have up to 48 hours between sleeps before the streak resets, as long as you do not miss two local nights in a row.';

export const STREAK_INFO_ICON_LEGEND: ReadonlyArray<{
  variant: StreakIconVariant;
  label: string;
}> = [
  { variant: 'inactive', label: 'No streak' },
  { variant: 'small', label: 'Streak started' },
  { variant: 'active', label: 'Bonus active' },
];
