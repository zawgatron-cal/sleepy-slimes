import type { Slime, Species } from '@/src/types';
import { compareFusionConsumptionPriority, sortSlimesForFusionConsumption } from '@/src/utils/fusionConsumption';
import {
  getSlimeDisplayName,
  getSpeciesDefaultDisplayName,
  slimeHasCustomNickname,
} from '@/src/utils/slimeDisplayName';

export type FusionPickerRow = {
  /** Stable list key (`slimeId` for named rows, `species:<id>` for grouped unnamed). */
  key: string;
  /** Instance consumed when this row is chosen. */
  slimeId: string;
  species: Species;
  displayName: string;
  /** Shown as `x{count}` on the right for grouped unnamed rows only. */
  count?: number;
};

/**
 * Fusion picker rows: unnamed slimes grouped per species (count on the right),
 * each custom-named slime on its own row.
 */
export function buildFusionPickerRows(
  slimes: Slime[],
  speciesById: Record<string, Species>,
  excludeSlimeId: string | null,
  showFavorited = false
): FusionPickerRow[] {
  let available = slimes.filter((s) => s.id !== excludeSlimeId);
  if (!showFavorited) {
    available = available.filter((s) => !s.favorited);
  }
  const namedRows: FusionPickerRow[] = [];
  const unnamedBySpecies = new Map<string, Slime[]>();

  for (const slime of available) {
    const species = speciesById[slime.speciesId];
    if (!species) continue;

    if (slimeHasCustomNickname(slime, species)) {
      namedRows.push({
        key: slime.id,
        slimeId: slime.id,
        species,
        displayName: getSlimeDisplayName(slime, species),
      });
      continue;
    }

    const bucket = unnamedBySpecies.get(slime.speciesId) ?? [];
    bucket.push(slime);
    unnamedBySpecies.set(slime.speciesId, bucket);
  }

  const groupedRows: FusionPickerRow[] = [];
  for (const [speciesId, instances] of unnamedBySpecies) {
    const species = speciesById[speciesId];
    if (!species || instances.length === 0) continue;

    const sorted = sortSlimesForFusionConsumption(instances);

    groupedRows.push({
      key: `species:${speciesId}`,
      slimeId: sorted[0].id,
      species,
      displayName: getSpeciesDefaultDisplayName(species, speciesId),
      count: sorted.length,
    });
  }

  const slimeById = new Map(available.map((s) => [s.id, s]));
  const rows = [...groupedRows, ...namedRows];
  rows.sort((a, b) => {
    const tierDiff = a.species.tier - b.species.tier;
    if (tierDiff !== 0) return tierDiff;
    const nameDiff = a.displayName.localeCompare(b.displayName);
    if (nameDiff !== 0) return nameDiff;
    const slimeA = slimeById.get(a.slimeId);
    const slimeB = slimeById.get(b.slimeId);
    if (slimeA && slimeB) {
      return compareFusionConsumptionPriority(slimeA, slimeB);
    }
    return 0;
  });
  return rows;
}
