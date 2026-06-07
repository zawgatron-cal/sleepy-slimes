import type { Species } from '@/src/types';
import { SPAWN_TABLES_MASTER, ZONES, ZONE_IDS_IN_ORDER } from '@/src/data';

export const UNDISCOVERED_COPY = '???';

/** Placeholder fusion-hint boxes shown before a species is discovered. */
export const UNDISCOVERED_FUSION_HINT_COUNT = 2;

export type SlimepediaEntry = {
  description?: string;
  fusionHint?: string;
  fusionHints?: string[];
};

export function getSlimepediaDescription(entry: SlimepediaEntry | undefined): string {
  const text = entry?.description?.trim();
  return text || 'No description yet.';
}

export function getSlimepediaFusionHints(entry: SlimepediaEntry | undefined): string[] {
  if (entry?.fusionHints?.length) {
    return entry.fusionHints.map((h) => h.trim()).filter(Boolean);
  }
  const single = entry?.fusionHint?.trim();
  if (single) {
    const parts = single.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts;
  }
  return ['No fusion hints yet.'];
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
