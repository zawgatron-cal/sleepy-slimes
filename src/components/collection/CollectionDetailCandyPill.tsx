/**
 * Collection slime detail modal — candy balance + convert (recycle) pills.
 */

import type { ReactNode } from 'react';
import { Pressable, View, type ViewProps, type ViewStyle } from 'react-native';
import { CandyGlyph } from '@/src/components/CandyGlyph';
import { CandyPill } from '@/src/components/CandyPill';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import { createAppStyles } from '@/src/theme/createAppStyles';

const t = mainScreens.collection.detailModal;

/** Shared chrome for modal balance + convert pills (48px outer height). */
export const COLLECTION_MODAL_PILL_BORDER = 4;
export const COLLECTION_MODAL_PILL_RADIUS = 8;
export const COLLECTION_MODAL_PILL_PAD = 6;
export const COLLECTION_MODAL_PILL_CONTENT = 28;
export const COLLECTION_MODAL_PILL_HEIGHT =
  COLLECTION_MODAL_PILL_BORDER * 2 +
  COLLECTION_MODAL_PILL_PAD * 2 +
  COLLECTION_MODAL_PILL_CONTENT;

/** Shared top offset for balance + convert pills on the detail modal. */
export const COLLECTION_DETAIL_TOP_PILL_OFFSET = -40;

const collectionModalBodyStyle: ViewStyle = {
  paddingVertical: COLLECTION_MODAL_PILL_PAD,
  paddingHorizontal: 14,
  height: COLLECTION_MODAL_PILL_HEIGHT,
  minHeight: COLLECTION_MODAL_PILL_HEIGHT,
};

function ConvertPillFrame({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        styles.convertFrame,
        { borderColor: t.border, backgroundColor: t.bg },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export type CollectionModalCandyPillProps = {
  count: number;
  style?: ViewStyle;
} & Pick<ViewProps, 'accessibilityRole' | 'accessibilityLabel' | 'pointerEvents'>;

/** Collection slime detail modal — rectangular body, modal accent colors. */
export function CollectionModalCandyPill({
  count,
  style,
  ...slotProps
}: CollectionModalCandyPillProps) {
  return (
    <View style={[styles.collectionBar, style]} {...slotProps}>
      <CandyPill
        centerBody
        centerBodyStyle={collectionModalBodyStyle}
        count={count}
        borderColor={t.border}
        backgroundColor={t.bg}
        textColor={t.accent}
        borderRadius={COLLECTION_MODAL_PILL_RADIUS}
        countFontSize={22}
        countLineHeight={COLLECTION_MODAL_PILL_CONTENT}
        minWidth={132}
      />
    </View>
  );
}

export type CollectionDetailCandyPillProps = {
  count: number;
  style?: ViewStyle;
};

export function CollectionDetailCandyPill({ count, style }: CollectionDetailCandyPillProps) {
  return (
    <CollectionModalCandyPill
      count={count}
      style={style}
      pointerEvents="none"
      accessibilityRole="text"
      accessibilityLabel={`${count} candies`}
    />
  );
}

export type CollectionDetailConvertPillProps = {
  onPress: () => void;
  accessibilityLabel: string;
  style?: ViewStyle;
};

export function CollectionDetailConvertPill({
  onPress,
  accessibilityLabel,
  style,
}: CollectionDetailConvertPillProps) {
  return (
    <Pressable
      style={[styles.convertOuter, style]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
    >
      <ConvertPillFrame>
        <View style={styles.convertContent}>
          <CandyGlyph size={22} />
        </View>
      </ConvertPillFrame>
    </Pressable>
  );
}

const styles = createAppStyles({
  collectionBar: {
    width: '100%',
    overflow: 'visible',
  },
  convertOuter: {
    alignItems: 'center',
  },
  convertFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: COLLECTION_MODAL_PILL_BORDER,
    borderRadius: COLLECTION_MODAL_PILL_RADIUS,
    width: COLLECTION_MODAL_PILL_HEIGHT,
    height: COLLECTION_MODAL_PILL_HEIGHT,
    paddingVertical: COLLECTION_MODAL_PILL_PAD,
    paddingHorizontal: COLLECTION_MODAL_PILL_PAD,
    overflow: 'hidden',
  },
  convertContent: {
    width: COLLECTION_MODAL_PILL_CONTENT,
    height: COLLECTION_MODAL_PILL_CONTENT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
