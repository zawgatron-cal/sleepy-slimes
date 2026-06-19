/**
 * Master fusion rules — (parentA + parentB) → result, with candy cost.
 * All deterministic (one outcome per parent pair). Lookup supports either parent order via getFusionResultsForParents.
 */

import type { FusionRule } from '@/src/types';
import { SPECIES } from './species';
import { COSTS } from '@/src/constants/game';

const U = COSTS.FUSE_UNCOMMON;
const R = COSTS.FUSE_RARE;
const UR = COSTS.FUSE_ULTRA_RARE;

export const FUSION_RULES_MASTER: FusionRule[] = [
  // ── Grassy Meadow ──────────────────────────────────────────────────────────
  { parentSpeciesA: SPECIES.BEE_SLIME.id, parentSpeciesB: SPECIES.FLOWER_SLIME.id, resultSpeciesId: SPECIES.POLLEN_SLIME.id, candyCost: U, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.NIMBUS.id, parentSpeciesB: SPECIES.GRASS_SLIME.id, resultSpeciesId: SPECIES.WIND_SLIME.id, candyCost: U, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.SUN_SLIME.id, parentSpeciesB: SPECIES.FLOWER_SLIME.id, resultSpeciesId: SPECIES.SUNFLOWER_SLIME.id, candyCost: U, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.GRASS_SLIME.id, parentSpeciesB: SPECIES.WIND_SLIME.id, resultSpeciesId: SPECIES.SAMARA_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.POLLEN_SLIME.id, parentSpeciesB: SPECIES.MOON_SLIME.id, resultSpeciesId: SPECIES.PHOSPHOR_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.MOON_SLIME.id, parentSpeciesB: SPECIES.BERRY_SLIME.id, resultSpeciesId: SPECIES.BAT_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.BUTTERFLY_SLIME.id, parentSpeciesB: SPECIES.PHOSPHOR_SLIME.id, resultSpeciesId: SPECIES.FIREFLY_SLIME.id, candyCost: UR, deterministic: true, weight: null },

  // ── The Sea ────────────────────────────────────────────────────────────────
  { parentSpeciesA: SPECIES.CORAL_SLIME.id, parentSpeciesB: SPECIES.KELP_SLIME.id, resultSpeciesId: SPECIES.REEF_SLIME.id, candyCost: U, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.SAND_SLIME.id, parentSpeciesB: SPECIES.ROYAL_SLIME.id, resultSpeciesId: SPECIES.SANDCASTLE_SLIME.id, candyCost: U, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.CAT_SLIME.id, parentSpeciesB: SPECIES.FINNED_SLIME.id, resultSpeciesId: SPECIES.CATFISH_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.PHOSPHOR_SLIME.id, parentSpeciesB: SPECIES.BARNACLE_SLIME.id, resultSpeciesId: SPECIES.BIOLUMINESCENT_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.REEF_SLIME.id, parentSpeciesB: SPECIES.FINNED_SLIME.id, resultSpeciesId: SPECIES.CLOWNFISH_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.SHARK_SLIME.id, parentSpeciesB: SPECIES.SKELETON_SLIME.id, resultSpeciesId: SPECIES.BONE_SHARK_SLIME.id, candyCost: UR, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.BIOLUMINESCENT_SLIME.id, parentSpeciesB: SPECIES.SHARK_SLIME.id, resultSpeciesId: SPECIES.ANGLER_SLIME.id, candyCost: UR, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.URCHIN_SLIME.id, parentSpeciesB: SPECIES.BIOLUMINESCENT_SLIME.id, resultSpeciesId: SPECIES.PEARLESCENT_SLIME.id, candyCost: UR, deterministic: true, weight: null },

  // ── Forest Ruins ───────────────────────────────────────────────────────────
  { parentSpeciesA: SPECIES.SAND_SLIME.id, parentSpeciesB: SPECIES.FIRE_SLIME.id, resultSpeciesId: SPECIES.PRISM_SLIME.id, candyCost: U, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.CLAY_SLIME.id, parentSpeciesB: SPECIES.FIRE_SLIME.id, resultSpeciesId: SPECIES.POT_SLIME.id, candyCost: U, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.SPIRIT_SLIME.id, parentSpeciesB: SPECIES.ROYAL_SLIME.id, resultSpeciesId: SPECIES.GUARDIAN_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.SPIRIT_SLIME.id, parentSpeciesB: SPECIES.CLAY_SLIME.id, resultSpeciesId: SPECIES.GOLEM_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.CRYSTAL_SLIME.id, parentSpeciesB: SPECIES.CLAY_SLIME.id, resultSpeciesId: SPECIES.RUNIC_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.PRISM_SLIME.id, parentSpeciesB: SPECIES.ASTRAL_SLIME.id, resultSpeciesId: SPECIES.PLANET_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.GUARDIAN_SLIME.id, parentSpeciesB: SPECIES.ASTRAL_SLIME.id, resultSpeciesId: SPECIES.ANGEL_SLIME.id, candyCost: UR, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.GOLEM_SLIME.id, parentSpeciesB: SPECIES.RUNIC_SLIME.id, resultSpeciesId: SPECIES.ANCIENT_SLIME.id, candyCost: UR, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.PLANET_SLIME.id, parentSpeciesB: SPECIES.MOON_SLIME.id, resultSpeciesId: SPECIES.BLACK_HOLE_SLIME.id, candyCost: UR, deterministic: true, weight: null },

  // ── Slime City ─────────────────────────────────────────────────────────────
  { parentSpeciesA: SPECIES.POWER_SLIME.id, parentSpeciesB: SPECIES.METAL_SLIME.id, resultSpeciesId: SPECIES.BATTERY_SLIME.id, candyCost: U, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.NEON_SLIME.id, parentSpeciesB: SPECIES.METAL_SLIME.id, resultSpeciesId: SPECIES.TV_SLIME.id, candyCost: U, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.BATTERY_SLIME.id, parentSpeciesB: SPECIES.BEE_SLIME.id, resultSpeciesId: SPECIES.DRONE_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.NEON_SLIME.id, parentSpeciesB: SPECIES.CAT_SLIME.id, resultSpeciesId: SPECIES.NYAN_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.GOLEM_SLIME.id, parentSpeciesB: SPECIES.BATTERY_SLIME.id, resultSpeciesId: SPECIES.ROBO_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.DRONE_SLIME.id, parentSpeciesB: SPECIES.ROBO_SLIME.id, resultSpeciesId: SPECIES.JETPACK_SLIME.id, candyCost: UR, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.GLITCH_SLIME.id, parentSpeciesB: SPECIES.NYAN_SLIME.id, resultSpeciesId: SPECIES.HOLOGRAM_SLIME.id, candyCost: UR, deterministic: true, weight: null },

  // ── Exclusive cross-zone fusions ───────────────────────────────────────────
  { parentSpeciesA: SPECIES.BEE_SLIME.id, parentSpeciesB: SPECIES.CANDY_SLIME.id, resultSpeciesId: SPECIES.HONEY_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.NIMBUS.id, parentSpeciesB: SPECIES.SHARK_SLIME.id, resultSpeciesId: SPECIES.TEMPEST_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.MOON_SLIME.id, parentSpeciesB: SPECIES.CRYSTAL_SLIME.id, resultSpeciesId: SPECIES.OPAL_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.BEAR_SLIME.id, parentSpeciesB: SPECIES.PLUSH_SLIME.id, resultSpeciesId: SPECIES.TEDDY_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.KELP_SLIME.id, parentSpeciesB: SPECIES.METAL_SLIME.id, resultSpeciesId: SPECIES.SLIME_SLIME.id, candyCost: R, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.CAT_SLIME.id, parentSpeciesB: SPECIES.ROYAL_SLIME.id, resultSpeciesId: SPECIES.HIS_PURNESS_SLIME.id, candyCost: R, deterministic: true, weight: null },

  // Dreamer Slime (4-parent legendary) — multi-slot fusion not yet implemented
];
