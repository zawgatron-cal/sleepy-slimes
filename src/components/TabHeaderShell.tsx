/**
 * Shared tab header frame — candy pill slot matches Sleep + Fuse tabs.
 */

import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CandyCounterPill } from '@/src/components/CandyCounterPill';

export const TAB_HEADER_CONTENT_HEIGHT = 44;

type TabHeaderShellProps = {
  backgroundColor: string;
  children?: ReactNode;
  overlay?: ReactNode;
};

export function TabHeaderShell({ backgroundColor, children, overlay }: TabHeaderShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor }]}>
      {overlay}
      <View style={{ height: insets.top }} />
      <View style={styles.contentRow}>{children}</View>
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
  contentRow: {
    minHeight: TAB_HEADER_CONTENT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  candySlot: {
    position: 'absolute',
    left: 8,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 3,
  },
});
