/**
 * Sleep streak pill — sprite icon + count (mirrors CandyCounterPill; header-right).
 */

import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { StreakGlyph, getStreakIconVariant, STREAK_HEADER_GLYPH_SIZE } from '@/src/components/StreakGlyph';
import { StreakInfoModal } from '@/src/components/StreakInfoModal';
import { useSleepStore } from '@/src/stores';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { APP_FONT_FAMILY } from '@/src/theme/fonts';

export function StreakCounterPill() {
  const streak = useSleepStore((s) => s.currentStreak);
  const border = mainScreens.idle.border;
  const [infoVisible, setInfoVisible] = useState(false);
  const iconVariant = getStreakIconVariant(streak);

  return (
    <>
      <Pressable
        style={styles.outer}
        onPress={() => setInfoVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`${streak} day sleep streak. Tap for details.`}
        hitSlop={6}
      >
        <View style={[styles.pill, { borderColor: border }]}>
          <Text style={[styles.count, { color: border }]}>{streak}</Text>
          <View style={styles.glyphWrap} pointerEvents="none">
            <StreakGlyph variant={iconVariant} size={STREAK_HEADER_GLYPH_SIZE} />
          </View>
        </View>
      </Pressable>

      <StreakInfoModal visible={infoVisible} onClose={() => setInfoVisible(false)} />
    </>
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
    paddingVertical: 4,
    paddingLeft: 14,
    paddingRight: 28,
    minWidth: 40,
    overflow: 'visible',
  },
  glyphWrap: {
    position: 'absolute',
    right: -20,
    width: STREAK_HEADER_GLYPH_SIZE,
    height: STREAK_HEADER_GLYPH_SIZE,
    top: '50%',
    marginTop: -STREAK_HEADER_GLYPH_SIZE / 2 - 1,
    zIndex: 1,
  },
  count: {
    fontFamily: APP_FONT_FAMILY,
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
    fontVariant: ['tabular-nums'],
  },
});
