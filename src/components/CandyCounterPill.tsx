/**
 * Candy balance pill — vector candy + count (matches kawaii header mock; no bitmap).
 */

import { useId, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, G, Rect, Defs, ClipPath } from 'react-native-svg';
import { useCandiesStore } from '@/src/stores';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

const GLYPH = 52;
const STRIPE_PINK = '#FF5C8D';
const STRIPE_YELLOW = '#F9E04A';
const BOW = '#FF6B9D';
const OUTLINE = '#4A3540';
const BODY_FILL = '#FFF5F7';

function CandyGlyph() {
  const rawId = useId();
  const clipId = useMemo(
    () => `candy-clip-${rawId.replace(/[^a-zA-Z0-9]/g, '')}`,
    [rawId]
  );
  const cx = 26;
  const cy = 26;

  return (
    <Svg width={GLYPH} height={GLYPH} viewBox="0 0 52 52" accessibilityElementsHidden>
      <Ellipse cx={28} cy={29} rx={16} ry={12} fill="rgba(0,0,0,0.08)" />
      <G transform={`rotate(-38 ${cx} ${cy})`}>
        <Defs>
          <ClipPath id={clipId}>
            <Ellipse cx={cx} cy={cy} rx={11} ry={9.2} />
          </ClipPath>
        </Defs>
        <Ellipse
          cx={14}
          cy={cy}
          rx={5.2}
          ry={4.6}
          fill={BOW}
          stroke={OUTLINE}
          strokeWidth={1.6}
        />
        <Ellipse
          cx={38}
          cy={cy}
          rx={5.2}
          ry={4.6}
          fill={BOW}
          stroke={OUTLINE}
          strokeWidth={1.6}
        />
        <Ellipse cx={cx} cy={cy} rx={11} ry={9.2} fill={BODY_FILL} />
        <G clipPath={`url(#${clipId})`}>
          {[-10, -6, -2, 2, 6, 10, 14].map((dx, i) => (
            <Rect
              key={i}
              x={cx + dx - 1.75}
              y={15}
              width={3.5}
              height={22}
              fill={i % 2 === 0 ? STRIPE_PINK : STRIPE_YELLOW}
              rx={0.8}
            />
          ))}
        </G>
        <Ellipse
          cx={cx}
          cy={cy}
          rx={11}
          ry={9.2}
          fill="none"
          stroke={OUTLINE}
          strokeWidth={2}
        />
      </G>
    </Svg>
  );
}

export function CandyCounterPill() {
  const count = useCandiesStore((s) => s.total);
  const border = mainScreens.idle.borderOne;

  return (
    <View
      style={styles.outer}
      accessibilityRole="text"
      accessibilityLabel={`${count} candies`}
    >
      <View style={[styles.pill, { borderColor: border }]}>
        <View style={styles.glyphWrap} pointerEvents="none">
          <CandyGlyph />
        </View>
        <Text style={[styles.count, { color: border }]}>{count}</Text>
      </View>
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
    backgroundColor: mainScreens.idle.surface,
    borderWidth: 4,
    borderRadius: 12,
    paddingVertical: 6,
    paddingLeft: 30,
    paddingRight: 0,
    minWidth: 76,
  },
  glyphWrap: {
    position: 'absolute',
    left: -10,
    width: GLYPH,
    height: GLYPH,
    top: '50%',
    marginTop: -24,
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
