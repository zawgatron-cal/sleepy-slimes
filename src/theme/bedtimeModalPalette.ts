/**
 * Bedtime confirmation modal (“All ready for bed?”) — edit these six colors to retint the sheet.
 * Other values (white on-accent text, pill fill, scrim) are fixed in `buildBedtimeModalTokens`.
 */

export const bedtimeModalPalette = {
  /** Border on outlined alarm pills (“No alarm”, “Set” when inactive) */
  outlineStroke: '#FFD8D8',

  /** Modal panel background */
  surface: '#FFF8F8',

  /** Brand / emphasis: filled CTAs, active pills, labels, divider bar, title fill */
  accent: '#FFA3A3',

  /** Darker accent for pressed filled buttons */
  accentDeep: '#F49292',

  /** Rim on filled accent controls + SVG halo behind the title */
  onAccentStroke: '#F17F7F',

  /** Outer border of the modal card */
  frameStroke: '#EA7E7E',
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
    textOnAccent: '#FFFFFF',
    pillInactiveBg: p.surface,
    divider: p.accent,
    overlay: 'rgba(60, 40, 40, 0.35)',
  } as const;
}

export const bedtimeModal = buildBedtimeModalTokens(bedtimeModalPalette);
