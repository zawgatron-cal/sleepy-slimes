/**
 * Detail contrast for gold / exotic — self-multiply + self-screen.
 * Darkens existing shadows (eyes, line art) and lifts existing highlights;
 * no flat tint wash over the whole sprite.
 */

import { Image, StyleSheet, type ImageSourcePropType, type ImageStyle } from 'react-native';
import { SlimeVariant, type SlimeVariant as SlimeVariantType } from '@/src/constants/game';

type ContrastConfig = {
  /** Self-multiply strength — pushes dark details darker. */
  shadowCrush: number;
  /** Self-screen strength — lifts bright details (eyes, gleams). */
  highlightLift: number;
};

const CONTRAST_BY_VARIANT: Partial<Record<SlimeVariantType, ContrastConfig>> = {
  [SlimeVariant.GOLD]: {
    shadowCrush: 0.4,
    highlightLift: 0.22,
  },
  [SlimeVariant.EXOTIC]: {
    shadowCrush: 0.38,
    highlightLift: 0.24,
  },
};

type Props = {
  source: ImageSourcePropType;
  variant?: SlimeVariantType;
  imageStyle: ImageStyle[];
  resizeMode: 'contain' | 'cover' | 'stretch' | 'center';
};

export function VariantArtContrast({
  source,
  variant,
  imageStyle,
  resizeMode,
}: Props) {
  const config = variant ? CONTRAST_BY_VARIANT[variant] : null;
  if (!config) return null;

  return (
    <>
      <Image
        source={source}
        style={[...imageStyle, styles.shadowCrush, { opacity: config.shadowCrush }]}
        resizeMode={resizeMode}
      />
      <Image
        source={source}
        style={[...imageStyle, styles.highlightLift, { opacity: config.highlightLift }]}
        resizeMode={resizeMode}
      />
    </>
  );
}

const styles = StyleSheet.create({
  shadowCrush: {
    ...StyleSheet.absoluteFillObject,
    mixBlendMode: 'multiply',
  } as ImageStyle,
  highlightLift: {
    ...StyleSheet.absoluteFillObject,
    mixBlendMode: 'screen',
  } as ImageStyle,
});
