import type { Species } from '@/src/types';
import { SPAWN_TABLES_MASTER, ZONES, ZONE_IDS_IN_ORDER } from '@/src/data';

export const UNDISCOVERED_COPY = '???';

export type SlimepediaEntry = {
  description?: string;
  /** Flavor text on how to fuse this slime (fusible species only). */
  fusionHint?: string;
};

export function getSlimepediaDescription(entry: SlimepediaEntry | undefined): string {
  const text = entry?.description?.trim();
  return text || 'No description yet.';
}

export function getSlimepediaFusionHint(entry: SlimepediaEntry | undefined): string | null {
  const hint = entry?.fusionHint?.trim();
  return hint || null;
}

const ZONE_NAME_BY_ID = Object.fromEntries(
  Object.values(ZONES).map((z) => [z.id, z.name])
) as Record<string, string>;

const SPAWN_ZONE_IDS_BY_SPECIES = SPAWN_TABLES_MASTER.reduce<Map<string, string[]>>(
  (map, row) => {
    const existing = map.get(row.speciesId);
    if (existing) {
      if (!existing.includes(row.zoneId)) existing.push(row.zoneId);
    } else {
      map.set(row.speciesId, [row.zoneId]);
    }
    return map;
  },
  new Map()
);

/** Sleep zones where this species can spawn (canonical zone order). */
export function getSlimepediaFoundIn(species: Species): string {
  const zoneIds = SPAWN_ZONE_IDS_BY_SPECIES.get(species.id);
  if (!zoneIds?.length) {
    return species.fusionOnly ? 'Fusion only' : 'Unknown';
  }

  const names = ZONE_IDS_IN_ORDER.filter((id) => zoneIds.includes(id)).map(
    (id) => ZONE_NAME_BY_ID[id] ?? id
  );
  return names.join(', ');
}
