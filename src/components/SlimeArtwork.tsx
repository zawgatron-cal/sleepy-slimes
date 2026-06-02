/**
 * Slime species artwork with optional Prismatic foil shine overlay.
 * Foil is alpha-masked to the PNG so transparent pixels stay clear.
 */

import MaskedView from '@react-native-masked-view/masked-view';
import { useMemo } from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  View,
  type ImageSourcePropType,
  type ImageStyle,
  type ViewStyle,
} from 'react-native';
import { SlimeVariant, type SlimeVariant as SlimeVariantType } from '@/src/constants/game';
import { PrismaticFoilOverlay } from '@/src/components/PrismaticFoilOverlay';
import { getSlimeImageSource } from '@/src/utils/slimeAssets';

export type SlimeArtworkProps = {
  speciesId: string;
  variant?: SlimeVariantType;
  /** Use instead of `speciesId` when the source is already resolved. */
  imageSource?: ImageSourcePropType;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
};

export function isPrismaticSlimeVariant(variant?: SlimeVariantType): boolean {
  return variant === SlimeVariant.PRISMATIC;
}

export function SlimeArtwork({
  speciesId,
  variant,
  imageSource,
  style,
  imageStyle,
  resizeMode = 'contain',
}: SlimeArtworkProps) {
  const source = imageSource ?? getSlimeImageSource(speciesId);
  const showFoil = isPrismaticSlimeVariant(variant);

  const imageStyleCombined: ImageStyle[] = [styles.image, imageStyle ?? {}];

  const foilMaskElement = useMemo(
    () => (
      <View style={styles.maskElementRoot} collapsable={false}>
        <Image source={source} style={imageStyleCombined} resizeMode={resizeMode} />
      </View>
    ),
    [source, imageStyle, resizeMode]
  );

  return (
    <View style={[styles.root, style]} collapsable={false}>
      <Image source={source} style={imageStyleCombined} resizeMode={resizeMode} />
      {showFoil ? (
        Platform.OS === 'web' ? (
          <View style={styles.foilMaskHost} pointerEvents="none" collapsable={false}>
            <PrismaticFoilOverlay />
          </View>
        ) : (
          <MaskedView
            style={styles.foilMaskHost}
            pointerEvents="none"
            maskElement={foilMaskElement}
          >
            <View style={styles.foilFill} collapsable={false}>
              <PrismaticFoilOverlay />
            </View>
          </MaskedView>
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  foilMaskHost: {
    ...StyleSheet.absoluteFillObject,
  },
  maskElementRoot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  /** MaskedView children need a bounded fill for the foil layers. */
  foilFill: {
    flex: 1,
  },
});
