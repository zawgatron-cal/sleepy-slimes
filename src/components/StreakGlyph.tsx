/**
 * Sleep streak icon sprites (header pill + info UI).
 */

import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { STREAK_BONUS_MIN_STREAK } from '@/src/constants/game';

const STREAK_ICONS = {
  inactive: require('../../assets/ui/streak-inactive-icon.png'),
  small: require('../../assets/ui/small-streak-icon.png'),
  active: require('../../assets/ui/streak-active-icon.png'),
} as const satisfies Record<StreakIconVariant, number>;

export type StreakIconVariant = 'inactive' | 'small' | 'active';

export const STREAK_HEADER_GLYPH_SIZE = 52;

export function getStreakIconVariant(streak: number): StreakIconVariant {
  if (streak <= 0) return 'inactive';
  if (streak < STREAK_BONUS_MIN_STREAK) return 'small';
  return 'active';
}

export type StreakGlyphProps = {
  variant: StreakIconVariant;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function StreakGlyph({
  variant,
  size = STREAK_HEADER_GLYPH_SIZE,
  style,
}: StreakGlyphProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Image
        source={STREAK_ICONS[variant]}
        style={styles.icon}
        resizeMode="contain"
        accessible={false}
        accessibilityElementsHidden
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
});
