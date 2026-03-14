/**
 * Master spawn tables — per-zone species spawn weights.
 * Use ZONES.*.id and SPECIES.*.id so changes to registries flow through.
 * Seeded into zone_spawn_weights; spawn logic uses getSpawnTableEntries(zoneId) from DB.
 */

import type { SpawnTableEntry } from '@/src/types';
import { SPECIES } from './species';
import { ZONES } from './zones';


export const SPAWN_TABLES_MASTER: SpawnTableEntry[] = [
  // Grassy Meadow
  {zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.SLIME.id, weight: 1},
  {zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.GRASS_SLIME.id, weight: 1},
  {zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.CLOUD_SLIME.id, weight: 1},
  {zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.RAIN_SLIME.id, weight: 1},
  {zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.FLOWER_SLIME.id, weight: 1},
  {zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.DEW_SLIME.id, weight: 1},
  {zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.PUDDLE_SLIME.id, weight: 1},
  {zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.BERRY_SLIME.id, weight: 1},
  {zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.SUNFLOWER_SLIME.id, weight: 1},
  {zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.BEE_SLIME.id, weight: 1},
  {zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.MOON_SLIME.id, weight: 1},
  {zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.BUTTERFLY_SLIME.id, weight: 1},
  {zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.RAINBOW_SLIME.id, weight: 1},
  {zoneId: ZONES.GRASSY_MEADOW.id, speciesId: SPECIES.AURORA_SLIME.id, weight: 1},
];
