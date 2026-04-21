/**
 * Main tab surfaces — Fuse, Sleep (idle + flow), Collection — plus global tab bar.
 * Each hex is paired with an rgba(...) comment (alpha 1 unless noted).
 */

import { bedtimeModal } from '@/src/theme/bedtimeModalPalette';

const TAB_BAR = {
  tabFill: '#FFE3E3', // rgba(255, 227, 227, 1)
  tabShadow: '#F8ADAD', // rgba(248, 173, 173, 1)
  tabSelectedFill: '#F49292', // rgba(244, 146, 146, 1)
  tabSelectedShadow: '#BF5454', // rgba(191, 84, 84, 1)
} as const;

const TAB_BAR_CHROME = {
  containerBg: '#4A4A4A', // rgba(74, 74, 74, 1)
  labelActive: '#FFE3E3', // rgba(255, 227, 227, 1)
  labelInactive: '#F8ADAD', // rgba(248, 173, 173, 1)
  buttonRadius: 7,
  buttonShadowOffset: 4,
  tabBarHeightIOS: 104,
  tabBarHeightAndroid: 82,
  horizontalGap: 6,
} as const;

/** Ten shared tokens (primary … tabSelectedShadow) for each main “screen family”. */
const idle = {
  primary: '#2C2824', // rgba(44, 40, 36, 1)
  bg: '#FFE8E8', // rgba(255, 232, 232, 1)
  borderOne: '#F49292', // rgba(244, 146, 146, 1)
  primaryText: '#A35D58', // rgba(163, 93, 88, 1)
  specialTextFill: '#FFE6E6', // rgba(255, 230, 230, 1)
  specialTextBorder: '#EA7E7E', // rgba(234, 126, 126, 1)
  ...TAB_BAR,
  /** Pills, candy/streak, zone chrome */
  surface: '#FCC5C6', // rgba(252, 197, 198, 1)
  menuIcon: '#F49292', // rgba(244, 146, 146, 1)
  zoneSelectRing: '#387EE7', // rgba(56, 126, 231, 1)
  /** Captions, dev links */
  mutedText: '#8A847C', // rgba(138, 132, 124, 1)
} as const;

const neutral = {
  primary: '#2C2824', // rgba(44, 40, 36, 1)
  bg: '#F4F0EA', // rgba(244, 240, 234, 1)
  borderOne: '#D4CEC4', // rgba(212, 206, 196, 1)
  primaryText: '#1F1C18', // rgba(31, 28, 24, 1)
  specialTextFill: '#FFFFFF', // rgba(255, 255, 255, 1)
  specialTextBorder: '#6B6560', // rgba(107, 101, 96, 1)
  ...TAB_BAR,
  surface: '#EDE8E1', // rgba(237, 232, 225, 1)
  surfaceMuted: '#E2DCD3', // rgba(226, 220, 211, 1)
  elevated: '#FFFFFF', // rgba(255, 255, 255, 1)
  mutedText: '#6B6560', // rgba(107, 101, 96, 1)
  placeholder: '#8A847C', // rgba(138, 132, 124, 1)
} as const;

const sleep = {
  primary: '#F49292', // rgba(244, 146, 146, 1)
  bg: '#FFE7E7', // rgba(255, 231, 231, 1)
  borderOne: '#F2A5A6', // rgba(242, 165, 166, 1)
  primaryText: '#D56E6E', // rgba(213, 110, 110, 1)
  specialTextFill: '#F2A5A6', // rgba(242, 165, 166, 1)
  specialTextBorder: '#C96363', // rgba(201, 99, 99, 1)
  ...TAB_BAR,
  /** Dark tracking screen */
  tracking: {
    tileBaseBg: '#222222', // rgba(34, 34, 34, 1)
    clockSalmon: '#F9A8A8', // rgba(249, 168, 168, 1)
    clockUnderline: '#F9A8A8', // rgba(249, 168, 168, 1)
    trackingText: '#FFFFFF', // rgba(255, 255, 255, 1)
    alarmText: 'rgba(255,255,255,0.9)', // same (alpha 0.9)
    stopBg: '#F49292', // rgba(244, 146, 146, 1)
    stopBgPressed: '#E07070', // rgba(224, 112, 112, 1)
    stopText: '#FFFFFF', // rgba(255, 255, 255, 1)
    stopBorder: '#F17F7F', // rgba(241, 127, 127, 1)
  },
  /** Summary + reveal (post-sleep) */
  summary: {
    screenBg: '#FFE7E7', // rgba(255, 231, 231, 1)
    cardBg: '#FCC5C6', // rgba(252, 197, 198, 1)
    cardBorder: '#F2A5A6', // rgba(242, 165, 166, 1)
    bodyText: '#D56E6E', // rgba(213, 110, 110, 1)
    durationNumber: '#387EE7', // rgba(56, 126, 231, 1)
    titleFill: '#F2A5A6', // rgba(242, 165, 166, 1)
    titleStroke: '#C96363', // rgba(201, 99, 99, 1)
    ctaBg: '#F49292', // rgba(244, 146, 146, 1)
    ctaPressed: '#E07070', // rgba(224, 112, 112, 1)
    ctaText: '#FFFFFF', // rgba(255, 255, 255, 1)
    ctaBorder: '#F17F7F', // rgba(241, 127, 127, 1)
    innerPanel: '#F49292', // rgba(244, 146, 146, 1)
    nameStroke: '#A23030', // rgba(162, 48, 48, 1)
    nameFill: '#FFE7E7', // rgba(255, 231, 231, 1)
    revealCtaBg: '#FCC5C6', // rgba(252, 197, 198, 1)
    revealCtaText: '#F2A5A6', // rgba(242, 165, 166, 1)
    revealCtaBorder: '#F2A5A6', // rgba(242, 165, 166, 1)
  },
} as const;

export const mainScreens = {
  idle,
  /** Fuse tab (lab / slots). */
  fuse: neutral,
  /** Collection tab — same neutral shell as fuse. */
  collection: neutral,
  /** In-flow sleep: tracking + summary + reveal. */
  sleep,
  shared: {
    onPrimary: '#FFFFFF', // rgba(255, 255, 255, 1)
  },
  cardShadow: {
    shadowColor: '#000', // rgba(0, 0, 0, 1)
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, // iOS shadow alpha (uses shadowColor above)
    shadowRadius: 6,
    elevation: 2,
  },
  bedtimeModal,
  tabBar: TAB_BAR_CHROME,
} as const;

export type MainScreens = typeof mainScreens;
