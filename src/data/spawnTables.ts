/**
 * Master spawn tables — per-zone species spawn weights.
 * Use ZONES.*.id and SPECIES.*.id so changes to registries flow through.
 * Seeded into zone_spawn_weights; spawn logic uses getSpawnTableEntries(zoneId) from DB.
 */

import type { SpawnTableEntry } from '@/src/types';
import { SPECIES } from './species';
import { ZONES } from './zones';

const w = 1;

export const SPAWN_TABLES_MASTER: SpawnTableEntry[] = [
  // ── Grassy Meadow ──────────────────────────────────────────────────────────
  { zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.GRASS_SLIME.id, weight: w },
  { zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.NIMBUS.id, weight: w },
  { zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.FLOWER_SLIME.id, weight: w },
  { zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.SUN_SLIME.id, weight: w },
  { zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.BERRY_SLIME.id, weight: w },
  { zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.BEE_SLIME.id, weight: w },
  { zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.MOON_SLIME.id, weight: w },
  { zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.BUTTERFLY_SLIME.id, weight: w },
  { zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.RAINBOW_SLIME.id, weight: w },
  { zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.AURORA_SLIME.id, weight: w },

  // ── The Sea ────────────────────────────────────────────────────────────────
  { zoneId: ZONES.THE_SEA.id, speciesId: SPECIES.FINNED_SLIME.id, weight: w },
  { zoneId: ZONES.THE_SEA.id, speciesId: SPECIES.CORAL_SLIME.id, weight: w },
  { zoneId: ZONES.THE_SEA.id, speciesId: SPECIES.KELP_SLIME.id, weight: w },
  { zoneId: ZONES.THE_SEA.id, speciesId: SPECIES.SAND_SLIME.id, weight: w },
  { zoneId: ZONES.THE_SEA.id, speciesId: SPECIES.SKELETON_SLIME.id, weight: w },
  { zoneId: ZONES.THE_SEA.id, speciesId: SPECIES.BARNACLE_SLIME.id, weight: w },
  { zoneId: ZONES.THE_SEA.id, speciesId: SPECIES.SHARK_SLIME.id, weight: w },
  { zoneId: ZONES.THE_SEA.id, speciesId: SPECIES.URCHIN_SLIME.id, weight: w },
  { zoneId: ZONES.THE_SEA.id, speciesId: SPECIES.ABYSSAL_SLIME.id, weight: w },
  { zoneId: ZONES.THE_SEA.id, speciesId: SPECIES.PIRATE_SLIME.id, weight: w },

  // ── Forest Ruins ───────────────────────────────────────────────────────────
  { zoneId: ZONES.FOREST_RUINS.id, speciesId: SPECIES.FIRE_SLIME.id, weight: w },
  { zoneId: ZONES.FOREST_RUINS.id, speciesId: SPECIES.CLAY_SLIME.id, weight: w },
  { zoneId: ZONES.FOREST_RUINS.id, speciesId: SPECIES.ROYAL_SLIME.id, weight: w },
  { zoneId: ZONES.FOREST_RUINS.id, speciesId: SPECIES.SPIRIT_SLIME.id, weight: w },
  { zoneId: ZONES.FOREST_RUINS.id, speciesId: SPECIES.BEAR_SLIME.id, weight: w },
  { zoneId: ZONES.FOREST_RUINS.id, speciesId: SPECIES.CRYSTAL_SLIME.id, weight: w },
  { zoneId: ZONES.FOREST_RUINS.id, speciesId: SPECIES.ASTRAL_SLIME.id, weight: w },
  { zoneId: ZONES.FOREST_RUINS.id, speciesId: SPECIES.HUNTER_SLIME.id, weight: w },
  { zoneId: ZONES.FOREST_RUINS.id, speciesId: SPECIES.ECLIPSE_SLIME.id, weight: w },
  { zoneId: ZONES.FOREST_RUINS.id, speciesId: SPECIES.DRAKE_SLIME.id, weight: w },

  // ── Slime City ─────────────────────────────────────────────────────────────
  { zoneId: ZONES.SLIME_CITY.id, speciesId: SPECIES.CAT_SLIME.id, weight: w },
  { zoneId: ZONES.SLIME_CITY.id, speciesId: SPECIES.POWER_SLIME.id, weight: w },
  { zoneId: ZONES.SLIME_CITY.id, speciesId: SPECIES.METAL_SLIME.id, weight: w },
  { zoneId: ZONES.SLIME_CITY.id, speciesId: SPECIES.SLEEPY_SLIME.id, weight: w },
  { zoneId: ZONES.SLIME_CITY.id, speciesId: SPECIES.NEON_SLIME.id, weight: w },
  { zoneId: ZONES.SLIME_CITY.id, speciesId: SPECIES.PLUSH_SLIME.id, weight: w },
  { zoneId: ZONES.SLIME_CITY.id, speciesId: SPECIES.GLITCH_SLIME.id, weight: w },
  { zoneId: ZONES.SLIME_CITY.id, speciesId: SPECIES.CANDY_SLIME.id, weight: w },
  { zoneId: ZONES.SLIME_CITY.id, speciesId: SPECIES.MATRIX_SLIME.id, weight: w },
  { zoneId: ZONES.SLIME_CITY.id, speciesId: SPECIES.MAYOR_SLIME.id, weight: w },
];
