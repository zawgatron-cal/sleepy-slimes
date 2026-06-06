/**
 * Zone registry — single source of truth for sleep zones.
 * Reference by key (e.g. ZONES.GRASSY_MEADOW.id) in spawn tables and elsewhere.
 */

import type { Zone } from '@/src/types';

export const ZONES = {
  GRASSY_MEADOW: {
    id: 'grassy_meadow',
    name: 'Grassy Meadow',
    blurb: 'Quiet, untouched meadows, home to many nature species',
    unlockedByDefault: true,
  },
  THE_SEA: {
    id: 'the_sea',
    name: 'The Sea',
    blurb: 'A vast ocean, where rare and odd slimes hide in deepest depths',
    unlockedByDefault: false,
  },
  FOREST_RUINS: {
    id: 'forest_ruins',
    name: 'Forest Ruins',
    blurb: 'Worn ruins of a time long past, now a sanctuary to slimes of many eras',
    unlockedByDefault: false,
  },
  SLIME_CITY: {
    id: 'slime_city',
    name: 'Slime City',
    blurb: 'A bustling city where slimes have become a global icon',
    unlockedByDefault: false,
  },
} satisfies Record<string, Zone>;

export type ZoneKey = keyof typeof ZONES;

/** Canonical UI order — matches declaration order in `ZONES` (Grassy Meadow first). */
export const ZONE_IDS_IN_ORDER: readonly string[] = Object.values(ZONES).map((z) => z.id);

/** Sort zones for display (zone picker, dev tools, etc.). Unknown ids sort last. */
export function sortZonesForDisplay<T extends { id: string }>(zones: T[]): T[] {
  const rank = new Map(ZONE_IDS_IN_ORDER.map((id, index) => [id, index]));
  return [...zones].sort(
    (a, b) =>
      (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER)
  );
}
