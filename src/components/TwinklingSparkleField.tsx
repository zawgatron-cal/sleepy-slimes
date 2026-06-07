/**
 * Twinkling four-point sparkles for variant overlays (gold, exotic, etc.).
 */

import { memo } from 'react';
import { StyleSheet, type ViewStyle } from 'react-native';
import Reanimated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const TWINKLE_MS = 1600;
const TAU = 2 * Math.PI;
/** Coprime with site count — scrambles phase vs layout so twinkles don't sweep top-to-bottom. */
const PHASE_STRIDE = 5;

export type SparkleSite = {
  x: number;
  y: number;
  size: number;
};

type SparkleSiteWithPhase = SparkleSite & { phase: number };

const SPARKLE_LAYOUT: SparkleSite[] = [
  { x: 0.18, y: 0.14, size: 14 },
  { x: 0.42, y: 0.22, size: 10 },
  { x: 0.68, y: 0.16, size: 12 },
  { x: 0.82, y: 0.34, size: 9 },
  { x: 0.28, y: 0.48, size: 11 },
  { x: 0.52, y: 0.44, size: 16 },
  { x: 0.74, y: 0.52, size: 10 },
  { x: 0.14, y: 0.62, size: 9 },
  { x: 0.38, y: 0.72, size: 13 },
  { x: 0.58, y: 0.68, size: 11 },
  { x: 0.84, y: 0.76, size: 12 },
  { x: 0.48, y: 0.86, size: 10 },
];

/** Evenly staggered in time, uncorrelated with position — always at least one star peaking. */
export const DEFAULT_SPARKLE_SITES: SparkleSiteWithPhase[] = SPARKLE_LAYOUT.map((site, index, all) => ({
  ...site,
  phase: (TWINKLE_MS / all.length) * ((index * PHASE_STRIDE) % all.length),
}));

/** Top-to-bottom sweep — phases follow ascending Y so twinkles cascade down the slime. */
export function buildSweepSparkleSites(twinkleMs: number): SparkleSiteWithPhase[] {
  return [...SPARKLE_LAYOUT]
    .sort((a, b) => a.y - b.y)
    .map((site, rank, all) => ({
      ...site,
      phase: (twinkleMs / all.length) * rank,
    }));
}

export const EXOTIC_SWEEP_TWINKLE_MS = 2400;
export const EXOTIC_SWEEP_SPARKLE_SITES = buildSweepSparkleSites(EXOTIC_SWEEP_TWINKLE_MS);

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

function useSparkleTwinkle(clock: SharedValue<number>, phaseMs: number, twinkleMs: number) {
  return useAnimatedStyle(() => {
    'worklet';
    const wave = 0.5 + 0.5 * Math.sin(((clock.value + phaseMs) / twinkleMs) * TAU);
    const sharp = wave * wave;
    return {
      opacity: sharp,
      transform: [{ scale: 0.5 + sharp * 0.6 }, { rotate: `${phaseMs * 0.05}deg` }],
    };
  });
}

function SparkleSiteView({
  clock,
  layoutW,
  layoutH,
  site,
  tint,
  twinkleMs,
}: {
  clock: SharedValue<number>;
  layoutW: number;
  layoutH: number;
  site: SparkleSiteWithPhase;
  tint: string;
  twinkleMs: number;
}) {
  const twinkle = useSparkleTwinkle(clock, site.phase, twinkleMs);

  return (
    <Reanimated.View
      pointerEvents="none"
      collapsable={false}
      style={[
        styles.sparkle,
        {
          left: layoutW * site.x - site.size / 2,
          top: layoutH * site.y - site.size / 2,
          width: site.size,
          height: site.size,
        },
        twinkle,
      ]}
    >
      <SparkleStar size={site.size} tint={tint} />
    </Reanimated.View>
  );
}

type TwinklingSparkleFieldProps = {
  clock: SharedValue<number>;
  width: number;
  height: number;
  sites?: SparkleSiteWithPhase[];
  tintPalette: string[];
  twinkleMs?: number;
};

export function TwinklingSparkleField({
  clock,
  width,
  height,
  sites = DEFAULT_SPARKLE_SITES,
  tintPalette,
  twinkleMs = TWINKLE_MS,
}: TwinklingSparkleFieldProps) {
  return (
    <>
      {sites.map((site, index) => (
        <SparkleSiteView
          key={`${site.x}-${site.y}-${site.phase}`}
          clock={clock}
          layoutW={width}
          layoutH={height}
          site={site}
          tint={tintPalette[index % tintPalette.length]!}
          twinkleMs={twinkleMs}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  sparkle: {
    position: 'absolute',
    mixBlendMode: 'screen',
  } as ViewStyle,
});
