/**
 * Variant tease — one pulse, top-right on silhouette. Color only varies by variant.
 */

import { memo, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type Animated as AnimatedNamespace,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  resolveVariantStarFlashTint,
  VARIANT_ACCENT_STAR_SIZE,
  VARIANT_MAIN_STAR_SIZE,
  VARIANT_STAR_PULSE_MS,
  type VariantRevealLevel,
} from '@/src/constants/sleepVariantReveal';
import { playVariantTwinkle } from '@/src/services/soundEffects';

type VariantSilhouetteStarFlashProps = {
  level: Exclude<VariantRevealLevel, 'standard'>;
  effectKey: number;
  teasing: boolean;
  slimeMaskOffsetY?: AnimatedNamespace.AnimatedInterpolation<number>;
};

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

export function VariantSilhouetteStarFlash({
  level,
  effectKey,
  teasing,
  slimeMaskOffsetY,
}: VariantSilhouetteStarFlashProps) {
  const pulse = useRef(new Animated.Value(0)).current;
  const tint = resolveVariantStarFlashTint(level);

  useEffect(() => {
    pulse.stopAnimation();
    pulse.setValue(0);

    if (!teasing) return;

    playVariantTwinkle();

    const anim = Animated.timing(pulse, {
      toValue: 1,
      duration: VARIANT_STAR_PULSE_MS,
      easing: Easing.inOut(Easing.sin),
      useNativeDriver: true,
    });
    anim.start();

    return () => {
      anim.stop();
    };
  }, [effectKey, pulse, teasing]);

  if (!teasing) return null;

  const mainScale = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.34, 1.42, 0.34],
  });
  const mainOpacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.72, 1, 0.72],
  });

  const accentScale = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.95, 0.38, 0.95],
  });
  const accentOpacity = pulse.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.18, 0.07, 0.18],
  });

  const bounceTransform =
    slimeMaskOffsetY != null ? [{ translateY: slimeMaskOffsetY }] : [];

  return (
    <View style={styles.host} pointerEvents="none">
      <Animated.View
        style={[
          styles.mainStar,
          {
            width: VARIANT_MAIN_STAR_SIZE,
            height: VARIANT_MAIN_STAR_SIZE,
            opacity: mainOpacity,
            transform: [...bounceTransform, { scale: mainScale }],
          },
        ]}
      >
        <SparkleStar size={VARIANT_MAIN_STAR_SIZE} tint={tint} />
      </Animated.View>

      <Animated.View
        style={[
          styles.accentStar,
          {
            width: VARIANT_ACCENT_STAR_SIZE,
            height: VARIANT_ACCENT_STAR_SIZE,
            opacity: accentOpacity,
            transform: [...bounceTransform, { scale: accentScale }],
          },
        ]}
      >
        <SparkleStar size={VARIANT_ACCENT_STAR_SIZE} tint={tint} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 4,
    overflow: 'visible',
  },
  mainStar: {
    position: 'absolute',
    top: 28,
    right: 46,
  },
  accentStar: {
    position: 'absolute',
    top: 54,
    right: 68,
  },
});
