/**
 * Master spawn tables — per-zone species spawn weights.
 * Use ZONES.*.id and SPECIES.*.id so changes to registries flow through.
 * Seeded into zone_spawn_weights; spawn logic uses getZoneSpawnWeights(zoneId) from DB.
 */

import type { ZoneSpawnWeight } from '@/src/types';
import { SPECIES } from './species';
import { ZONES } from './zones';

const weight = (zoneId: ZoneSpawnWeight['zoneId'], speciesId: string, w: number): ZoneSpawnWeight => ({
  zoneId,
  speciesId,
  weight: w,
});

export const SPAWN_TABLES_MASTER: ZoneSpawnWeight[] = [
  // Cozy Bedroom
  weight(ZONES.COZY_BEDROOM.id, SPECIES.GREEN_SLIME.id, 1),
  weight(ZONES.COZY_BEDROOM.id, SPECIES.PINK_SLIME.id, 1),
  weight(ZONES.COZY_BEDROOM.id, SPECIES.BLUE_SLIME.id, 1),
  // Forest Cabin
  weight(ZONES.FOREST_CABIN.id, SPECIES.GREEN_SLIME.id, 1),
  weight(ZONES.FOREST_CABIN.id, SPECIES.PINK_SLIME.id, 1),
  weight(ZONES.FOREST_CABIN.id, SPECIES.BLUE_SLIME.id, 1),
  // Urban Apartment
  weight(ZONES.URBAN_APARTMENT.id, SPECIES.GREEN_SLIME.id, 1),
  weight(ZONES.URBAN_APARTMENT.id, SPECIES.PINK_SLIME.id, 1),
  weight(ZONES.URBAN_APARTMENT.id, SPECIES.BLUE_SLIME.id, 1),
  // Luxury Hotel
  weight(ZONES.LUXURY_HOTEL.id, SPECIES.GREEN_SLIME.id, 1),
  weight(ZONES.LUXURY_HOTEL.id, SPECIES.PINK_SLIME.id, 1),
  weight(ZONES.LUXURY_HOTEL.id, SPECIES.BLUE_SLIME.id, 1),
];
