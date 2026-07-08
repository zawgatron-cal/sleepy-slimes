/**
 * Candy icon (shared by header, collection detail, fusion cost, sleep collect).
 */

import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

const CANDY_ICON = require('../../assets/ui/candy_icon.png');

const DEFAULT_SIZE = 52;

export type CandyGlyphProps = {
  size?: number;
  style?: StyleProp<ViewStyle>;
};

export function CandyGlyph({ size = DEFAULT_SIZE, style }: CandyGlyphProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Image
        source={CANDY_ICON}
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
