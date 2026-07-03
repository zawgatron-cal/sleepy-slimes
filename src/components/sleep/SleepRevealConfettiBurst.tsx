/**
 * Shared confetti / sparkle burst for sleep reveal moments.
 */

import { memo, useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export type SleepRevealConfettiTheme =
  | 'newBadge'
  | 'rare'
  | 'prismatic'
  | 'exotic'
  | 'gold';

type ParticleKind = 'star' | 'shard';

export type SleepRevealConfettiParticleSpec = {
  id: number;
  kind: ParticleKind;
  size: number;
  tint: string;
  burstX: number;
  burstY: number;
  driftX: number;
  fallY: number;
  wobbleAmp: number;
  rotation: number;
  spin: number;
  burstDurationMs: number;
  fallDurationMs: number;
  delayMs: number;
};

type ThemeConfig = {
  particleCount: number;
  sparkleTints: string[];
  shardTints: string[];
  seedSalt: number;
  spreadScale: number;
  maxParticleDelayMs: number;
};

const THEMES: Record<SleepRevealConfettiTheme, ThemeConfig> = {
  newBadge: {
    particleCount: 16,
    sparkleTints: ['#FFE033', '#FFF176', '#FFFFFF', '#FFD54F', '#FFECB3'],
    shardTints: ['#FFE033', '#FFF59D', '#FFFFFF', '#FFC107', '#FFEE58'],
    seedSalt: 104729,
    spreadScale: 1,
    maxParticleDelayMs: 40,
  },
  rare: {
    particleCount: 20,
    sparkleTints: ['#5CDADD', '#3F8DFF', '#FFFFFF', '#1412DB', '#A8E6FF'],
    shardTints: ['#7EB8FF', '#3F8DFF', '#FFFFFF', '#5CDADD', '#B8F0FF'],
    seedSalt: 31337,
    spreadScale: 1.2,
    maxParticleDelayMs: 180,
  },
  prismatic: {
    particleCount: 14,
    sparkleTints: ['#FF2A5C', '#FFD500', '#00CFFF', '#C73DFF', '#FFFFFF'],
    shardTints: ['#FF6B9D', '#FFE066', '#66E0FF', '#E879F9', '#FFF5F7'],
    seedSalt: 42069,
    spreadScale: 0.95,
    maxParticleDelayMs: 60,
  },
  exotic: {
    particleCount: 24,
    sparkleTints: ['#FF3DFF', '#00FFF0', '#39FF14', '#FFFFFF', '#FF0099'],
    shardTints: ['#E878F0', '#5EEAD4', '#A3E635', '#F0ABFC', '#C4B5FD'],
    seedSalt: 88001,
    spreadScale: 1.28,
    maxParticleDelayMs: 200,
  },
  gold: {
    particleCount: 30,
    sparkleTints: ['#FFF8E1', '#F5D060', '#FFFFFF', '#EDBE40', '#FFE082'],
    shardTints: ['#F5D060', '#EDBE40', '#A87408', '#FFFDE7', '#FFC107'],
    seedSalt: 1337,
    spreadScale: 1.45,
    maxParticleDelayMs: 240,
  },
};

function seededRandom(seed: number) {
  let state = Math.abs(Math.floor(seed)) % 2147483646 || 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

export function buildSleepRevealConfettiParticles(
  burstKey: number,
  theme: SleepRevealConfettiTheme
): SleepRevealConfettiParticleSpec[] {
  const config = THEMES[theme];
  const rand = seededRandom(burstKey * 7919 + config.seedSalt);

  return Array.from({ length: config.particleCount }, (_, id) => {
    const kind: ParticleKind = rand() < 0.45 ? 'star' : 'shard';
    const speed = 0.5 + rand() * 0.75;
    const angle = -Math.PI * (0.04 + rand() * 0.9);
    const burstDist = (36 + rand() * 64) * speed * config.spreadScale;
    const burstX = Math.cos(angle) * burstDist;
    const burstY = Math.sin(angle) * burstDist;
    const palette = kind === 'star' ? config.sparkleTints : config.shardTints;
    const weight = kind === 'shard' ? 1.12 + rand() * 0.18 : 0.82 + rand() * 0.22;

    return {
      id,
      kind,
      size: kind === 'star' ? 12 + rand() * 11 : 8 + rand() * 7,
      tint: palette[Math.floor(rand() * palette.length)] ?? palette[0]!,
      burstX,
      burstY,
      driftX: burstX * (0.18 + rand() * 0.38) + (rand() - 0.5) * 36,
      fallY: (88 + rand() * 108) * weight,
      wobbleAmp: 2 + rand() * 5,
      rotation: rand() * 360,
      spin: (rand() - 0.5) * 280,
      burstDurationMs: 150 + Math.floor(rand() * 130),
      fallDurationMs: 1500 + Math.floor(rand() * 900),
      delayMs: Math.floor(rand() * config.maxParticleDelayMs),
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
  spec: SleepRevealConfettiParticleSpec;
  burstDelayMs: number;
  burstKey: number;
};

const SparkleParticle = memo(function SparkleParticle({
  spec,
  burstDelayMs,
  burstKey,
}: SparkleParticleProps) {
  const burst = useRef(new Animated.Value(0)).current;
  const fallY = useRef(new Animated.Value(0)).current;
  const fallX = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    burst.setValue(0);
    fallY.setValue(0);
    fallX.setValue(0);
    spin.setValue(0);

    const totalMs = spec.burstDurationMs + spec.fallDurationMs;
    const startDelay = burstDelayMs + spec.delayMs;

    const anim = Animated.sequence([
      Animated.delay(startDelay),
      Animated.parallel([
        Animated.sequence([
          Animated.timing(burst, {
            toValue: 1,
            duration: spec.burstDurationMs,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.parallel([
            Animated.timing(fallY, {
              toValue: 1,
              duration: spec.fallDurationMs,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(fallX, {
              toValue: 1,
              duration: spec.fallDurationMs,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.timing(spin, {
          toValue: 1,
          duration: totalMs,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    ]);

    anim.start();
    return () => anim.stop();
  }, [
    burst,
    burstDelayMs,
    burstKey,
    fallX,
    fallY,
    spec.burstDurationMs,
    spec.delayMs,
    spec.fallDurationMs,
    spin,
  ]);

  const burstOffsetX = burst.interpolate({
    inputRange: [0, 1],
    outputRange: [0, spec.burstX],
  });
  const burstOffsetY = burst.interpolate({
    inputRange: [0, 1],
    outputRange: [0, spec.burstY],
  });
  const driftOffsetX = fallX.interpolate({
    inputRange: [0, 1],
    outputRange: [0, spec.driftX],
  });
  const gravityOffsetY = fallY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, spec.fallY],
  });
  const wobbleOffsetX = fallY.interpolate({
    inputRange: [0, 0.22, 0.38, 0.54, 0.7, 0.86, 1],
    outputRange: [
      0,
      0,
      spec.wobbleAmp * 0.22,
      -spec.wobbleAmp * 0.34,
      spec.wobbleAmp * 0.24,
      -spec.wobbleAmp * 0.12,
      0,
    ],
  });

  const translateX = Animated.add(
    Animated.add(burstOffsetX, driftOffsetX),
    wobbleOffsetX
  );
  const translateY = Animated.add(burstOffsetY, gravityOffsetY);

  const opacity = Animated.multiply(
    burst.interpolate({
      inputRange: [0, 0.22, 1],
      outputRange: [0, 1, 1],
    }),
    fallY.interpolate({
      inputRange: [0, 0.68, 1],
      outputRange: [1, 1, 0],
    })
  );

  const scale = Animated.multiply(
    burst.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 1],
    }),
    fallY.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.5],
    })
  );

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: [`${spec.rotation}deg`, `${spec.rotation + spec.spin}deg`],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.particle,
        {
          opacity,
          transform: [{ translateX }, { translateY }, { scale }, { rotate }],
        },
      ]}
    >
      {spec.kind === 'star' ? (
        <SparkleStar size={spec.size} tint={spec.tint} />
      ) : (
        <View
          style={[
            styles.shard,
            {
              width: spec.size * 0.55,
              height: spec.size,
              backgroundColor: spec.tint,
            },
          ]}
        />
      )}
    </Animated.View>
  );
});

export type SleepRevealConfettiBurstProps = {
  burstKey: number;
  delayMs?: number;
  theme: SleepRevealConfettiTheme;
  hostStyle?: ViewStyle;
};

export function SleepRevealConfettiBurst({
  burstKey,
  delayMs = 0,
  theme,
  hostStyle,
}: SleepRevealConfettiBurstProps) {
  const particles = useMemo(
    () => buildSleepRevealConfettiParticles(burstKey, theme),
    [burstKey, theme]
  );

  return (
    <View style={[styles.host, hostStyle]} pointerEvents="none">
      {particles.map((spec) => (
        <SparkleParticle
          key={spec.id}
          spec={spec}
          burstKey={burstKey}
          burstDelayMs={delayMs}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    zIndex: 5,
    overflow: 'visible',
  },
  particle: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  shard: {
    borderRadius: 1.5,
  },
});
