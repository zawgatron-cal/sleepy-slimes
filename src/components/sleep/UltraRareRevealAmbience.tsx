/**
 * Ultra Rare reveal — uniform dim with a cutout that follows the bouncing slime.
 */

import MaskedView from '@react-native-masked-view/masked-view';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
  type Animated as AnimatedNamespace,
} from 'react-native';
import { UltraRareRevealSparkleBurst } from '@/src/components/sleep/UltraRareRevealSparkleBurst';

const FADE_IN_MS = 480;
const FADE_OUT_MS = 420;
const BREATHE_MS = 1180;
/** Max darkness — 75% of previous full-strength scrim. */
const DIM_MAX = 0.75;
const SLIME_MASK_W = 236;
const SLIME_MASK_H = 236;
const SLIME_MASK_RADIUS = 28;

/** Sparkle waves as fractions of total anticipation hold. */
const SPARKLE_WAVE_FRACTIONS = [0.1, 0.45, 0.78];

type UltraRareRevealAmbienceProps = {
  effectKey: number;
  revealed: boolean;
  anticipationMs: number;
  /** Vertical bounce offset — keeps the bright cutout aligned with the slime. */
  slimeMaskOffsetY: AnimatedNamespace.AnimatedInterpolation<number>;
};

export function UltraRareRevealAmbience({
  effectKey,
  revealed,
  anticipationMs,
  slimeMaskOffsetY,
}: UltraRareRevealAmbienceProps) {
  const { width, height } = useWindowDimensions();

  const maskHoleLeft = width * 0.5 - SLIME_MASK_W / 2;
  const maskHoleTop = height * 0.43 - SLIME_MASK_H / 2;

  const [mounted, setMounted] = useState(true);
  const effectOpacity = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const breatheLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const fadeOutStarted = useRef(false);

  const sparkleWaves = useMemo(
    () =>
      SPARKLE_WAVE_FRACTIONS.map((fraction, index) => ({
        key: effectKey * 10 + index,
        delayMs: Math.round(anticipationMs * fraction),
      })),
    [anticipationMs, effectKey]
  );

  useEffect(() => {
    setMounted(true);
    fadeOutStarted.current = false;
    effectOpacity.setValue(0);
    breathe.setValue(0);

    Animated.timing(effectOpacity, {
      toValue: 1,
      duration: FADE_IN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    breatheLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: BREATHE_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: BREATHE_MS,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    breatheLoopRef.current.start();

    return () => {
      breatheLoopRef.current?.stop();
      breatheLoopRef.current = null;
    };
  }, [breathe, effectKey, effectOpacity]);

  useEffect(() => {
    if (!revealed || fadeOutStarted.current) return;
    fadeOutStarted.current = true;

    breatheLoopRef.current?.stop();

    Animated.timing(effectOpacity, {
      toValue: 0,
      duration: FADE_OUT_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setMounted(false);
    });
  }, [effectOpacity, revealed]);

  const dimLayerOpacity = Animated.multiply(
    effectOpacity,
    breathe.interpolate({
      inputRange: [0, 1],
      outputRange: [DIM_MAX * 0.82, DIM_MAX],
    })
  );

  if (!mounted) return null;

  const dimLayer = (
    <Animated.View
      style={[styles.dimFill, { opacity: dimLayerOpacity, backgroundColor: 'rgba(4, 2, 14, 0.88)' }]}
    />
  );

  return (
    <View style={styles.root} pointerEvents="none">
      {Platform.OS === 'web' ? (
        dimLayer
      ) : (
        <MaskedView
          style={styles.maskHost}
          maskElement={
            <View style={styles.maskCanvas}>
              <View style={styles.maskOpaque} />
              <Animated.View
                style={[
                  styles.maskHole,
                  {
                    left: maskHoleLeft,
                    top: maskHoleTop,
                    transform: [{ translateY: slimeMaskOffsetY }],
                  },
                ]}
              />
            </View>
          }
        >
          {dimLayer}
        </MaskedView>
      )}

      <Animated.View style={[styles.sparkleLayer, { opacity: effectOpacity }]}>
        <View style={styles.sparklePivot}>
          {sparkleWaves.map((wave) => (
            <UltraRareRevealSparkleBurst
              key={wave.key}
              burstKey={wave.key}
              delayMs={0}
              hostStyle={styles.sparkleHost}
              startOffsetMs={wave.delayMs}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  maskHost: {
    ...StyleSheet.absoluteFillObject,
  },
  maskCanvas: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  maskOpaque: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'white',
  },
  maskHole: {
    position: 'absolute',
    width: SLIME_MASK_W,
    height: SLIME_MASK_H,
    borderRadius: SLIME_MASK_RADIUS,
    backgroundColor: 'black',
  },
  dimFill: {
    ...StyleSheet.absoluteFillObject,
  },
  sparkleLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  sparklePivot: {
    position: 'absolute',
    left: '50%',
    top: '43%',
    width: 0,
    height: 0,
  },
  sparkleHost: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    overflow: 'visible',
  },
});
