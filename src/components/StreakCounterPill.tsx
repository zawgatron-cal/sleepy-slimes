/**
 * Sleep streak pill — vector flame + count (mirrors CandyCounterPill; header-right).
 */

import { StyleSheet, Text, View } from 'react-native';
import Svg, { Ellipse, G, Path } from 'react-native-svg';
import { useSleepStore } from '@/src/stores';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

const GLYPH = 52;
const OUTLINE = '#4A3540';
const FLAME_OUTER = '#FF7A64';
const FLAME_INNER = '#FFEBA8';
const FLAME_TIP = '#FF9EC7';

function FlameGlyph() {
  return (
    <Svg width={GLYPH} height={GLYPH} viewBox="0 0 52 52" accessibilityElementsHidden>
      <Ellipse cx={24} cy={30} rx={13} ry={9} fill="rgba(0,0,0,0.08)" />
      <G transform="rotate(6 26 26)">
        <Path
          d="M 26 43 C 16 34 14 24 19 15 C 21 11 24 10 26 8 C 28 10 31 11 33 15 C 38 24 36 34 26 43 Z"
          fill={FLAME_OUTER}
          stroke={OUTLINE}
          strokeWidth={2}
          strokeLinejoin="round"
        />
        <Path
          d="M 26 37 C 19 31 18 23 22 17 C 24 15 26 14 26 12 C 26 14 28 15 30 17 C 34 23 33 31 26 37 Z"
          fill={FLAME_INNER}
        />
        <Path
          d="M 26 18 C 25 16 25 14 26 13 C 27 14 27 16 26 18 Z"
          fill={FLAME_TIP}
          opacity={0.9}
        />
      </G>
    </Svg>
  );
}

export function StreakCounterPill() {
  const streak = useSleepStore((s) => s.currentStreak);
  const border = mainScreens.idle.border;

  return (
    <View
      style={styles.outer}
      accessibilityRole="text"
      accessibilityLabel={`${streak} day sleep streak`}
    >
      <View style={[styles.pill, { borderColor: border }]}>
        <Text style={[styles.count, { color: border }]}>{streak}</Text>
        <View style={styles.glyphWrap} pointerEvents="none">
          <FlameGlyph />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingRight: 10,
    marginRight: 4,
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
    paddingLeft: 8,
    paddingRight: 38,
    minWidth: 40,
  },
  glyphWrap: {
    position: 'absolute',
    right: -8,
    width: GLYPH,
    height: GLYPH,
    top: '75%',
    marginTop: -26,
    zIndex: 1,
  },
  count: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 17,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginTop: -1,
  },
});
