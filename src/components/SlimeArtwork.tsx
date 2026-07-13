/**
 * Slime species artwork with optional Prismatic / Exotic / Gold foil overlays.
 * Foil is alpha-masked to the PNG so transparent pixels stay clear.
 */

import MaskedView from '@react-native-masked-view/masked-view';
import { memo, useMemo, type ComponentType } from 'react';
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
import { ExoticFoilOverlay } from '@/src/components/ExoticFoilOverlay';
import { GoldFoilOverlay } from '@/src/components/GoldFoilOverlay';
import { PrismaticFoilOverlay } from '@/src/components/PrismaticFoilOverlay';
import type { FoilOverlayProps } from '@/src/components/foilOverlayTypes';
import { VariantArtContrast } from '@/src/components/VariantArtPopLayers';
import type { FoilMotion } from '@/src/stores/useFoilAnimationStore';
import { resolveSlimeFoilMotion } from '@/src/stores/useAnimationSettingsStore';
import { useSlimeImageCacheKey, useSlimeImageSource } from '@/src/utils/slimeAssets';

export type SlimeArtworkProps = {
  speciesId: string;
  variant?: SlimeVariantType;
  /** Use instead of `speciesId` when the source is already resolved. */
  imageSource?: ImageSourcePropType;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
  /** full = animated foil; static = cheap sheen; off = base art only. */
  foilMotion?: FoilMotion;
};

export function isPrismaticSlimeVariant(variant?: SlimeVariantType): boolean {
  return variant === SlimeVariant.PRISMATIC;
}

export function isGoldSlimeVariant(variant?: SlimeVariantType): boolean {
  return variant === SlimeVariant.GOLD;
}

export function isExoticSlimeVariant(variant?: SlimeVariantType): boolean {
  return variant === SlimeVariant.EXOTIC;
}

type FoilOverlayComponent = ComponentType<FoilOverlayProps>;

function foilOverlayForVariant(variant?: SlimeVariantType): FoilOverlayComponent | null {
  if (variant === SlimeVariant.PRISMATIC) return PrismaticFoilOverlay;
  if (variant === SlimeVariant.EXOTIC) return ExoticFoilOverlay;
  if (variant === SlimeVariant.GOLD) return GoldFoilOverlay;
  return null;
}

export const SlimeArtwork = memo(function SlimeArtwork({
  speciesId,
  variant,
  imageSource,
  style,
  imageStyle,
  resizeMode = 'contain',
  foilMotion = 'full',
}: SlimeArtworkProps) {
  const resolvedFoilMotion = resolveSlimeFoilMotion(foilMotion);
  const resolvedSource = useSlimeImageSource(speciesId);
  const source = imageSource ?? resolvedSource;
  const imageKey = useSlimeImageCacheKey(speciesId);
  const FoilOverlay = foilOverlayForVariant(variant);
  const showFoil = FoilOverlay != null && resolvedFoilMotion !== 'off';
  const showContrast = resolvedFoilMotion !== 'off';

  const imageStyleCombined: ImageStyle[] = [styles.image, imageStyle ?? {}];

  const foilMaskElement = useMemo(
    () => (
      <View style={styles.maskElementRoot} collapsable={false}>
        <Image
          key={imageKey}
          source={source}
          style={imageStyleCombined}
          resizeMode={resizeMode}
        />
      </View>
    ),
    [source, imageKey, imageStyle, resizeMode]
  );

  return (
    <View style={[styles.root, style]} collapsable={false}>
      <Image
        key={imageKey}
        source={source}
        style={imageStyleCombined}
        resizeMode={resizeMode}
      />
      {showContrast ? (
        <VariantArtContrast
          source={source}
          variant={variant}
          imageStyle={imageStyleCombined}
          resizeMode={resizeMode}
        />
      ) : null}
      {showFoil ? (
        Platform.OS === 'web' ? (
          <View style={styles.foilMaskHost} pointerEvents="none" collapsable={false}>
            <FoilOverlay motion={resolvedFoilMotion} />
          </View>
        ) : (
          <MaskedView
            style={styles.foilMaskHost}
            pointerEvents="none"
            maskElement={foilMaskElement}
          >
            <View style={styles.foilFill} collapsable={false}>
              <FoilOverlay motion={resolvedFoilMotion} />
            </View>
          </MaskedView>
        )
      ) : null}
    </View>
  );
});

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
