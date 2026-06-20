/**
 * Animated gold metallic sweep (Reanimated), masked to slime silhouette in SlimeArtwork.
 * Layered color cast + hard-light body band + screen specular glint.
 */

import { memo, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import type { FoilOverlayProps } from '@/src/components/foilOverlayTypes';
import { TwinklingSparkleField } from '@/src/components/TwinklingSparkleField';

const SWEEP_PASS_MS = 9000;
const HALF_PASS_MS = SWEEP_PASS_MS / 2;
const SPECULAR_PHASE_MS = SWEEP_PASS_MS / 4;
const TILE_REPEATS = 2;
const TAU = 2 * Math.PI;

type GradientStop = { pct: number; color: string; opacity: number };

/** Warm gold metallic band — rich amber body, restrained highlights. */
const METAL_TILE: GradientStop[] = [
  { pct: 0, color: '#A87408', opacity: 0.9 },
  { pct: 0.12, color: '#B8860B', opacity: 0.91 },
  { pct: 0.24, color: '#C9941A', opacity: 0.92 },
  { pct: 0.34, color: '#D4A017', opacity: 0.94 },
  { pct: 0.42, color: '#E0AD28', opacity: 0.96 },
  { pct: 0.5, color: '#EDBE40', opacity: 1 },
  { pct: 0.58, color: '#E0AD28', opacity: 0.96 },
  { pct: 0.66, color: '#D4A017', opacity: 0.94 },
  { pct: 0.76, color: '#C9941A', opacity: 0.92 },
  { pct: 0.88, color: '#B8860B', opacity: 0.91 },
  { pct: 1, color: '#A87408', opacity: 0.9 },
];

/** Warm glint riding the main sweep. */
const SPECULAR_TILE: GradientStop[] = [
  { pct: 0, color: '#F5D060', opacity: 0 },
  { pct: 0.28, color: '#F5D060', opacity: 0 },
  { pct: 0.38, color: '#F8DA70', opacity: 0.4 },
  { pct: 0.5, color: '#FFE899', opacity: 0.72 },
  { pct: 0.62, color: '#F8DA70', opacity: 0.4 },
  { pct: 0.72, color: '#F5D060', opacity: 0 },
  { pct: 1, color: '#F5D060', opacity: 0 },
];

const METAL_BAND_WIDTH_SCALE = 8.7; // 1.45 × 6 — blanket the full sprite at 45°
const SPECULAR_BAND_WIDTH_SCALE = 3.3; // 0.55 × 6

const GOLD_SPARKLE_TINTS = ['#FFF8E1', '#FFE899', '#FFFDE7'];

type Size = { w: number; h: number };
type BandMetrics = { bandLength: number; bandWidth: number; travel: number };

function measureBand(size: Size, kind: 'metal' | 'specular'): BandMetrics {
  const { w, h } = size;
  const diagonal = Math.sqrt(w * w + h * h);
  const maxDim = Math.max(w, h);
  const cover = Math.ceil(diagonal * 1.4);
  // Thickness must span the full sprite at 45° (not just a narrow stripe).
  const bandWidth =
    kind === 'metal'
      ? Math.ceil(maxDim * METAL_BAND_WIDTH_SCALE)
      : Math.ceil(maxDim * SPECULAR_BAND_WIDTH_SCALE);
  return {
    bandLength: Math.ceil(cover * 1.9),
    bandWidth,
    travel: Math.ceil(diagonal * 0.65 + cover * 0.42),
  };
}

function buildTiledStops(stops: GradientStop[], repeats: number) {
  const step = 100 / repeats;
  return Array.from({ length: repeats }, (_, repeat) =>
    stops.map((stop) => (
      <Stop
        key={`${repeat}-${stop.pct}`}
        offset={`${repeat * step + stop.pct * step}%`}
        stopColor={stop.color}
        stopOpacity={stop.opacity}
      />
    ))
  ).flat();
}

const TilingBandSvg = memo(function TilingBandSvg({
  bandLength,
  bandWidth,
  gradId,
  stops,
}: {
  bandLength: number;
  bandWidth: number;
  gradId: string;
  stops: GradientStop[];
}) {
  const gradientId = `${gradId}-grad`;

  return (
    <Svg width={bandLength} height={bandWidth} viewBox={`0 0 ${bandLength} ${bandWidth}`}>
      <Defs>
        <LinearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          {buildTiledStops(stops, TILE_REPEATS)}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={bandLength} height={bandWidth} fill={`url(#${gradientId})`} />
    </Svg>
  );
});

function bandDutyOpacity(p: number, span: number, sharpness = 1): number {
  'worklet';
  const base = 0.5 - 0.5 * Math.cos((TAU * p) / span);
  if (sharpness === 1) return base;
  return Math.pow(base, sharpness);
}

function useBandMotion(
  clock: SharedValue<number>,
  travelSv: SharedValue<number>,
  offsetMs: number,
  sharpness = 1
) {
  return useAnimatedStyle(() => {
    'worklet';
    const travel = travelSv.value;
    if (travel <= 0) {
      return { opacity: 0, transform: [{ rotate: '45deg' }, { translateX: 0 }] };
    }
    const span = travel * 2;
    const speed = span / SWEEP_PASS_MS;
    const p = ((((clock.value + offsetMs) * speed) % span) + span) % span;
    return {
      opacity: bandDutyOpacity(p, span, sharpness),
      transform: [{ rotate: '45deg' }, { translateX: -travel + p }],
    };
  });
}

type GoldFoilOverlayProps = FoilOverlayProps;

export const GoldFoilOverlay = memo(function GoldFoilOverlay({
  style,
  motion = 'full',
}: GoldFoilOverlayProps) {
  const animate = motion === 'full';
  const [size, setSize] = useState<Size | null>(null);
  const clock = useSharedValue(0);
  const travelSv = useSharedValue(0);

  const metalMetrics = useMemo(
    () => (size ? measureBand(size, 'metal') : null),
    [size]
  );
  const specularMetrics = useMemo(
    () => (size ? measureBand(size, 'specular') : null),
    [size]
  );

  const metalStyle0 = useBandMotion(clock, travelSv, 0);
  const metalStyle1 = useBandMotion(clock, travelSv, HALF_PASS_MS);
  const specularStyle = useBandMotion(clock, travelSv, SPECULAR_PHASE_MS, 0.55);

  const frameCallback = useFrameCallback((frame) => {
    'worklet';
    clock.value = frame.timeSinceFirstFrame;
  });

  useEffect(() => {
    frameCallback.setActive(animate);
  }, [animate, frameCallback]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    const w = Math.round(width);
    const h = Math.round(height);
    if (w < 1 || h < 1) return;
    setSize((prev) => (prev?.w === w && prev?.h === h ? prev : { w, h }));
    travelSv.value = measureBand({ w, h }, 'metal').travel;
  };

  const metalBandBox = useMemo(
    () =>
      metalMetrics
        ? {
            width: metalMetrics.bandLength,
            height: metalMetrics.bandWidth,
            marginLeft: -metalMetrics.bandLength / 2,
            marginTop: -metalMetrics.bandWidth / 2,
          }
        : null,
    [metalMetrics]
  );

  const specularBandBox = useMemo(
    () =>
      specularMetrics
        ? {
            width: specularMetrics.bandLength,
            height: specularMetrics.bandWidth,
            marginLeft: -specularMetrics.bandLength / 2,
            marginTop: -specularMetrics.bandWidth / 2,
          }
        : null,
    [specularMetrics]
  );

  if (motion === 'off') {
    return null;
  }

  if (!size || !metalMetrics || !specularMetrics || !metalBandBox || !specularBandBox) {
    return (
      <View
        style={[StyleSheet.absoluteFill, styles.clip, style]}
        pointerEvents="none"
        onLayout={onLayout}
        collapsable={false}
      />
    );
  }

  if (motion === 'static') {
    return (
      <View
        style={[StyleSheet.absoluteFill, styles.clip, style]}
        pointerEvents="none"
        onLayout={onLayout}
        collapsable={false}
      >
        <View style={styles.goldColorCast} pointerEvents="none" collapsable={false} />
        <View style={styles.warmSheen} pointerEvents="none" collapsable={false} />
      </View>
    );
  }

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.clip, style]}
      pointerEvents="none"
      onLayout={onLayout}
      collapsable={false}
    >
      <View style={styles.goldColorCast} pointerEvents="none" collapsable={false} />
      <View style={styles.warmSheen} pointerEvents="none" collapsable={false} />

      <Reanimated.View
        collapsable={false}
        style={[styles.band, styles.metalBand, metalBandBox, metalStyle1]}
      >
        <TilingBandSvg
          bandLength={metalMetrics.bandLength}
          bandWidth={metalMetrics.bandWidth}
          gradId="gold-metal-b"
          stops={METAL_TILE}
        />
      </Reanimated.View>
      <Reanimated.View
        collapsable={false}
        style={[styles.band, styles.metalBand, metalBandBox, metalStyle0]}
      >
        <TilingBandSvg
          bandLength={metalMetrics.bandLength}
          bandWidth={metalMetrics.bandWidth}
          gradId="gold-metal-a"
          stops={METAL_TILE}
        />
      </Reanimated.View>

      <Reanimated.View
        collapsable={false}
        style={[styles.band, styles.specularBand, specularBandBox, specularStyle]}
      >
        <TilingBandSvg
          bandLength={specularMetrics.bandLength}
          bandWidth={specularMetrics.bandWidth}
          gradId="gold-specular"
          stops={SPECULAR_TILE}
        />
      </Reanimated.View>

      <View style={StyleSheet.absoluteFill} pointerEvents="none" collapsable={false}>
        <TwinklingSparkleField
          clock={clock}
          width={size.w}
          height={size.h}
          tintPalette={GOLD_SPARKLE_TINTS}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  goldColorCast: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#C9941A',
    opacity: 0.4,
    mixBlendMode: 'color',
  } as ViewStyle,
  warmSheen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#B8860B',
    opacity: 0.1,
    mixBlendMode: 'multiply',
  } as ViewStyle,
  band: {
    position: 'absolute',
    left: '50%',
    top: '50%',
  },
  metalBand: {
    mixBlendMode: 'overlay',
  } as ViewStyle,
  specularBand: {
    mixBlendMode: 'screen',
  } as ViewStyle,
});
