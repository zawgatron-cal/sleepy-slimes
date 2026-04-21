/**
 * Bedtime confirmation modal (“All ready for bed?”) — edit these six colors to retint the sheet.
 * Other values (white on-accent text, pill fill, scrim) are fixed in `buildBedtimeModalTokens`.
 * Each hex is paired with an rgba(...) comment (alpha 1 unless noted).
 */

export const bedtimeModalPalette = {
  /** Border on outlined alarm pills (“No alarm”, “Set” when inactive) */
  outlineStroke: '#FFD8D8', // rgba(255, 216, 216, 1)

  /** Modal panel background */
  surface: '#FFF8F8', // rgba(255, 248, 248, 1)

  /** Brand / emphasis: filled CTAs, active pills, labels, divider bar, title fill */
  accent: '#FFA3A3', // rgba(255, 163, 163, 1)

  /** Darker accent for pressed filled buttons */
  accentDeep: '#F49292', // rgba(244, 146, 146, 1)

  /** Rim on filled accent controls + SVG halo behind the title */
  onAccentStroke: '#F17F7F', // rgba(241, 127, 127, 1)

  /** Outer border of the modal card */
  frameStroke: '#EA7E7E', // rgba(234, 126, 126, 1)
} as const;

export type BedtimeModalPalette = typeof bedtimeModalPalette;

export function buildBedtimeModalTokens(p: BedtimeModalPalette) {
  return {
    bg: p.surface,
    border: p.frameStroke,
    accent: p.accent,
    accentPressed: p.accentDeep,
    outlineStroke: p.outlineStroke,
    onAccentStroke: p.onAccentStroke,
    textSalmon: p.accent,
    titleStroke: p.onAccentStroke,
    textOnAccent: '#FFFFFF', // rgba(255, 255, 255, 1)
    pillInactiveBg: p.surface,
    divider: p.accent,
    overlay: 'rgba(60, 40, 40, 0.35)', // already rgba
  } as const;
}

export const bedtimeModal = buildBedtimeModalTokens(bedtimeModalPalette);
