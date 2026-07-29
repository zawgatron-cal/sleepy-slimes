/**
 * Tab bar line-art icons — single-color PNG recolored via alpha mask + solid fill.
 */

import MaskedView from '@react-native-masked-view/masked-view';
import {
  Image,
  Platform,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type TabBarIconGlyphProps = {
  source: ImageSourcePropType;
  color: string;
  size: number;
  opacity?: number;
  style?: StyleProp<ViewStyle>;
};

export function TabBarIconGlyph({
  source,
  color,
  size,
  opacity = 1,
  style,
}: TabBarIconGlyphProps) {
  const sizeStyle = { width: size, height: size, opacity };

  if (Platform.OS === 'web') {
    return (
      <Image
        source={source}
        style={[sizeStyle as ImageStyle, styles.webIcon]}
        resizeMode="contain"
        tintColor={color}
        accessible={false}
        accessibilityElementsHidden
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View style={[sizeStyle, style]}>
      <MaskedView
        style={StyleSheet.absoluteFillObject}
        maskElement={
          <View style={styles.maskRoot} collapsable={false}>
            <Image
              source={source}
              style={styles.maskImage}
              resizeMode="contain"
              accessible={false}
              accessibilityElementsHidden
              accessibilityIgnoresInvertColors
            />
          </View>
        }
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: color }]} />
      </MaskedView>
    </View>
  );
}

const styles = StyleSheet.create({
  webIcon: {
    width: '100%',
    height: '100%',
  },
  maskRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  maskImage: {
    width: '100%',
    height: '100%',
  },
});
