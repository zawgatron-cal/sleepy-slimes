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

const TWINKLE_MS = 1400;
const TAU = 2 * Math.PI;

export type SparkleSite = {
  x: number;
  y: number;
  size: number;
  phase: number;
};

export const DEFAULT_SPARKLE_SITES: SparkleSite[] = [
  { x: 0.18, y: 0.14, size: 14, phase: 0 },
  { x: 0.42, y: 0.22, size: 10, phase: 220 },
  { x: 0.68, y: 0.16, size: 12, phase: 480 },
  { x: 0.82, y: 0.34, size: 9, phase: 120 },
  { x: 0.28, y: 0.48, size: 11, phase: 640 },
  { x: 0.52, y: 0.44, size: 16, phase: 300 },
  { x: 0.74, y: 0.52, size: 10, phase: 780 },
  { x: 0.14, y: 0.62, size: 9, phase: 940 },
  { x: 0.38, y: 0.72, size: 13, phase: 160 },
  { x: 0.58, y: 0.68, size: 11, phase: 520 },
  { x: 0.84, y: 0.76, size: 12, phase: 400 },
  { x: 0.48, y: 0.86, size: 10, phase: 860 },
];

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

function useSparkleTwinkle(clock: SharedValue<number>, phaseMs: number) {
  return useAnimatedStyle(() => {
    'worklet';
    const wave = 0.5 + 0.5 * Math.sin(((clock.value + phaseMs) / TWINKLE_MS) * TAU);
    const sharp = wave * wave;
    return {
      opacity: 0.08 + sharp * 0.92,
      transform: [{ scale: 0.55 + sharp * 0.55 }, { rotate: `${phaseMs * 0.05}deg` }],
    };
  });
}

function SparkleSiteView({
  clock,
  layoutW,
  layoutH,
  site,
  tint,
}: {
  clock: SharedValue<number>;
  layoutW: number;
  layoutH: number;
  site: SparkleSite;
  tint: string;
}) {
  const twinkle = useSparkleTwinkle(clock, site.phase);

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
  sites?: SparkleSite[];
  tintPalette: string[];
};

export function TwinklingSparkleField({
  clock,
  width,
  height,
  sites = DEFAULT_SPARKLE_SITES,
  tintPalette,
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
