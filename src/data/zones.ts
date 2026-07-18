/**
 * Zone registry — single source of truth for sleep zones.
 * Reference by key (e.g. ZONES.GRASSY_MEADOW.id) in spawn tables and elsewhere.
 */

import type { Zone } from '@/src/types';

export const ZONES = {
  GRASSY_MEADOW: {
    id: 'grassy_meadow',
    name: 'Buttercup Meadows',
    blurb: 'Quiet, untouched meadows, home to many nature species',
    unlockedByDefault: true,
  },
  THE_SEA: {
    id: 'the_sea',
    name: 'The Sea',
    blurb: 'A vast ocean, where rare and strange slimes hide in the depths',
    unlockedByDefault: false,
  },
  FOREST_RUINS: {
    id: 'forest_ruins',
    name: 'The Mossy Keep',
    blurb: 'Worn ruins of a time long past, now a sanctuary to slimes from many eras',
    unlockedByDefault: false,
  },
  SLIME_CITY: {
    id: 'slime_city',
    name: 'Slimeburg',
    blurb: 'A bustling city where slimes have become an icon and a global sensation',
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
