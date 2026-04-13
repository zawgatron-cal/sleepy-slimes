import type { ImageSourcePropType } from 'react-native';

const SLIME_IMAGE_BY_SPECIES_ID: Record<string, ImageSourcePropType> = {
  bee_slime: require('../../assets/slimes/bee_slime.png'),
  berry_slime: require('../../assets/slimes/berry_slime.png'),
  flower_slime: require('../../assets/slimes/flower_slime.png'),
  grass_slime: require('../../assets/slimes/grass_slime.png'),
  nimbus_slime: require('../../assets/slimes/nimbus_slime.png'),
  pollen_slime: require('../../assets/slimes/pollen_slime.png'),
  sun_slime: require('../../assets/slimes/sun_slime.png'),
  wind_slime: require('../../assets/slimes/wind_slime.png'),
};

const FALLBACK_SLIME_IMAGE: ImageSourcePropType = require('../../assets/slimes/slime_not_found.png');

const ALL_SLIME_IMAGE_SOURCES: ImageSourcePropType[] = [
  ...Object.values(SLIME_IMAGE_BY_SPECIES_ID),
  FALLBACK_SLIME_IMAGE,
];

export function getSlimeImageSource(speciesId: string | null | undefined): ImageSourcePropType {
  if (!speciesId) return FALLBACK_SLIME_IMAGE;
  return SLIME_IMAGE_BY_SPECIES_ID[speciesId] ?? FALLBACK_SLIME_IMAGE;
}

/** Preloadable list for `Asset.loadAsync` to avoid first-show decode lag in reveal flow. */
export function getAllSlimeImageSources(): ImageSourcePropType[] {
  return ALL_SLIME_IMAGE_SOURCES;
}
