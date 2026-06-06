/**
 * Species registry — single source of truth for slime species.
 * Reference by key (e.g. SPECIES.GRASS_SLIME.id) in fusion rules and spawn tables.
 * Seeded into SQLite on app init; runtime reads go through DB.
 */

import type { Species } from '@/src/types';
import { Tier, SetId } from '@/src/constants/game';

export const SPECIES = {
  // ── Grassy Meadow ──────────────────────────────────────────────────────────
  // Common (spawn)
  GRASS_SLIME: { id: 'grass_slime', name: 'Grass Slime', setId: SetId.NATURE, tier: Tier.COMMON, fusionOnly: false },
  NIMBUS: { id: 'nimbus_slime', name: 'Nimbus Slime', setId: SetId.NATURE, tier: Tier.COMMON, fusionOnly: false },
  FLOWER_SLIME: { id: 'flower_slime', name: 'Flower Slime', setId: SetId.NATURE, tier: Tier.COMMON, fusionOnly: false },
  SUN_SLIME: { id: 'sun_slime', name: 'Sun Slime', setId: SetId.NATURE, tier: Tier.COMMON, fusionOnly: false },
  // Uncommon (spawn)
  BERRY_SLIME: { id: 'berry_slime', name: 'Berry Slime', setId: SetId.NATURE, tier: Tier.UNCOMMON, fusionOnly: false },
  BEE_SLIME: { id: 'bee_slime', name: 'Bee Slime', setId: SetId.CREATURE, tier: Tier.UNCOMMON, fusionOnly: false },
  // Uncommon (fusion)
  POLLEN_SLIME: { id: 'pollen_slime', name: 'Pollen Slime', setId: SetId.NATURE, tier: Tier.UNCOMMON, fusionOnly: true },
  WIND_SLIME: { id: 'wind_slime', name: 'Wind Slime', setId: SetId.NATURE, tier: Tier.UNCOMMON, fusionOnly: true },
  SUNFLOWER_SLIME: { id: 'sunflower_slime', name: 'Sunflower Slime', setId: SetId.NATURE, tier: Tier.UNCOMMON, fusionOnly: true },
  // Rare (spawn)
  MOON_SLIME: { id: 'moon_slime', name: 'Moon Slime', setId: SetId.NIGHT, tier: Tier.RARE, fusionOnly: false },
  BUTTERFLY_SLIME: { id: 'butterfly_slime', name: 'Butterfly Slime', setId: SetId.CREATURE, tier: Tier.RARE, fusionOnly: false },
  // Rare (fusion)
  SAMARA_SLIME: { id: 'samara_slime', name: 'Samara Slime', setId: SetId.NATURE, tier: Tier.RARE, fusionOnly: true },
  PHOSPHOR_SLIME: { id: 'phosphor_slime', name: 'Phosphor Slime', setId: SetId.NIGHT, tier: Tier.RARE, fusionOnly: true },
  BAT_SLIME: { id: 'bat_slime', name: 'Bat Slime', setId: SetId.NIGHT, tier: Tier.RARE, fusionOnly: true },
  // Ultra Rare (spawn)
  RAINBOW_SLIME: { id: 'rainbow_slime', name: 'Rainbow Slime', setId: SetId.WHIMSY, tier: Tier.ULTRA_RARE, fusionOnly: false },
  AURORA_SLIME: { id: 'aurora_slime', name: 'Aurora Slime', setId: SetId.COSMIC, tier: Tier.ULTRA_RARE, fusionOnly: false },
  // Ultra Rare (fusion)
  FIREFLY_SLIME: { id: 'firefly_slime', name: 'Firefly Slime', setId: SetId.NIGHT, tier: Tier.ULTRA_RARE, fusionOnly: true },

  // ── The Sea ────────────────────────────────────────────────────────────────
  // Common (spawn)
  FINNED_SLIME: { id: 'finned_slime', name: 'Finned Slime', setId: SetId.OCEAN, tier: Tier.COMMON, fusionOnly: false },
  CORAL_SLIME: { id: 'coral_slime', name: 'Coral Slime', setId: SetId.OCEAN, tier: Tier.COMMON, fusionOnly: false },
  KELP_SLIME: { id: 'kelp_slime', name: 'Kelp Slime', setId: SetId.OCEAN, tier: Tier.COMMON, fusionOnly: false },
  SAND_SLIME: { id: 'sand_slime', name: 'Sand Slime', setId: SetId.OCEAN, tier: Tier.COMMON, fusionOnly: false },
  // Uncommon (spawn)
  SKELETON_SLIME: { id: 'skeleton_slime', name: 'Skeleton Slime', setId: SetId.CREATURE, tier: Tier.UNCOMMON, fusionOnly: false },
  BARNACLE_SLIME: { id: 'barnacle_slime', name: 'Barnacle Slime', setId: SetId.OCEAN, tier: Tier.UNCOMMON, fusionOnly: false },
  // Uncommon (fusion)
  REEF_SLIME: { id: 'reef_slime', name: 'Reef Slime', setId: SetId.OCEAN, tier: Tier.UNCOMMON, fusionOnly: true },
  SANDCASTLE_SLIME: { id: 'sandcastle_slime', name: 'Sandcastle Slime', setId: SetId.ROYAL, tier: Tier.UNCOMMON, fusionOnly: true },
  // Rare (spawn)
  SHARK_SLIME: { id: 'shark_slime', name: 'Shark Slime', setId: SetId.CREATURE, tier: Tier.RARE, fusionOnly: false },
  URCHIN_SLIME: { id: 'urchin_slime', name: 'Urchin Slime', setId: SetId.OCEAN, tier: Tier.RARE, fusionOnly: false },
  // Rare (fusion)
  CATFISH_SLIME: { id: 'catfish_slime', name: 'Catfish Slime', setId: SetId.CREATURE, tier: Tier.RARE, fusionOnly: true },
  BIOLUMINESCENT_SLIME: { id: 'bioluminescent_slime', name: 'Bioluminescent Slime', setId: SetId.OCEAN, tier: Tier.RARE, fusionOnly: true },
  CLOWNFISH_SLIME: { id: 'clownfish_slime', name: 'Clownfish Slime', setId: SetId.CREATURE, tier: Tier.RARE, fusionOnly: true },
  // Ultra Rare (spawn)
  ABYSSAL_SLIME: { id: 'abyssal_slime', name: 'Abyssal Slime', setId: SetId.OCEAN, tier: Tier.ULTRA_RARE, fusionOnly: false },
  PIRATE_SLIME: { id: 'pirate_slime', name: 'Pirate Slime', setId: SetId.WHIMSY, tier: Tier.ULTRA_RARE, fusionOnly: false },
  // Ultra Rare (fusion)
  BONE_SHARK_SLIME: { id: 'bone_shark_slime', name: 'Bone Shark Slime', setId: SetId.CREATURE, tier: Tier.ULTRA_RARE, fusionOnly: true },
  ANGLER_SLIME: { id: 'angler_slime', name: 'Angler Slime', setId: SetId.OCEAN, tier: Tier.ULTRA_RARE, fusionOnly: true },
  PEARLESCENT_SLIME: { id: 'pearlescent_slime', name: 'Pearlescent Slime', setId: SetId.OCEAN, tier: Tier.ULTRA_RARE, fusionOnly: true },

  // ── Forest Ruins ───────────────────────────────────────────────────────────
  // Common (spawn)
  FIRE_SLIME: { id: 'fire_slime', name: 'Fire Slime', setId: SetId.ELEMENTAL, tier: Tier.COMMON, fusionOnly: false },
  CLAY_SLIME: { id: 'clay_slime', name: 'Clay Slime', setId: SetId.ELEMENTAL, tier: Tier.COMMON, fusionOnly: false },
  ROYAL_SLIME: { id: 'royal_slime', name: 'Royal Slime', setId: SetId.ROYAL, tier: Tier.COMMON, fusionOnly: false },
  // Uncommon (spawn)
  SPIRIT_SLIME: { id: 'spirit_slime', name: 'Spirit Slime', setId: SetId.SPIRIT, tier: Tier.UNCOMMON, fusionOnly: false },
  BEAR_SLIME: { id: 'bear_slime', name: 'Bear Slime', setId: SetId.CREATURE, tier: Tier.UNCOMMON, fusionOnly: false },
  CRYSTAL_SLIME: { id: 'crystal_slime', name: 'Crystal Slime', setId: SetId.ELEMENTAL, tier: Tier.UNCOMMON, fusionOnly: false },
  // Uncommon (fusion)
  PRISM_SLIME: { id: 'prism_slime', name: 'Prism Slime', setId: SetId.ELEMENTAL, tier: Tier.UNCOMMON, fusionOnly: true },
  POT_SLIME: { id: 'pot_slime', name: 'Pot Slime', setId: SetId.SPIRIT, tier: Tier.UNCOMMON, fusionOnly: true },
  // Rare (spawn)
  ASTRAL_SLIME: { id: 'astral_slime', name: 'Astral Slime', setId: SetId.COSMIC, tier: Tier.RARE, fusionOnly: false },
  HUNTER_SLIME: { id: 'hunter_slime', name: 'Hunter Slime', setId: SetId.CREATURE, tier: Tier.RARE, fusionOnly: false },
  // Rare (fusion)
  GUARDIAN_SLIME: { id: 'guardian_slime', name: 'Guardian Slime', setId: SetId.ROYAL, tier: Tier.RARE, fusionOnly: true },
  GOLEM_SLIME: { id: 'golem_slime', name: 'Golem Slime', setId: SetId.ELEMENTAL, tier: Tier.RARE, fusionOnly: true },
  RUNIC_SLIME: { id: 'runic_slime', name: 'Runic Slime', setId: SetId.ELEMENTAL, tier: Tier.RARE, fusionOnly: true },
  PLANET_SLIME: { id: 'planet_slime', name: 'Planet Slime', setId: SetId.COSMIC, tier: Tier.RARE, fusionOnly: true },
  // Ultra Rare (spawn)
  ECLIPSE_SLIME: { id: 'eclipse_slime', name: 'Eclipse Slime', setId: SetId.SPIRIT, tier: Tier.ULTRA_RARE, fusionOnly: false },
  DRAKE_SLIME: { id: 'drake_slime', name: 'Drake Slime', setId: SetId.CREATURE, tier: Tier.ULTRA_RARE, fusionOnly: false },
  // Ultra Rare (fusion)
  ANGEL_SLIME: { id: 'angel_slime', name: 'Angel Slime', setId: SetId.SPIRIT, tier: Tier.ULTRA_RARE, fusionOnly: true },
  ANCIENT_SLIME: { id: 'ancient_slime', name: 'Ancient Slime', setId: SetId.SPIRIT, tier: Tier.ULTRA_RARE, fusionOnly: true },
  BLACK_HOLE_SLIME: { id: 'black_hole_slime', name: 'Black Hole Slime', setId: SetId.COSMIC, tier: Tier.ULTRA_RARE, fusionOnly: true },

  // ── Slime City ─────────────────────────────────────────────────────────────
  // Common (spawn)
  CAT_SLIME: { id: 'cat_slime', name: 'Cat Slime', setId: SetId.CREATURE, tier: Tier.COMMON, fusionOnly: false },
  POWER_SLIME: { id: 'power_slime', name: 'Power Slime', setId: SetId.TECH, tier: Tier.COMMON, fusionOnly: false },
  METAL_SLIME: { id: 'metal_slime', name: 'Metal Slime', setId: SetId.TECH, tier: Tier.COMMON, fusionOnly: false },
  // Uncommon (spawn)
  SLEEPY_SLIME: { id: 'sleepy_slime', name: 'Sleepy Slime', setId: SetId.NIGHT, tier: Tier.UNCOMMON, fusionOnly: false },
  NEON_SLIME: { id: 'neon_slime', name: 'Neon Slime', setId: SetId.TECH, tier: Tier.UNCOMMON, fusionOnly: false },
  PLUSH_SLIME: { id: 'plush_slime', name: 'Plush Slime', setId: SetId.WHIMSY, tier: Tier.UNCOMMON, fusionOnly: false },
  // Uncommon (fusion)
  BATTERY_SLIME: { id: 'battery_slime', name: 'Battery Slime', setId: SetId.TECH, tier: Tier.UNCOMMON, fusionOnly: true },
  TV_SLIME: { id: 'tv_slime', name: 'TV Slime', setId: SetId.TECH, tier: Tier.UNCOMMON, fusionOnly: true },
  // Rare (spawn)
  GLITCH_SLIME: { id: 'glitch_slime', name: 'Glitch Slime', setId: SetId.TECH, tier: Tier.RARE, fusionOnly: false },
  CANDY_SLIME: { id: 'candy_slime', name: 'Candy Slime', setId: SetId.WHIMSY, tier: Tier.RARE, fusionOnly: false },
  // Rare (fusion)
  DRONE_SLIME: { id: 'drone_slime', name: 'Drone Slime', setId: SetId.TECH, tier: Tier.RARE, fusionOnly: true },
  NYAN_SLIME: { id: 'nyan_slime', name: 'Nyan Slime', setId: SetId.WHIMSY, tier: Tier.RARE, fusionOnly: true },
  ROBO_SLIME: { id: 'robo_slime', name: 'Ro-bo Slime', setId: SetId.TECH, tier: Tier.RARE, fusionOnly: true },
  // Ultra Rare (spawn)
  MATRIX_SLIME: { id: 'matrix_slime', name: 'Matrix Slime', setId: SetId.TECH, tier: Tier.ULTRA_RARE, fusionOnly: false },
  MAYOR_SLIME: { id: 'mayor_slime', name: 'Mayor Slime', setId: SetId.ROYAL, tier: Tier.ULTRA_RARE, fusionOnly: false },
  // Ultra Rare (fusion)
  JETPACK_SLIME: { id: 'jetpack_slime', name: 'Jetpack Slime', setId: SetId.TECH, tier: Tier.ULTRA_RARE, fusionOnly: true },
  HOLOGRAM_SLIME: { id: 'hologram_slime', name: 'Hologram Slime', setId: SetId.TECH, tier: Tier.ULTRA_RARE, fusionOnly: true },

  // ── Exclusive cross-zone fusions ───────────────────────────────────────────
  HONEY_SLIME: { id: 'honey_slime', name: 'Honey Slime', setId: SetId.WHIMSY, tier: Tier.RARE, fusionOnly: true },
  TEMPEST_SLIME: { id: 'tempest_slime', name: 'Tempest Slime', setId: SetId.NATURE, tier: Tier.RARE, fusionOnly: true },
  OPAL_SLIME: { id: 'opal_slime', name: 'Opal Slime', setId: SetId.ELEMENTAL, tier: Tier.RARE, fusionOnly: true },
  TEDDY_SLIME: { id: 'teddy_slime', name: 'Teddy Slime', setId: SetId.WHIMSY, tier: Tier.RARE, fusionOnly: true },
  SLIME_SLIME: { id: 'slime_slime', name: 'Slime Slime', setId: SetId.WHIMSY, tier: Tier.RARE, fusionOnly: true },
  HIS_PURNESS_SLIME: { id: 'his_purness_slime', name: 'His Purness Slime', setId: SetId.ROYAL, tier: Tier.RARE, fusionOnly: true },

  // ── Legendary ──────────────────────────────────────────────────────────────
  // 4-parent fusion — recipe TBD (multi-slot fusion not yet implemented)
  DREAMER_SLIME: { id: 'dreamer_slime', name: 'Dreamer Slime', setId: SetId.COSMIC, tier: Tier.LEGENDARY, fusionOnly: true },
} satisfies Record<string, Species>;

export type SpeciesKey = keyof typeof SPECIES;
