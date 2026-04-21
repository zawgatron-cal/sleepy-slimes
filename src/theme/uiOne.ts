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
  radiusLg: 40,
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
  /**
   * Sleep tab idle — light pink “kawaii” shell (matches mock: rose borders, soft fills).
   * Reuse these tokens anywhere a matching pink screen is needed.
   */
  sleepIdle: {
    screenBg: '#FFE8E8', // rgba(255, 231, 231, 1)
    roseBorder: '#F49292', // rgba(201, 99, 99, 1) — hand-drawn style accent
    roseBorderStrong: '#A35D58', // rgba(163, 93, 88, 1)
    pillFill: '#FCC5C6', // rgba(255, 227, 227, 1)
    pillText: '#F49292', // rgba(255, 227, 227, 1) — light label on rose
    pillTextMuted: '#F4B8B8', // rgba(244, 184, 184, 1)
    heroFill: '#F49292', // rgba(244, 146, 146, 1)
    heroText: '#FFFFFF',
    zoneSelectBlue: '#387EE7', // rgba(56, 126, 231, 1) — Clash-style selection ring
    menuIcon: '#F49292',
  },
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
