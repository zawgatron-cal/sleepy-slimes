/**
 * Tab header candy counter — store-backed count, collect animation anchor.
 * Visual: `TabHeaderCandyPill` in `CandyPill.tsx`.
 */

import { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { TabHeaderCandyPill, CANDY_PILL_GLYPH_SIZE } from '@/src/components/CandyPill';
import { useCandiesStore, useCandyCollectStore } from '@/src/stores';
import { areRevealAnimationsEnabled } from '@/src/stores/useAnimationSettingsStore';

export { CANDY_PILL_GLYPH_SIZE };

export function CandyCounterPill() {
  const anchorRef = useRef<View>(null);
  const scale = useRef(new Animated.Value(1)).current;
  const total = useCandiesStore((s) => s.total);
  const collecting = useCandyCollectStore((s) => s.active);
  const displayCount = useCandyCollectStore((s) => s.displayCount);
  const pulseGeneration = useCandyCollectStore((s) => s.pulseGeneration);
  const setTargetRect = useCandyCollectStore((s) => s.setTargetRect);
  const count = collecting && displayCount != null ? displayCount : total;

  const reportAnchor = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      if (width < 1 || height < 1) return;
      setTargetRect({ x, y, width, height });
    });
  }, [setTargetRect]);

  useEffect(() => {
    reportAnchor();
  }, [collecting, count, reportAnchor]);

  useEffect(() => {
    if (!collecting || pulseGeneration === 0 || !areRevealAnimationsEnabled()) return;
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.12,
        duration: 90,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [collecting, pulseGeneration, scale]);

  return (
    <View
      ref={anchorRef}
      onLayout={reportAnchor}
      collapsable={false}
      accessibilityRole="text"
      accessibilityLabel={`${count} candies`}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <TabHeaderCandyPill count={count} />
      </Animated.View>
    </View>
  );
}
