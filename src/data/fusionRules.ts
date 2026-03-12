/**
 * Master fusion rules — (parentA + parentB) → result, with candy cost.
 * Use SPECIES.*.id so IDs stay in sync with the species registry.
 * Seeded into SQLite; fusion logic reads via getFusionRules / getFusionResultsForParents.
 */

import type { FusionRule } from '@/src/types';
import { SPECIES } from './species';
import { COSTS } from '@/src/constants/game'

export const FUSION_RULES_MASTER: FusionRule[] = [
  { parentSpeciesA: SPECIES.GREEN_SLIME.id, parentSpeciesB: SPECIES.PINK_SLIME.id, resultSpeciesId: SPECIES.BLUE_SLIME.id, candyCost: COSTS.FUSE_UNCOMMON, deterministic: true, weight: null },
];
