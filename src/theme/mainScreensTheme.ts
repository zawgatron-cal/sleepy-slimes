/**
 * Main tab surfaces — Fuse, Sleep (idle + flow), Slimepedia — plus global tab bar.
 * Each hex is paired with an rgba(...) comment (alpha 1 unless noted).
 *
 * Layer vocabulary: `bg` = screen canvas, `surface` = cards/panels on top.
 */

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

/** Shared tokens (primary … tabSelectedShadow) for sleep-adjacent tab screens. */
const idle = {
  primary: '#2C2824', // rgba(44, 40, 36, 1)
  bg: '#FFE8E8', // rgba(255, 232, 232, 1)
  border: '#F49292', // rgba(244, 146, 146, 1)
  primaryText: '#A35D58', // rgba(163, 93, 88, 1)
  specialTextFill: '#FFE6E6', // rgba(255, 230, 230, 1)
  specialTextBorder: '#EA7E7E', // rgba(234, 126, 126, 1)
  ...TAB_BAR,
  surface: '#FCC5C6', // rgba(252, 197, 198, 1)
  menuIcon: '#F49292', // rgba(244, 146, 146, 1)
  mutedText: '#8A847C', // rgba(138, 132, 124, 1)
} as const;

const sleep = {
  primary: '#F49292', // rgba(244, 146, 146, 1)
  bg: '#FFE7E7', // rgba(255, 231, 231, 1)
  border: '#F2A5A6', // rgba(242, 165, 166, 1)
  primaryText: '#F49292', // rgba(213, 110, 110, 1)
  specialTextFill: '#F2A5A6', // rgba(242, 165, 166, 1)
  specialTextBorder: '#C96363', // rgba(201, 99, 99, 1)
  ...TAB_BAR,
  tracking: {
    bg: '#222222', // rgba(34, 34, 34, 1)
    clockSalmon: '#F9A8A8', // rgba(249, 168, 168, 1)
    clockUnderline: '#F9A8A8', // rgba(249, 168, 168, 1)
    trackingText: '#FFFFFF', // rgba(255, 255, 255, 1)
    alarmText: 'rgba(255,255,255,0.9)', // same (alpha 0.9)
    stopBg: '#F49292', // rgba(244, 146, 146, 1)
    stopBgPressed: '#E07070', // rgba(224, 112, 112, 1)
    stopText: '#FFFFFF', // rgba(255, 255, 255, 1)
    stopBorder: '#F17F7F', // rgba(241, 127, 127, 1)
  },
  summary: {
    bg: '#FFE7E7', // rgba(255, 231, 231, 1)
    surface: '#FCC5C6', // rgba(252, 197, 198, 1)
    border: '#F2A5A6', // rgba(242, 165, 166, 1)
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
    revealCtaText: '#F2A5A6', // rgba(242, 165, 166, 1)
    revealCtaBorder: '#F2A5A6', // rgba(242, 165, 166, 1)
  },
  bedtimeModal: {
    surface: '#FFF8F8', // rgba(255, 248, 248, 1)
    border: '#EA7E7E', // rgba(234, 126, 126, 1)
    accent: '#FFA3A3', // rgba(255, 163, 163, 1)
    accentPressed: '#F49292', // rgba(244, 146, 146, 1)
    outlineStroke: '#FFD8D8', // rgba(255, 216, 216, 1)
    onAccentStroke: '#F17F7F', // rgba(241, 127, 127, 1)
    textSalmon: '#FFA3A3', // rgba(255, 163, 163, 1)
    textOnAccent: '#FFFFFF', // rgba(255, 255, 255, 1)
    divider: '#FFA3A3', // rgba(255, 163, 163, 1)
    overlay: 'rgba(60, 40, 40, 0.35)', // scrim (alpha 0.35)
  },
} as const;

const slimepedia = {
  surface: '#FCC5C6', // rgba(252, 197, 198, 1) — grid cards
  bg: '#FFE8E8', // rgba(255, 232, 232, 1) — catalog pink body below decal
  contentWhite: '#FFFFFF', // rgba(255, 255, 255, 1) — header / scroll chrome above decal
  undiscovered: '#2A2A2A', // rgba(42, 42, 42, 1)
  slimeName: '#C96363', // rgba(201, 99, 99, 1)
  setChrome: '#7D3F3F', // rgba(125, 63, 63, 1)
  setEmptyText: '#FCC5C6', // rgba(252, 197, 198, 1) — same as surface
  emptySlot: '#5A3535', // rgba(90, 53, 53, 1)
  titleFill: '#FFE6E6', // rgba(255, 230, 230, 1)
  titleStroke: '#C96363', // rgba(201, 99, 99, 1)
  detail: {
    bg: '#FCC5C6', // rgba(252, 197, 198, 1) — species detail screen canvas
    surface: '#F17F7F', // rgba(241, 127, 127, 1) — main card
    pill: '#875253', // rgba(135, 82, 83, 1)
    label: '#875253', // rgba(135, 82, 83, 1)
    text: '#FFFFFF', // rgba(255, 255, 255, 1)
    titleStroke: '#000000', // rgba(0, 0, 0, 1)
    starEmpty: '#000000', // rgba(0, 0, 0, 1)
  },
} as const;

const fuse = {
  primary: sleep.primary,
  bg: sleep.bg,
  border: sleep.border,
  primaryText: sleep.primaryText,
  specialTextFill: sleep.specialTextFill,
  specialTextBorder: sleep.specialTextBorder,
  tabFill: sleep.tabFill,
  tabShadow: sleep.tabShadow,
  tabSelectedFill: sleep.tabSelectedFill,
  tabSelectedShadow: sleep.tabSelectedShadow,
  surface: sleep.summary.surface,
  elevated: '#FFFFFF', // rgba(255, 255, 255, 1)
  hintMuted: '#C69C9C', // rgba(224, 166, 166, 1)
  disabledButtonBg: '#DAB4B4', // rgba(231, 179, 179, 1)
  disabledButtonBorder: '#C69C9C', // rgba(213, 155, 155, 1)
  disabledButtonText: '#EBC8C8', // rgba(246, 220, 220, 1)
  disabledButtonTextBorder: '#C69C9C',
  slotSurface: '#E8A7A7', // rgba(232, 167, 167, 1)
  slotSilhouette: '#DB9696',
} as const;

/** Sleep Data screen — weekly chart, stats grid, log. */
const sleepData = {
  bg: '#FFE8E8', // rgba(255, 232, 232, 1) — screen canvas
  sectionTitle: '#7D3F3F', // rgba(125, 63, 63, 1) — main text
  statCard: '#F49292', // rgba(244, 146, 146, 1) — stat / other-data panels
  statLabel: '#7D3F3F',
  statValue: '#7D3F3F',
  chartBg: '#7D3F3F',
  chartBorder: '#F49292',
  chartLabel: '#FFE8E8', // graph axis / day labels
  chartBar: '#FFE8E8',
  actionButtonBg: '#7D3F3F',
  actionButtonText: '#FFE8E8',
  logPanel: '#F49292', // sleep log container
  logRow: '#FFE8E8', // sleep log entry rows
  logRowBorder: '#F49292',
  logText: '#7D3F3F',
  logMuted: '#7D3F3F',
  deleteBg: '#D94444', // rgba(217, 68, 68, 1) — swipe-delete action
  infoIcon: '#7D3F3F',
} as const;

/** Settings screen — matches Sleep Data palette. */
const settings = {
  bg: sleepData.bg,
  sectionTitle: sleepData.sectionTitle,
  panel: sleepData.statCard,
  rowLabel: sleepData.statLabel,
  rowValue: sleepData.statValue,
  rowMuted: sleepData.logMuted,
  actionButtonBg: sleepData.actionButtonBg,
  actionButtonText: sleepData.actionButtonText,
  switchTrackOn: sleepData.actionButtonBg,
  switchTrackOff: '#DAB4B4',
  switchThumbOn: sleepData.actionButtonText,
  switchThumbOff: '#FFFFFF',
  volumeTrack: '#FFE8E8',
  volumeFill: sleepData.actionButtonBg,
  volumeThumb: sleepData.actionButtonText,
  volumeThumbBorder: sleepData.actionButtonBg,
  volumeLabel: sleepData.statLabel,
} as const;

const collection = {
  detailModal: {
    bg: '#FCC5C6',
    border: '#B57F7F',
    surface: '#FFA8A8',
    /** Slightly darker than `surface` — progress bar night dividers. */
    progressDivider: '#F09090',
    accent: '#AB4E4E',
    buddyEffectNumber: '#387EE7',
    progressTrack: '#FFFFFF',
    levelUpText: '#FFFFFF',
    variantText: idle.primary,
    overlay: 'rgba(40, 28, 28, 0.62)',
    favoriteStarFavBorder: '#FBE9A3',
    favoriteStarFavFill: '#E5C65F',
    favoriteStarUnfavBorder: '#3B382E',
    favoriteStarUnfavFill: '#2A2A2A',
  },
} as const;

export const mainScreens = {
  idle,
  sleepData,
  settings,
  collection,
  fuse,
  slimepedia,
  sleep,
  shared: {
    onPrimary: '#FFFFFF', // rgba(255, 255, 255, 1)
  },
  cardShadow: {
    shadowColor: '#000', // rgba(0, 0, 0, 1)
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  tabBar: TAB_BAR_CHROME,
} as const;

export type MainScreens = typeof mainScreens;
