/**
 * Slime species shape filled with a solid silhouette color (alpha-masked PNG).
 */

import MaskedView from '@react-native-masked-view/masked-view';
import { memo } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  View,
  type ImageStyle,
  type ViewStyle,
} from 'react-native';
import { mainScreens } from '@/src/theme/mainScreensTheme';
import {
  useSlimeImageCacheKey,
  useSlimeImageSource,
} from '@/src/utils/slimeAssets';

const SILHOUETTE_FILL = mainScreens.slimepedia.undiscovered;

export type SlimeSilhouetteArtworkProps = {
  speciesId: string;
  /** Silhouette fill; defaults to slimepedia undiscovered tint. */
  fillColor?: string;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
};

export const SlimeSilhouetteArtwork = memo(function SlimeSilhouetteArtwork({
  speciesId,
  fillColor = SILHOUETTE_FILL,
  style,
  imageStyle,
  resizeMode = 'contain',
}: SlimeSilhouetteArtworkProps) {
  const source = useSlimeImageSource(speciesId);
  const imageKey = useSlimeImageCacheKey(speciesId);
  const imageStyles = [styles.image, imageStyle ?? {}];

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.root, style]}>
        <Image
          key={imageKey}
          source={source}
          style={[imageStyles, { tintColor: fillColor }]}
          resizeMode={resizeMode}
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, style]}>
      <MaskedView
        style={StyleSheet.absoluteFillObject}
        maskElement={
          <View style={styles.maskRoot} collapsable={false}>
            <Image
              key={imageKey}
              source={source}
              style={imageStyles}
              resizeMode={resizeMode}
            />
          </View>
        }
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: fillColor }]} />
      </MaskedView>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    overflow: 'hidden',
  },
  maskRoot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
