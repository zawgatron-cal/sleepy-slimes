import { useMemo } from 'react';
import { Image, type ImageSourcePropType, type ImageStyle } from 'react-native';
import { useDevSettingsStore } from '@/src/stores/useDevSettingsStore';
import { mainScreens } from '@/src/theme/mainScreensTheme';

/**
 * Standard variant art — one PNG per species in `assets/slimes/standard/`.
 * Missing art uses a copied `slime_not_found` stub until the real PNG is dropped in.
 *
 * Note: Metro deduplicates identical PNG bytes — stub species share one bundled asset
 * and look the same until you replace each file with unique art.
 */
const SLIME_IMAGE_BY_SPECIES_ID: Record<string, ImageSourcePropType> = {
  abyssal_slime: require('../../assets/slimes/standard/abyssal_slime.png'),
  ancient_slime: require('../../assets/slimes/standard/ancient_slime.png'),
  angel_slime: require('../../assets/slimes/standard/angel_slime.png'),
  angler_slime: require('../../assets/slimes/standard/angler_slime.png'),
  astral_slime: require('../../assets/slimes/standard/astral_slime.png'),
  aurora_slime: require('../../assets/slimes/standard/aurora_slime.png'),
  barnacle_slime: require('../../assets/slimes/standard/barnacle_slime.png'),
  bat_slime: require('../../assets/slimes/standard/bat_slime.png'),
  battery_slime: require('../../assets/slimes/standard/battery_slime.png'),
  bear_slime: require('../../assets/slimes/standard/bear_slime.png'),
  bee_slime: require('../../assets/slimes/standard/bee_slime.png'),
  berry_slime: require('../../assets/slimes/standard/berry_slime.png'),
  bioluminescent_slime: require('../../assets/slimes/standard/bioluminescent_slime.png'),
  black_hole_slime: require('../../assets/slimes/standard/black_hole_slime.png'),
  bone_shark_slime: require('../../assets/slimes/standard/bone_shark_slime.png'),
  butterfly_slime: require('../../assets/slimes/standard/butterfly_slime.png'),
  candy_slime: require('../../assets/slimes/standard/candy_slime.png'),
  cat_slime: require('../../assets/slimes/standard/cat_slime.png'),
  catfish_slime: require('../../assets/slimes/standard/catfish_slime.png'),
  clay_slime: require('../../assets/slimes/standard/clay_slime.png'),
  clownfish_slime: require('../../assets/slimes/standard/clownfish_slime.png'),
  coral_slime: require('../../assets/slimes/standard/coral_slime.png'),
  crystal_slime: require('../../assets/slimes/standard/crystal_slime.png'),
  drake_slime: require('../../assets/slimes/standard/drake_slime.png'),
  dreamer_slime: require('../../assets/slimes/standard/dreamer_slime.png'),
  drone_slime: require('../../assets/slimes/standard/drone_slime.png'),
  eclipse_slime: require('../../assets/slimes/standard/eclipse_slime.png'),
  finned_slime: require('../../assets/slimes/standard/finned_slime.png'),
  fire_slime: require('../../assets/slimes/standard/fire_slime.png'),
  firefly_slime: require('../../assets/slimes/standard/firefly_slime.png'),
  flower_slime: require('../../assets/slimes/standard/flower_slime.png'),
  glitch_slime: require('../../assets/slimes/standard/glitch_slime.png'),
  golem_slime: require('../../assets/slimes/standard/golem_slime.png'),
  grass_slime: require('../../assets/slimes/standard/grass_slime.png'),
  guardian_slime: require('../../assets/slimes/standard/guardian_slime.png'),
  his_purness_slime: require('../../assets/slimes/standard/his_purness_slime.png'),
  hologram_slime: require('../../assets/slimes/standard/hologram_slime.png'),
  honey_slime: require('../../assets/slimes/standard/honey_slime.png'),
  hunter_slime: require('../../assets/slimes/standard/hunter_slime.png'),
  jetpack_slime: require('../../assets/slimes/standard/jetpack_slime.png'),
  kelp_slime: require('../../assets/slimes/standard/kelp_slime.png'),
  matrix_slime: require('../../assets/slimes/standard/matrix_slime.png'),
  mayor_slime: require('../../assets/slimes/standard/mayor_slime.png'),
  metal_slime: require('../../assets/slimes/standard/metal_slime.png'),
  moon_slime: require('../../assets/slimes/standard/moon_slime.png'),
  neon_slime: require('../../assets/slimes/standard/neon_slime.png'),
  nimbus_slime: require('../../assets/slimes/standard/nimbus_slime.png'),
  nyan_slime: require('../../assets/slimes/standard/nyan_slime.png'),
  opal_slime: require('../../assets/slimes/standard/opal_slime.png'),
  pearlescent_slime: require('../../assets/slimes/standard/pearlescent_slime.png'),
  phosphor_slime: require('../../assets/slimes/standard/phosphor_slime.png'),
  pirate_slime: require('../../assets/slimes/standard/pirate_slime.png'),
  planet_slime: require('../../assets/slimes/standard/planet_slime.png'),
  plush_slime: require('../../assets/slimes/standard/plush_slime.png'),
  pollen_slime: require('../../assets/slimes/standard/pollen_slime.png'),
  pot_slime: require('../../assets/slimes/standard/pot_slime.png'),
  power_slime: require('../../assets/slimes/standard/power_slime.png'),
  prism_slime: require('../../assets/slimes/standard/prism_slime.png'),
  rainbow_slime: require('../../assets/slimes/standard/rainbow_slime.png'),
  reef_slime: require('../../assets/slimes/standard/reef_slime.png'),
  robo_slime: require('../../assets/slimes/standard/robo_slime.png'),
  royal_slime: require('../../assets/slimes/standard/royal_slime.png'),
  runic_slime: require('../../assets/slimes/standard/runic_slime.png'),
  samara_slime: require('../../assets/slimes/standard/samara_slime.png'),
  sand_slime: require('../../assets/slimes/standard/sand_slime.png'),
  sandcastle_slime: require('../../assets/slimes/standard/sandcastle_slime.png'),
  shark_slime: require('../../assets/slimes/standard/shark_slime.png'),
  skeleton_slime: require('../../assets/slimes/standard/skeleton_slime.png'),
  sleepy_slime: require('../../assets/slimes/standard/sleepy_slime.png'),
  slime_slime: require('../../assets/slimes/standard/slime_slime.png'),
  spirit_slime: require('../../assets/slimes/standard/spirit_slime.png'),
  sun_slime: require('../../assets/slimes/standard/sun_slime.png'),
  sunflower_slime: require('../../assets/slimes/standard/sunflower_slime.png'),
  teddy_slime: require('../../assets/slimes/standard/teddy_slime.png'),
  tempest_slime: require('../../assets/slimes/standard/tempest_slime.png'),
  tv_slime: require('../../assets/slimes/standard/tv_slime.png'),
  urchin_slime: require('../../assets/slimes/standard/urchin_slime.png'),
  wind_slime: require('../../assets/slimes/standard/wind_slime.png'),
};

const FALLBACK_SLIME_IMAGE: ImageSourcePropType = require('../../assets/slimes/slime_not_found.png');

function getRawSlimeModuleSource(speciesId: string | null | undefined): ImageSourcePropType {
  if (!speciesId) return FALLBACK_SLIME_IMAGE;
  return SLIME_IMAGE_BY_SPECIES_ID[speciesId] ?? FALLBACK_SLIME_IMAGE;
}

/**
 * Bind each species to a distinct `{ uri }` so list cells don't share one native bitmap
 * when Metro deduplicates identical stub PNGs to the same module id.
 */
function resolveSlimeImageSource(
  speciesId: string | null | undefined,
  cacheBust = 0
): ImageSourcePropType {
  const cacheKey = speciesId ?? 'fallback';
  const moduleSource = getRawSlimeModuleSource(speciesId);
  const resolved = Image.resolveAssetSource(moduleSource);
  if (!resolved?.uri) return moduleSource;

  const params = [`slime=${encodeURIComponent(cacheKey)}`];
  if (__DEV__ && cacheBust > 0) params.push(`bust=${cacheBust}`);
  const separator = resolved.uri.includes('?') ? '&' : '?';
  return { uri: `${resolved.uri}${separator}${params.join('&')}` };
}

export function getSlimeImageSource(speciesId: string | null | undefined): ImageSourcePropType {
  return resolveSlimeImageSource(speciesId);
}

export function useSlimeImageSource(speciesId: string | null | undefined): ImageSourcePropType {
  const cacheBust = useDevSettingsStore((s) => s.slimeArtCacheBust);
  return useMemo(
    () => resolveSlimeImageSource(speciesId, cacheBust),
    [speciesId, cacheBust]
  );
}

/** Cache-bust key for `<Image key={...}>` after replacing PNGs in dev. */
export function useSlimeImageCacheKey(speciesId: string | null | undefined): string {
  const bust = useDevSettingsStore((s) => s.slimeArtCacheBust);
  return `${speciesId ?? 'unknown'}-${bust}`;
}

/**
 * Bundled modules for `Asset.loadAsync` — only preload slimes you will show (e.g. reveal batch).
 */
export function getSlimeImageSourcesForPreload(speciesIds: Iterable<string>): number[] {
  const unique = [...new Set(speciesIds)];
  return unique.map((id) => getRawSlimeModuleSource(id) as number);
}

/** Tint the species artwork into a solid silhouette (shape matches that slime). */
export function getSlimeSilhouetteImageStyle(): ImageStyle {
  return {
    tintColor: mainScreens.slimepedia.undiscovered,
  };
}
