/**
 * Conveyor double-buffer foil (Reanimated).
 *
 * Complementary phase opacities (always sum to 1) prevent handoff gaps;
 * motion stays continuous on the UI thread.
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

const BAND_OPACITY = 0.55;
const SWEEP_PASS_MS = 8000;
const HALF_PASS_MS = SWEEP_PASS_MS / 2;
const TILE_REPEATS = 2;
const TAU = 2 * Math.PI;
/** Thickness at 45° — wide enough to blanket the full sprite (same idea as gold foil). */
const PRISMATIC_BAND_WIDTH_SCALE = 8.7;

const RAINBOW_TILE: { pct: number; color: string }[] = [
  { pct: 0, color: '#ff2a5c' },
  { pct: 0.12, color: '#ff7a18' },
  { pct: 0.25, color: '#ffd500' },
  { pct: 0.38, color: '#3dff9a' },
  { pct: 0.5, color: '#00cfff' },
  { pct: 0.62, color: '#5a5cff' },
  { pct: 0.75, color: '#c73dff' },
  { pct: 0.88, color: '#ff2a5c' },
  { pct: 1, color: '#ff2a5c' },
];

type Size = { w: number; h: number };
type BandMetrics = { bandLength: number; bandWidth: number; travel: number };

function measureBand(size: Size): BandMetrics {
  const { w, h } = size;
  const diagonal = Math.sqrt(w * w + h * h);
  const maxDim = Math.max(w, h);
  const cover = Math.ceil(diagonal * 1.25);
  return {
    bandLength: Math.ceil(cover * 1.65),
    bandWidth: Math.ceil(maxDim * PRISMATIC_BAND_WIDTH_SCALE),
    travel: Math.ceil(diagonal * 0.5 + cover * 0.32),
  };
}

function buildTiledStops(repeats: number) {
  const step = 100 / repeats;
  return Array.from({ length: repeats }, (_, repeat) =>
    RAINBOW_TILE.map((stop) => (
      <Stop
        key={`${repeat}-${stop.pct}`}
        offset={`${repeat * step + stop.pct * step}%`}
        stopColor={stop.color}
        stopOpacity={BAND_OPACITY}
      />
    ))
  ).flat();
}

const TilingBandSvg = memo(function TilingBandSvg({
  bandLength,
  bandWidth,
  gradId,
}: {
  bandLength: number;
  bandWidth: number;
  gradId: string;
}) {
  const rainbowId = `${gradId}-rainbow`;

  return (
    <Svg width={bandLength} height={bandWidth} viewBox={`0 0 ${bandLength} ${bandWidth}`}>
      <Defs>
        <LinearGradient id={rainbowId} x1="0%" y1="0%" x2="100%" y2="0%">
          {buildTiledStops(TILE_REPEATS)}
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={bandLength} height={bandWidth} fill={`url(#${rainbowId})`} />
    </Svg>
  );
});

/** Full strength when the band is centered on the sprite (p ≈ travel); 0 when behind. */
function bandDutyOpacity(p: number, span: number): number {
  'worklet';
  return 0.5 - 0.5 * Math.cos((TAU * p) / span);
}

function useBandMotion(clock: SharedValue<number>, travelSv: SharedValue<number>, offsetMs: number) {
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
      opacity: bandDutyOpacity(p, span),
      transform: [{ rotate: '45deg' }, { translateX: -travel + p }],
    };
  });
}

type PrismaticFoilOverlayProps = FoilOverlayProps;

export const PrismaticFoilOverlay = memo(function PrismaticFoilOverlay({
  style,
  motion = 'full',
}: PrismaticFoilOverlayProps) {
  const animate = motion === 'full';
  const [metrics, setMetrics] = useState<BandMetrics | null>(null);
  const clock = useSharedValue(0);
  const travelSv = useSharedValue(0);

  const style0 = useBandMotion(clock, travelSv, 0);
  const style1 = useBandMotion(clock, travelSv, HALF_PASS_MS);

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
    const next = measureBand({ w, h });
    setMetrics((prev) =>
      prev?.bandLength === next.bandLength &&
      prev.bandWidth === next.bandWidth &&
      prev.travel === next.travel
        ? prev
        : next
    );
    travelSv.value = next.travel;
  };

  const bandBox = useMemo(
    () =>
      metrics
        ? {
            width: metrics.bandLength,
            height: metrics.bandWidth,
            marginLeft: -metrics.bandLength / 2,
            marginTop: -metrics.bandWidth / 2,
          }
        : null,
    [metrics]
  );

  if (motion === 'off') {
    return null;
  }

  if (!metrics || !bandBox) {
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
        style={[StyleSheet.absoluteFill, styles.clip, style, styles.blendHost]}
        pointerEvents="none"
        onLayout={onLayout}
        collapsable={false}
      >
        <View collapsable={false} style={[styles.band, bandBox, styles.staticBand]}>
          <TilingBandSvg
            bandLength={metrics.bandLength}
            bandWidth={metrics.bandWidth}
            gradId="prismatic-foil-static"
          />
        </View>
      </View>
    );
  }

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.clip, style, styles.blendHost]}
      pointerEvents="none"
      onLayout={onLayout}
      collapsable={false}
    >
      <Reanimated.View collapsable={false} style={[styles.band, bandBox, style1]}>
        <TilingBandSvg
          bandLength={metrics.bandLength}
          bandWidth={metrics.bandWidth}
          gradId="prismatic-foil-b"
        />
      </Reanimated.View>
      <Reanimated.View collapsable={false} style={[styles.band, bandBox, style0]}>
        <TilingBandSvg
          bandLength={metrics.bandLength}
          bandWidth={metrics.bandWidth}
          gradId="prismatic-foil-a"
        />
      </Reanimated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  blendHost: {
    mixBlendMode: 'hue',
  } as ViewStyle,
  band: {
    position: 'absolute',
    left: '50%',
    top: '50%',
  },
  staticBand: {
    opacity: 0.42,
    transform: [{ rotate: '45deg' }],
  },
});
