import { DREAMER_FUSION_PARENT_SPECIES_IDS } from '@/src/constants/dreamerFusion';

/** True once any Dreamer parent species has been discovered in the slimepedia. */
export function isDreamerFusionUnlocked(discoveredSpeciesIds: readonly string[]): boolean {
  const discovered = new Set(discoveredSpeciesIds);
  return DREAMER_FUSION_PARENT_SPECIES_IDS.some((id) => discovered.has(id));
}
