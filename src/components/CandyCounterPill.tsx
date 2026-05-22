/**
 * Header candy balance pill — reads from candies store.
 */

import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { CandyGlyph } from '@/src/components/CandyGlyph';
import { useCandiesStore } from '@/src/stores';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

const GLYPH_SIZE = 52;

export type CandyBalancePillProps = {
  count: number;
  style?: ViewStyle;
};

/** Tab header candy pill (count passed in or via `CandyCounterPill`). */
export function CandyBalancePill({ count, style }: CandyBalancePillProps) {
  const borderColor = mainScreens.idle.border;
  const glyphHalf = GLYPH_SIZE / 2;

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
            { width: GLYPH_SIZE, height: GLYPH_SIZE, marginTop: -glyphHalf, left: -10 },
          ]}
          pointerEvents="none"
        >
          <CandyGlyph size={GLYPH_SIZE} />
        </View>
        <Text style={[styles.count, { color: borderColor }]}>{count}</Text>
      </View>
    </View>
  );
}

export function CandyCounterPill() {
  const count = useCandiesStore((s) => s.total);
  return <CandyBalancePill count={count} />;
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
