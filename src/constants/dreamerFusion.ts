/**
 * Dreamer Slime — fixed 4-parent legendary fusion.
 */

import { COSTS } from '@/src/constants/game';
import { SPECIES } from '@/src/data/species';

export const DREAMER_FUSION_RESULT_SPECIES_ID = SPECIES.DREAMER_SLIME.id;
export const DREAMER_FUSION_CANDY_COST = COSTS.FUSE_LEGENDARY;

/** One fusion-only ultra rare per zone endgame chain. */
export const DREAMER_FUSION_PARENT_SLOTS = [
  { speciesId: SPECIES.FIREFLY_SLIME.id },
  { speciesId: SPECIES.PEARLESCENT_SLIME.id },
  { speciesId: SPECIES.ANCIENT_SLIME.id },
  { speciesId: SPECIES.HOLOGRAM_SLIME.id },
] as const;

export const DREAMER_FUSION_PARENT_SPECIES_IDS = DREAMER_FUSION_PARENT_SLOTS.map(
  (slot) => slot.speciesId
);

export type DreamerFusionSlotIndex = 0 | 1 | 2 | 3;
