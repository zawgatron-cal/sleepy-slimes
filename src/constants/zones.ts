/**
 * Sleep zone definitions (PRD).
 * Zones affect which slimes spawn. First zone unlocked by default.
 */

import type { ZoneId } from '@/src/types';

export const ZONES: { id: ZoneId; name: string; effect: string; unlocked: boolean }[] = [
  { id: 'cozy_bedroom', name: 'Cozy Bedroom', effect: 'Common species, balanced rolls', unlocked: true },
  { id: 'forest_cabin', name: 'Forest Cabin', effect: 'Nature set boost', unlocked: false },
  { id: 'urban_apartment', name: 'Urban Apartment', effect: 'Tech set boost', unlocked: false },
  { id: 'luxury_hotel', name: 'Luxury Hotel', effect: '+Cosmetic rarity roll chance', unlocked: false },
];
