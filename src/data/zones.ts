/**
 * Zone registry — single source of truth for sleep zones.
 * Reference by key (e.g. ZONES.GRASSY_MEADOW.id) in spawn tables and elsewhere.
 */

import type { Zone } from '@/src/types';

export const ZONES = {
  GRASSY_MEADOW: {
    id: 'grassy_meadow',
    name: 'Grassy Meadow',
    effect: 'Common species, balanced rolls',
    unlockedByDefault: true,
  },
} satisfies Record<string, Zone>;

export type ZoneKey = keyof typeof ZONES;
