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
  GRASS_SLIME: { id: 'grass_slime', name: 'Grass Slime', setId: SetId.NATURE, tier: Tier.COMMON, fusionOnly: false },
  NIMBUS: { id: 'nimbus_slime', name: 'Nimbus Slime', setId: SetId.NATURE, tier: Tier.COMMON, fusionOnly: false },
  FLOWER_SLIME: { id: 'flower_slime', name: 'Flower Slime', setId: SetId.NATURE, tier: Tier.COMMON, fusionOnly: false },
  SUN_SLIME: { id: 'sun_slime', name: 'Sun Slime', setId: SetId.NATURE, tier: Tier.COMMON, fusionOnly: false },
  // --- Uncommon (spawn) ---
  BERRY_SLIME: { id: 'berry_slime', name: 'Berry Slime', setId: SetId.NATURE, tier: Tier.UNCOMMON, fusionOnly: false },
  BEE_SLIME: { id: 'bee_slime', name: 'Bee Slime', setId: SetId.NATURE, tier: Tier.UNCOMMON, fusionOnly: false },
  // --- Uncommon (fusion) ---
  SUNFLOWER_SLIME: { id: 'sunflower_slime', name: 'Sunflower Slime', setId: SetId.NATURE, tier: Tier.UNCOMMON, fusionOnly: true },
  POLLEN_SLIME: { id: 'pollen_slime', name: 'Pollen Slime', setId: SetId.NATURE, tier: Tier.UNCOMMON, fusionOnly: true },
  WIND_SLIME: { id: 'wind_slime', name: 'Wind Slime', setId: SetId.NATURE, tier: Tier.UNCOMMON, fusionOnly: true },
  // --- Rare (spawn) ---
  MOON_SLIME: { id: 'moon_slime', name: 'Moon Slime', setId: SetId.NATURE, tier: Tier.RARE, fusionOnly: false },
  BUTTERFLY_SLIME: { id: 'butterfly_slime', name: 'Butterfly Slime', setId: SetId.NATURE, tier: Tier.RARE, fusionOnly: false },
  // --- Rare (fusion) ---
  SAMARA_SLIME: { id: 'samara_slime', name: 'Samara Slime', setId: SetId.NATURE, tier: Tier.RARE, fusionOnly: true },
  PHOSPHOR_SLIME: { id: 'phosphor_slime', name: 'Phosphor Slime', setId: SetId.NATURE, tier: Tier.RARE, fusionOnly: true },
  BAT_SLIME: { id: 'bat_slime', name: 'Bat Slime', setId: SetId.NATURE, tier: Tier.RARE, fusionOnly: true },
  // --- Ultra Rare (spawn) ---
  RAINBOW_SLIME: { id: 'rainbow_slime', name: 'Rainbow Slime', setId: SetId.NATURE, tier: Tier.ULTRA_RARE, fusionOnly: false },
  AURORA_SLIME: { id: 'aurora_slime', name: 'Aurora Slime', setId: SetId.NATURE, tier: Tier.ULTRA_RARE, fusionOnly: false },
  // --- Ultra Rare (fusion) ---
  FIREFLY_SLIME: { id: 'firefly_slime', name: 'Firefly Slime', setId: SetId.NATURE, tier: Tier.ULTRA_RARE, fusionOnly: true },
} satisfies Record<string, Species>;

export type SpeciesKey = keyof typeof SPECIES;

