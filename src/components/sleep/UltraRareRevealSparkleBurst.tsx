/**
 * Radial twinkling sparkle burst for Ultra Rare reveal — stars only, lightweight.
 */

import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const BURST_MS = 560;
const PARTICLE_COUNT = 8;

const RARE_SPARKLE_TINTS = ['#FFFFFF', '#FFE566', '#FFF8E8', '#5CDADD', '#A8E6FF', '#B8F0FF'];

type SparkleSpec = {
  id: number;
  size: number;
  tint: string;
  angle: number;
  distance: number;
  delayMs: number;
};

function seededRandom(seed: number) {
  let state = Math.abs(Math.floor(seed)) % 2147483646 || 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function buildSparkleSpecs(burstKey: number): SparkleSpec[] {
  const rand = seededRandom(burstKey * 7919 + 88003);

  return Array.from({ length: PARTICLE_COUNT }, (_, id) => {
    const angle = (id / PARTICLE_COUNT) * Math.PI * 2 + rand() * 0.35;
    const distance = 68 + rand() * 72;

    return {
      id,
      size: 10 + rand() * 8,
      tint: RARE_SPARKLE_TINTS[Math.floor(rand() * RARE_SPARKLE_TINTS.length)]!,
      angle,
      distance,
      delayMs: Math.floor(rand() * 120),
    };
  });
}

const SparkleStar = memo(function SparkleStar({
  size,
  tint,
}: {
  size: number;
  tint: string;
}) {
  const half = size / 2;
  const arm = size * 0.42;
  const core = size * 0.08;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Path
        d={`M ${half} ${half - arm}
            L ${half + core} ${half - core}
            L ${half + arm} ${half}
            L ${half + core} ${half + core}
            L ${half} ${half + arm}
            L ${half - core} ${half + core}
            L ${half - arm} ${half}
            L ${half - core} ${half - core} Z`}
        fill={tint}
      />
    </Svg>
  );
});

type SparkleParticleProps = {
  spec: SparkleSpec;
  burstKey: number;
  startDelayMs: number;
};

const SparkleParticle = memo(function SparkleParticle({
  spec,
  burstKey,
  startDelayMs,
}: SparkleParticleProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);

    const anim = Animated.sequence([
      Animated.delay(startDelayMs + spec.delayMs),
      Animated.timing(progress, {
        toValue: 1,
        duration: BURST_MS,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    anim.start();

    return () => anim.stop();
  }, [burstKey, progress, spec.delayMs, startDelayMs]);

  const targetX = Math.cos(spec.angle) * spec.distance;
  const targetY = Math.sin(spec.angle) * spec.distance;

  const translateX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, targetX],
  });
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, targetY],
  });
  const scale = progress.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0.15, 1.1, 1, 0.85],
  });
  const opacity = progress.interpolate({
    inputRange: [0, 0.12, 0.55, 1],
    outputRange: [0, 1, 0.9, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          opacity,
          transform: [{ translateX }, { translateY }, { scale }],
        },
      ]}
    >
      <SparkleStar size={spec.size} tint={spec.tint} />
    </Animated.View>
  );
});

export type UltraRareRevealSparkleBurstProps = {
  burstKey: number;
  delayMs?: number;
  /** Extra wait before the burst — used to stagger waves across long anticipation. */
  startOffsetMs?: number;
  hostStyle?: ViewStyle;
};

export function UltraRareRevealSparkleBurst({
  burstKey,
  delayMs = 0,
  startOffsetMs = 0,
  hostStyle,
}: UltraRareRevealSparkleBurstProps) {
  const specs = useMemo(() => buildSparkleSpecs(burstKey), [burstKey]);

  return (
    <View style={[styles.host, hostStyle]} pointerEvents="none">
      {specs.map((spec) => (
        <SparkleParticle
          key={spec.id}
          spec={spec}
          burstKey={burstKey}
          startDelayMs={delayMs + startOffsetMs}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    overflow: 'visible',
  },
  particle: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
});
