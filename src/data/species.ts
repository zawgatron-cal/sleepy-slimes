/**
 * Species registry — single source of truth for slime species.
 * Reference by key (e.g. SPECIES.GREEN_SLIME.id) in fusion rules and spawn tables.
 * Seeded into SQLite on app init; runtime reads go through DB.
 */

import type { Species } from '@/src/types';
import { Tier, SetId } from '@/src/constants/game';

export const SPECIES = {
  // GRASSY MEADOW SLIMES
  // --- Common (spawn) ---
  SLIME: { id: 'slime', name: 'Slime', setId: SetId.NATURE, tier: Tier.COMMON, fusionOnly: false },
  GRASS_SLIME: { id: 'grass_slime', name: 'Grass Slime', setId: SetId.NATURE, tier: Tier.COMMON, fusionOnly: false },
  CLOUD_SLIME: { id: 'cloud_slime', name: 'Cloud Slime', setId: SetId.NATURE, tier: Tier.COMMON, fusionOnly: false },
  RAIN_SLIME: { id: 'rain_slime', name: 'Rain Slime', setId: SetId.NATURE, tier: Tier.COMMON, fusionOnly: false },
  FLOWER_SLIME: { id: 'flower_slime', name: 'Flower Slime', setId: SetId.NATURE, tier: Tier.COMMON, fusionOnly: false },
  DEW_SLIME: { id: 'dew_slime', name: 'Dew Slime', setId: SetId.NATURE, tier: Tier.COMMON, fusionOnly: false },
  // --- Uncommon (spawn) ---
  PUDDLE_SLIME: { id: 'puddle_slime', name: 'Puddle Slime', setId: SetId.NATURE, tier: Tier.UNCOMMON, fusionOnly: false },
  BERRY_SLIME: { id: 'berry_slime', name: 'Berry Slime', setId: SetId.NATURE, tier: Tier.UNCOMMON, fusionOnly: false },
  SUNFLOWER_SLIME: { id: 'sunflower_slime', name: 'Sunflower Slime', setId: SetId.NATURE, tier: Tier.UNCOMMON, fusionOnly: false },
  BEE_SLIME: { id: 'bee_slime', name: 'Bee Slime', setId: SetId.NATURE, tier: Tier.UNCOMMON, fusionOnly: false },
  // --- Uncommon (fusion) ---
  POLLEN_SLIME: { id: 'pollen_slime', name: 'Pollen Slime', setId: SetId.NATURE, tier: Tier.UNCOMMON, fusionOnly: true },
  WIND_SLIME: { id: 'wind_slime', name: 'Wind Slime', setId: SetId.NATURE, tier: Tier.UNCOMMON, fusionOnly: true },
  LOVE_SLIME: { id: 'love_slime', name: 'Love Slime', setId: SetId.NATURE, tier: Tier.UNCOMMON, fusionOnly: true },
  // --- Rare (spawn) ---
  MOON_SLIME: { id: 'moon_slime', name: 'Moon Slime', setId: SetId.NATURE, tier: Tier.RARE, fusionOnly: false },
  BUTTERFLY_SLIME: { id: 'butterfly_slime', name: 'Butterfly Slime', setId: SetId.NATURE, tier: Tier.RARE, fusionOnly: false },
  // --- Rare (fusion) ---
  SLEEPING_SLIME: { id: 'sleeping_slime', name: 'Sleeping Slime', setId: SetId.NATURE, tier: Tier.RARE, fusionOnly: true },
  DAWN_SLIME: { id: 'dawn_slime', name: 'Dawn Slime', setId: SetId.NATURE, tier: Tier.RARE, fusionOnly: true },
  SAMARA_SLIME: { id: 'samara_slime', name: 'Samara Slime', setId: SetId.NATURE, tier: Tier.RARE, fusionOnly: true },
  PHOSPHOR_SLIME: { id: 'phosphor_slime', name: 'Phosphor Slime', setId: SetId.NATURE, tier: Tier.RARE, fusionOnly: true },
  // --- Ultra Rare (spawn) ---
  RAINBOW_SLIME: { id: 'rainbow_slime', name: 'Rainbow Slime', setId: SetId.NATURE, tier: Tier.ULTRA_RARE, fusionOnly: false },
  AURORA_SLIME: { id: 'aurora_slime', name: 'Aurora Slime', setId: SetId.NATURE, tier: Tier.ULTRA_RARE, fusionOnly: false },
  // --- Ultra Rare (fusion) ---
  CUPID_SLIME: { id: 'cupid_slime', name: 'Cupid Slime', setId: SetId.NATURE, tier: Tier.ULTRA_RARE, fusionOnly: true },
  FIREFLY_SLIME: { id: 'firefly_slime', name: 'Firefly Slime', setId: SetId.NATURE, tier: Tier.ULTRA_RARE, fusionOnly: true },
} satisfies Record<string, Species>;

export type SpeciesKey = keyof typeof SPECIES;

