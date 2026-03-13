/**
 * Master spawn tables — per-zone species spawn weights.
 * Use ZONES.*.id and SPECIES.*.id so changes to registries flow through.
 * Seeded into zone_spawn_weights; spawn logic uses getSpawnTableEntries(zoneId) from DB.
 */

import type { SpawnTableEntry } from '@/src/types';
import { SPECIES } from './species';
import { ZONES } from './zones';


export const SPAWN_TABLES_MASTER: SpawnTableEntry[] = [
  // Cozy Bedroom
  {zoneId: ZONES.COZY_BEDROOM.id, speciesId: SPECIES.GREEN_SLIME.id, weight: 1},
  {zoneId: ZONES.COZY_BEDROOM.id, speciesId: SPECIES.PINK_SLIME.id, weight: 1 },
  {zoneId: ZONES.COZY_BEDROOM.id, speciesId: SPECIES.BLUE_SLIME.id, weight: 1 },
  // Forest Cabin
  {zoneId: ZONES.FOREST_CABIN.id, speciesId: SPECIES.GREEN_SLIME.id, weight: 1 },
  {zoneId: ZONES.FOREST_CABIN.id, speciesId: SPECIES.PINK_SLIME.id, weight: 1 },
  {zoneId: ZONES.FOREST_CABIN.id, speciesId: SPECIES.BLUE_SLIME.id, weight: 1 },
  // Urban Apartment
  {zoneId: ZONES.URBAN_APARTMENT.id, speciesId: SPECIES.GREEN_SLIME.id, weight: 1 },
  {zoneId: ZONES.URBAN_APARTMENT.id, speciesId: SPECIES.PINK_SLIME.id, weight: 1 },
  {zoneId: ZONES.URBAN_APARTMENT.id, speciesId: SPECIES.BLUE_SLIME.id, weight: 1 },
  // Luxury Hotel
  {zoneId: ZONES.LUXURY_HOTEL.id, speciesId: SPECIES.GREEN_SLIME.id, weight: 1 },
  {zoneId: ZONES.LUXURY_HOTEL.id, speciesId: SPECIES.PINK_SLIME.id, weight: 1 },
  {zoneId: ZONES.LUXURY_HOTEL.id, speciesId: SPECIES.BLUE_SLIME.id, weight: 1 }
];
