/**
 * Sleep tab header — candy pill above collect scrim, streak below it (z-order only).
 */

import { StyleSheet, View } from 'react-native';
import { StreakCounterPill } from '@/src/components/StreakCounterPill';
import { TabHeaderShell } from '@/src/components/TabHeaderShell';
import { CandyCollectScrim } from '@/src/components/sleep/CandyCollectScrim';
import { useCandyCollectStore } from '@/src/stores';
import { mainScreens } from '@/src/theme/mainScreensTheme';

export function SleepTabHeader() {
  const collecting = useCandyCollectStore((s) => s.active);

  return (
    <TabHeaderShell
      backgroundColor={mainScreens.idle.bg}
      overlay={
        collecting ? (
          <View style={styles.scrimSlot} pointerEvents="auto">
            <CandyCollectScrim />
          </View>
        ) : null
      }
    >
      <View style={styles.streakSlot}>
        <StreakCounterPill />
      </View>
    </TabHeaderShell>
  );
}

const styles = StyleSheet.create({
  streakSlot: {
    zIndex: 1,
    marginRight: 4,
  },
  scrimSlot: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
});
