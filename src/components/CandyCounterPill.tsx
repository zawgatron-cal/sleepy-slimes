/**
 * Header candy balance pill — reads from candies store.
 */

import { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { CandyGlyph } from '@/src/components/CandyGlyph';
import { useCandiesStore, useCandyCollectStore } from '@/src/stores';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

export const CANDY_HEADER_GLYPH_SIZE = 52;

export type CandyBalancePillProps = {
  count: number;
  style?: ViewStyle;
};

/** Tab header candy pill (count passed in or via `CandyCounterPill`). */
export function CandyBalancePill({ count, style }: CandyBalancePillProps) {
  const borderColor = mainScreens.idle.border;
  const glyphHalf = CANDY_HEADER_GLYPH_SIZE / 2;

  return (
    <View
      style={[styles.outer, style]}
      accessibilityRole="text"
      accessibilityLabel={`${count} candies`}
    >
      <View style={[styles.pill, { borderColor, backgroundColor: mainScreens.idle.surface }]}>
        <View
          style={[
            styles.glyphWrap,
            {
              width: CANDY_HEADER_GLYPH_SIZE,
              height: CANDY_HEADER_GLYPH_SIZE,
              marginTop: -glyphHalf,
              left: -10,
            },
          ]}
          pointerEvents="none"
        >
          <CandyGlyph size={CANDY_HEADER_GLYPH_SIZE} />
        </View>
        <Text style={[styles.count, { color: borderColor }]}>{count}</Text>
      </View>
    </View>
  );
}

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
    if (!collecting || pulseGeneration === 0) return;
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
    <View ref={anchorRef} onLayout={reportAnchor} collapsable={false}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <CandyBalancePill count={count} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingLeft: 10,
    marginLeft: 0,
    paddingVertical: 2,
  },
  pill: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderRadius: 12,
    paddingVertical: 6,
    paddingLeft: 30,
    paddingRight: 10,
    minWidth: 76,
  },
  glyphWrap: {
    position: 'absolute',
    top: '50%',
    zIndex: 1,
  },
  count: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 18,
    lineHeight: 19,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginTop: -1,
  },
});
