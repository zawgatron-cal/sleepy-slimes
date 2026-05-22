/**
 * Candy balance pill atop the collection slime detail modal.
 * Shares `CandyGlyph` with the header pill; layout/colors match `detailModal` theme.
 */

import { Text, View, type ViewStyle } from 'react-native';
import { CandyGlyph } from '@/src/components/CandyGlyph';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

const t = mainScreens.collection.detailModal;

const GLYPH_SIZE = 58;
const GLYPH_HALF = GLYPH_SIZE / 2;

/** Fixed pill width; vertical size unchanged via tighter padding around larger content. */
const PILL_WIDTH = 132;

export type CollectionDetailCandyPillProps = {
  count: number;
  style?: ViewStyle;
};

export function CollectionDetailCandyPill({ count, style }: CollectionDetailCandyPillProps) {
  return (
    <View
      style={[styles.outer, style]}
      accessibilityRole="text"
      accessibilityLabel={`${count} candies`}
    >
      <View
        style={[
          styles.pill,
          { borderColor: t.border, backgroundColor: t.bg },
        ]}
      >
        <View style={styles.content}>
          <View style={styles.glyphWrap} pointerEvents="none">
            <CandyGlyph size={GLYPH_SIZE} />
          </View>
          <Text style={styles.count}>{count}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = createAppStyles({
  outer: {
    alignItems: 'center',
  },
  pill: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderRadius: 8,
    width: PILL_WIDTH,
    minWidth: PILL_WIDTH,
    paddingVertical: 6,
    paddingHorizontal: 18,
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 34,
    paddingRight: 4,
  },
  glyphWrap: {
    position: 'absolute',
    left: -14,
    top: '50%',
    width: GLYPH_SIZE,
    height: GLYPH_SIZE,
    marginTop: -GLYPH_HALF,
    zIndex: 1,
  },
  count: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
    fontVariant: ['tabular-nums'],
    color: t.accent,
  },
});
