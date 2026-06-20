/**
 * Candy balance pill atop the collection slime detail modal.
 * Shares `CandyGlyph` with the header pill; layout/colors match `detailModal` theme.
 */

import type { ReactNode } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { CandyGlyph } from '@/src/components/CandyGlyph';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

const t = mainScreens.collection.detailModal;

const GLYPH_SIZE = 58;
const GLYPH_HALF = GLYPH_SIZE / 2;

const PILL_BORDER = 4;
const PILL_PADDING = 6;
const PILL_CONTENT_HEIGHT = 28;
/** Outer size of candy/convert pills (border + padding + content). */
const TOP_PILL_SIZE = PILL_BORDER * 2 + PILL_PADDING * 2 + PILL_CONTENT_HEIGHT;
const CONVERT_GLYPH_SIZE = 22;

/** Fixed pill width; vertical size unchanged via tighter padding around larger content. */
const PILL_WIDTH = 132;

/** Shared top offset for balance + convert pills on the detail modal. */
export const COLLECTION_DETAIL_TOP_PILL_OFFSET = -10;

const pillColors = { borderColor: t.border, backgroundColor: t.bg };

function DetailModalTopPill({
  children,
  width = PILL_WIDTH,
  style,
}: {
  children: ReactNode;
  width?: number;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.pill, { width, minWidth: width }, pillColors, style]}>
      {children}
    </View>
  );
}

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
      <DetailModalTopPill>
        <View style={styles.content}>
          <View style={styles.glyphWrap} pointerEvents="none">
            <CandyGlyph size={GLYPH_SIZE} />
          </View>
          <Text style={styles.count}>{count}</Text>
        </View>
      </DetailModalTopPill>
    </View>
  );
}

export type CollectionDetailConvertPillProps = {
  onPress: () => void;
  accessibilityLabel: string;
  style?: ViewStyle;
};

/** Icon-only top pill — same frame/colors/height as `CollectionDetailCandyPill`. */
export function CollectionDetailConvertPill({
  onPress,
  accessibilityLabel,
  style,
}: CollectionDetailConvertPillProps) {
  return (
    <Pressable
      style={[styles.outer, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <DetailModalTopPill width={TOP_PILL_SIZE} style={styles.convertPill}>
        <View style={styles.convertContent}>
          <CandyGlyph size={CONVERT_GLYPH_SIZE} />
        </View>
      </DetailModalTopPill>
    </Pressable>
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
  convertPill: {
    paddingHorizontal: PILL_PADDING,
  },
  convertContent: {
    width: PILL_CONTENT_HEIGHT,
    height: PILL_CONTENT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
