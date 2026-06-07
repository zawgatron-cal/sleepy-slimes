/**
 * Exotic variant — spinning hue wheel + gem shimmer + twinkling stars.
 */

import { useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import {
  TwinklingSparkleField,
  EXOTIC_SWEEP_SPARKLE_SITES,
  EXOTIC_SWEEP_TWINKLE_MS,
} from '@/src/components/TwinklingSparkleField';

const SPIN_MS = 16000;
const HUE_WHEEL_OPACITY = 0.62;
const TAU = 2 * Math.PI;
const GEM_SHIMMER_MS = 3200;

const EXOTIC_HUE_STOPS = [
  { pct: 0, color: '#E878F0' },
  { pct: 0.17, color: '#00FFF0' },
  { pct: 0.33, color: '#39FF14' },
  { pct: 0.5, color: '#00D4FF' },
  { pct: 0.67, color: '#C94B9A' },
  { pct: 0.83, color: '#ADFF2F' },
  { pct: 1, color: '#E878F0' },
] as const;

const EXOTIC_SPARKLE_TINTS = ['#FFFDE7', '#E0F2FE', '#F5F3FF'];

type Size = { w: number; h: number };

type ExoticFoilOverlayProps = {
  style?: ViewStyle;
};

export function ExoticFoilOverlay({ style }: ExoticFoilOverlayProps) {
  const [size, setSize] = useState<Size | null>(null);
  const clock = useSharedValue(0);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(clock.value / SPIN_MS) * 360}deg` }],
  }));

  const gemShimmer = useAnimatedStyle(() => {
    'worklet';
    const wave = 0.5 + 0.5 * Math.sin((clock.value / GEM_SHIMMER_MS) * TAU);
    return { opacity: 0.08 + wave * 0.08 };
  });

  useFrameCallback((frame) => {
    'worklet';
    clock.value = frame.timeSinceFirstFrame;
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    const w = Math.round(width);
    const h = Math.round(height);
    if (w < 1 || h < 1) return;
    setSize((prev) => (prev?.w === w && prev?.h === h ? prev : { w, h }));
  };

  const wheelDim = useMemo(() => {
    if (!size) return 0;
    return Math.ceil(Math.max(size.w, size.h) * 2.8);
  }, [size]);

  if (!size || wheelDim <= 0) {
    return (
      <View
        style={[StyleSheet.absoluteFill, styles.clip, style]}
        pointerEvents="none"
        onLayout={onLayout}
        collapsable={false}
      />
    );
  }

  return (
    <View
      style={[StyleSheet.absoluteFill, styles.clip, style]}
      pointerEvents="none"
      onLayout={onLayout}
      collapsable={false}
    >
      <View style={[StyleSheet.absoluteFill, styles.hueHost]} pointerEvents="none" collapsable={false}>
        <Reanimated.View
          style={[
            styles.wheelWrap,
            { width: wheelDim, height: wheelDim, marginLeft: -wheelDim / 2, marginTop: -wheelDim / 2 },
            spinStyle,
          ]}
          collapsable={false}
        >
          <Svg width={wheelDim} height={wheelDim} viewBox={`0 0 ${wheelDim} ${wheelDim}`}>
            <Defs>
              <LinearGradient id="exotic-hue-wheel" x1="0%" y1="0%" x2="100%" y2="100%">
                {EXOTIC_HUE_STOPS.map((stop) => (
                  <Stop
                    key={stop.pct}
                    offset={`${stop.pct * 100}%`}
                    stopColor={stop.color}
                    stopOpacity={HUE_WHEEL_OPACITY}
                  />
                ))}
              </LinearGradient>
            </Defs>
            <Rect x="0" y="0" width={wheelDim} height={wheelDim} fill="url(#exotic-hue-wheel)" />
          </Svg>
        </Reanimated.View>
      </View>

      <Reanimated.View
        style={[StyleSheet.absoluteFill, styles.gemTint, gemShimmer]}
        pointerEvents="none"
        collapsable={false}
      />

      <TwinklingSparkleField
        clock={clock}
        width={size.w}
        height={size.h}
        sites={EXOTIC_SWEEP_SPARKLE_SITES}
        twinkleMs={EXOTIC_SWEEP_TWINKLE_MS}
        tintPalette={EXOTIC_SPARKLE_TINTS}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  hueHost: {
    mixBlendMode: 'hue',
  } as ViewStyle,
  wheelWrap: {
    position: 'absolute',
    left: '50%',
    top: '50%',
  },
  gemTint: {
    backgroundColor: '#C4B5FD',
    mixBlendMode: 'soft-light',
  } as ViewStyle,
});
