/**
 * Scale display font size from string length (and optional width).
 * Reference baseline: "Grass Slime" (11 characters).
 */

export type FitTextSizeConfig = {
  /** Character count at the ideal size (default 11 — "Grass Slime"). */
  referenceLength?: number;
  sizeAtReference: number;
  minSize: number;
  maxSize: number;
  /** Character count where length-based scaling reaches `minSize`. */
  longLength?: number;
  /** Shorter strings may scale up toward `maxSize`. */
  scaleUpForShort?: boolean;
  /** When set, shrink further if estimated text width exceeds this (px). */
  maxWidth?: number;
  /** Estimated glyph width ≈ fontSize × ratio (Itim ~0.52). */
  charWidthRatio?: number;
};

export type FitTextSvgLayout = {
  heightRatio?: number;
  baselineRatio?: number;
  fixedHeight?: number;
  /** baselineY = fontSize + baselineOffset */
  baselineOffset?: number;
};

export type FitTextPresetDef = FitTextSizeConfig & {
  svg?: FitTextSvgLayout;
};

/** Named presets — tune once, reuse on cards, CTAs, and outlined SVG titles. */
export const FIT_TEXT_PRESETS = {
  /** Slimepedia species detail title (SVG). */
  slimepediaDetailTitle: {
    referenceLength: 11,
    sizeAtReference: 40,
    minSize: 20,
    maxSize: 44,
    longLength: 31,
    scaleUpForShort: true,
    charWidthRatio: 0.52,
    svg: { heightRatio: 1.12, baselineRatio: 0.9 },
  },
  /** Collection grid card name (RN Text). */
  collectionCardName: {
    referenceLength: 11,
    sizeAtReference: 18,
    minSize: 10,
    maxSize: 18,
    longLength: 22,
  },
  /** Slimepedia grid card name (RN Text). */
  slimepediaGridName: {
    referenceLength: 11,
    sizeAtReference: 11,
    minSize: 7,
    maxSize: 11,
    longLength: 22,
    charWidthRatio: 0.52,
  },
  /** Collection slime detail modal name (RN Text); baseline "Grass Slime". */
  collectionDetailSlimeName: {
    referenceLength: 11,
    sizeAtReference: 26,
    minSize: 15,
    maxSize: 26,
    longLength: 26,
    charWidthRatio: 0.52,
    maxWidth: 200,
  },
  /** Fusion slot name (RN Text). */
  fusionSlotName: {
    referenceLength: 11,
    sizeAtReference: 22,
    minSize: 12,
    maxSize: 22,
    longLength: 22,
  },
  /** Sleep reveal species name (SVG). */
  sleepRevealSpeciesName: {
    referenceLength: 10,
    sizeAtReference: 42,
    minSize: 22,
    maxSize: 42,
    longLength: 22,
    svg: { fixedHeight: 54, baselineOffset: 6 },
  },
} as const satisfies Record<string, FitTextPresetDef>;

export type FitTextPresetKey = keyof typeof FIT_TEXT_PRESETS;

const DEFAULT_REF_LEN = 11;

export function resolveFitTextConfig(
  fit: FitTextPresetKey | FitTextSizeConfig,
): FitTextPresetDef {
  return typeof fit === 'string' ? FIT_TEXT_PRESETS[fit] : fit;
}

export function fitTextSize(text: string, config: FitTextSizeConfig): number {
  const n = text.trim().length;
  const refLen = config.referenceLength ?? DEFAULT_REF_LEN;
  const longLen = config.longLength ?? refLen + 11;
  let size = config.sizeAtReference;

  if (n > refLen && longLen > refLen) {
    const t = Math.min(1, (n - refLen) / (longLen - refLen));
    size = Math.round(config.sizeAtReference + t * (config.minSize - config.sizeAtReference));
  } else if (n < refLen && config.scaleUpForShort) {
    const t = (refLen - n) / refLen;
    size = Math.round(config.sizeAtReference + t * (config.maxSize - config.sizeAtReference));
  }

  const ratio = config.charWidthRatio;
  if (ratio && config.maxWidth != null && config.maxWidth > 0 && n > 0) {
    const estWidth = n * size * ratio;
    if (estWidth > config.maxWidth) {
      size = Math.max(config.minSize, Math.floor(config.maxWidth / (n * ratio)));
    }
  }

  return Math.min(config.maxSize, Math.max(config.minSize, size));
}

export type FitTextSvgMetrics = {
  fontSize: number;
  height: number;
  baselineY: number;
};

export function fitTextSvgMetrics(
  fontSize: number,
  layout?: FitTextSvgLayout,
): FitTextSvgMetrics {
  if (layout?.fixedHeight != null) {
    return {
      fontSize,
      height: layout.fixedHeight,
      baselineY: fontSize + (layout.baselineOffset ?? 6),
    };
  }
  const height = Math.round(fontSize * (layout?.heightRatio ?? 1.15));
  const baselineY = Math.round(height * (layout?.baselineRatio ?? 0.78));
  return { fontSize, height, baselineY };
}

/** Length + optional width → SVG outlined label metrics. */
export function fitTextSvgMetricsForText(
  text: string,
  fit: FitTextPresetKey | FitTextSizeConfig,
  maxWidth?: number,
): FitTextSvgMetrics {
  const preset = resolveFitTextConfig(fit);
  const { svg, ...sizeConfig } = preset;
  const fontSize = fitTextSize(text, {
    ...sizeConfig,
    maxWidth: maxWidth ?? sizeConfig.maxWidth,
    charWidthRatio: sizeConfig.charWidthRatio,
  });
  return fitTextSvgMetrics(fontSize, svg);
}
