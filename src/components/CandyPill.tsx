/**
 * Presentational candy count badge — overlapping icon + bordered body.
 * Used by tab headers and the collection detail modal (different themes below).
 */

import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { CandyGlyph } from '@/src/components/CandyGlyph';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

export const CANDY_PILL_GLYPH_SIZE = 68;

export type CandyPillProps = {
  count: number;
  borderColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius?: number;
  countFontSize?: number;
  countLineHeight?: number;
  minWidth?: number;
  /** Center the pill body on the card; glyph overlaps from the left (collection modal). */
  centerBody?: boolean;
  centerBodyStyle?: ViewStyle;
  style?: StyleProp<ViewStyle>;
  countStyle?: StyleProp<TextStyle>;
};

export function CandyPill({
  count,
  borderColor,
  backgroundColor,
  textColor,
  borderRadius = 999,
  countFontSize = 20,
  countLineHeight = 20,
  minWidth = 92,
  centerBody = false,
  centerBodyStyle,
  style,
  countStyle,
}: CandyPillProps) {
  const bodyStyle = [
    styles.body,
    centerBody && styles.bodyCentered,
    centerBody && centerBodyStyle,
    { borderColor, backgroundColor, minWidth, borderRadius },
  ];

  const countEl = (
    <Text
      style={[
        styles.count,
        {
          color: textColor,
          fontSize: countFontSize,
          lineHeight: countLineHeight,
        },
        countStyle,
      ]}
    >
      {count}
    </Text>
  );

  if (centerBody) {
    return (
      <View style={[styles.centerBodyOuter, style]}>
        <View style={styles.centerBodyStack}>
          <View style={bodyStyle}>{countEl}</View>
          <View style={styles.centerBodyGlyph} pointerEvents="none">
            <CandyGlyph size={CANDY_PILL_GLYPH_SIZE} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.outer, style]}>
      <View style={styles.glyphWrap} pointerEvents="none">
        <CandyGlyph size={CANDY_PILL_GLYPH_SIZE} />
      </View>
      <View style={bodyStyle}>{countEl}</View>
    </View>
  );
}

/** Sleep / Fuse tab header — capsule shape, idle screen colors. */
export function TabHeaderCandyPill({ count }: { count: number }) {
  const colors = mainScreens.idle;
  return (
    <CandyPill
      count={count}
      borderColor={colors.border}
      backgroundColor={colors.surface}
      textColor={colors.border}
      style={styles.tabHeaderWrap}
    />
  );
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    overflow: 'visible',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    paddingVertical: 4,
    paddingLeft: 28,
    paddingRight: 14,
    marginLeft: -42,
    overflow: 'visible',
  },
  bodyCentered: {
    marginLeft: 0,
    paddingLeft: 14,
    paddingRight: 14,
    alignSelf: 'center',
  },
  centerBodyOuter: {
    width: '100%',
    alignItems: 'center',
    overflow: 'visible',
  },
  centerBodyStack: {
    position: 'relative',
    overflow: 'visible',
    alignSelf: 'center',
  },
  centerBodyGlyph: {
    position: 'absolute',
    left: -(CANDY_PILL_GLYPH_SIZE - 42),
    top: '50%',
    width: CANDY_PILL_GLYPH_SIZE,
    height: CANDY_PILL_GLYPH_SIZE,
    marginTop: -CANDY_PILL_GLYPH_SIZE / 2 + 2,
    zIndex: 2,
  },
  glyphWrap: {
    width: CANDY_PILL_GLYPH_SIZE,
    height: CANDY_PILL_GLYPH_SIZE,
    zIndex: 2,
    marginTop: 2,
  },
  count: {
    fontFamily: APP_FONT_FAMILY,
    fontWeight: '800',
    letterSpacing: 0.2,
    fontVariant: ['tabular-nums'],
    zIndex: 1,
  },
  tabHeaderWrap: {
    paddingVertical: 8,
  },
});
