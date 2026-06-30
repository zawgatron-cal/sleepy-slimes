/**
 * One-shot sparkle / confetti burst for the sleep reveal "New!" badge.
 */

import { StyleSheet, View } from 'react-native';
import { SleepRevealConfettiBurst } from '@/src/components/sleep/SleepRevealConfettiBurst';

export type NewBadgeSparkleBurstProps = {
  burstKey: number;
  delayMs: number;
};

export function NewBadgeSparkleBurst({ burstKey, delayMs }: NewBadgeSparkleBurstProps) {
  return (
    <SleepRevealConfettiBurst
      burstKey={burstKey}
      delayMs={delayMs}
      theme="newBadge"
      hostStyle={styles.host}
    />
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 0,
    height: 0,
    zIndex: 5,
    overflow: 'visible',
  },
});
