/**
 * Sleep tab header — candy pill above collect scrim, streak below it (z-order only).
 */

import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CandyCounterPill } from '@/src/components/CandyCounterPill';
import { StreakCounterPill } from '@/src/components/StreakCounterPill';
import { CandyCollectScrim } from '@/src/components/sleep/CandyCollectScrim';
import { useCandyCollectStore } from '@/src/stores';
import { mainScreens } from '@/src/theme/mainScreensTheme';

const HEADER_CONTENT_HEIGHT = 44;

export function SleepTabHeader() {
  const insets = useSafeAreaInsets();
  const collecting = useCandyCollectStore((s) => s.active);

  return (
    <View style={[styles.root, { backgroundColor: mainScreens.idle.bg }]}>
      {collecting ? (
        <View style={styles.scrimSlot} pointerEvents="auto">
          <CandyCollectScrim />
        </View>
      ) : null}

      <View style={{ height: insets.top }} />

      <View style={styles.row}>
        <View style={styles.streakSlot}>
          <StreakCounterPill />
        </View>
      </View>

      <View style={[styles.candySlot, { top: insets.top }]}>
        <CandyCounterPill />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    position: 'relative',
  },
  row: {
    minHeight: HEADER_CONTENT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  candySlot: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 3,
  },
  streakSlot: {
    zIndex: 1,
  },
  scrimSlot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
});
