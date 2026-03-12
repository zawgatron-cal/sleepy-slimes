/**
 * Zone registry — single source of truth for sleep zones.
 * Reference by key (e.g. ZONES.COZY_BEDROOM.id) in spawn tables and elsewhere.
 */

import type { Zone } from '@/src/types';

export const ZONES = {
  COZY_BEDROOM: {
    id: 'cozy_bedroom',
    name: 'Cozy Bedroom',
    effect: 'Common species, balanced rolls',
    unlockedByDefault: true,
  },
  FOREST_CABIN: {
    id: 'forest_cabin',
    name: 'Forest Cabin',
    effect: 'Nature set boost',
    unlockedByDefault: false,
  },
  URBAN_APARTMENT: {
    id: 'urban_apartment',
    name: 'Urban Apartment',
    effect: 'Tech set boost',
    unlockedByDefault: false,
  },
  LUXURY_HOTEL: {
    id: 'luxury_hotel',
    name: 'Luxury Hotel',
    effect: '+Cosmetic rarity roll chance',
    unlockedByDefault: false,
  },
} satisfies Record<string, Zone>;

export type ZoneKey = keyof typeof ZONES;
