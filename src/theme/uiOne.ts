/**
 * Design tokens for the ui-one.pdf overhaul (sleep loop, collection, tab bar).
 * Warm neutral palette; calm sleep-app feel.
 */

import { bedtimeModal } from '@/src/theme/bedtimeModalPalette';

export const uiOne = {
  bg: '#F4F0EA',
  bgElevated: '#FFFFFF',
  surface: '#EDE8E1',
  surfaceMuted: '#E2DCD3',
  border: '#D4CEC4',
  text: '#1F1C18',
  textMuted: '#6B6560',
  textSubtle: '#8A847C',
  primary: '#2C2824',
  primaryContrast: '#FFFFFF',
  danger: '#B33A3A',
  dangerContrast: '#FFFFFF',
  radiusLg: 20,
  radiusMd: 14,
  radiusSm: 10,
  tabBarBg: '#F8F5F0',
  tabBarBorder: '#E8E2DA',
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  /** “All ready for bed?” modal — six tunable colors live in `bedtimeModalPalette.ts` */
  bedtimeModal,
  /** Active sleep session (tiled dark UI + logo slime). */
  sleepingScreen: {
    tileBaseBg: '#222222',
    clockSalmon: '#F9A8A8',
    clockUnderline: '#F9A8A8',
    trackingText: '#FFFFFF',
    alarmText: 'rgba(255,255,255,0.9)',
    stopBg: '#F49292',
    stopBgPressed: '#E07070',
    stopText: '#FFFFFF',
    stopBorder: '#F17F7F',
  },
  /** After-sleep summary — pastel card on tiled slime silhouettes. */
  summaryScreen: {
    screenBg: '#FFE7E7',
    cardBg: '#FCC5C6',
    cardBorder: '#F2A5A6',
    bodyText: '#D56E6E',
    durationNumber: '#387EE7',
    titleFill: '#F2A5A6',
    titleStroke: '#C96363',
    ctaBg: '#F49292',
    ctaPressed: '#E07070',
    ctaText: '#FFFFFF',
    ctaBorder: '#F17F7F',
  },
} as const;
