import type { ImageSourcePropType } from 'react-native';

const SLIME_IMAGE_BY_SPECIES_ID: Record<string, ImageSourcePropType> = {
  bee_slime: require('../../assets/bee_slime.png'),
  berry_slime: require('../../assets/berry_slime.png'),
  flower_slime: require('../../assets/flower_slime.png'),
  grass_slime: require('../../assets/grass_slime.png'),
  nimbus_slime: require('../../assets/nimbus_slime.png'),
  pollen_slime: require('../../assets/pollen_slime.png'),
  sun_slime: require('../../assets/sun_slime.png'),
  wind_slime: require('../../assets/wind_slime.png'),
};

const FALLBACK_SLIME_IMAGE: ImageSourcePropType = require('../../assets/slime_not_found.png');

export function getSlimeImageSource(speciesId: string | null | undefined): ImageSourcePropType {
  if (!speciesId) return FALLBACK_SLIME_IMAGE;
  return SLIME_IMAGE_BY_SPECIES_ID[speciesId] ?? FALLBACK_SLIME_IMAGE;
}
