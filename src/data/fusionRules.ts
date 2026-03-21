/**
 * Master fusion rules — (parentA + parentB) → result, with candy cost.
 * All deterministic (one outcome per parent pair). Lookup supports either parent order via getFusionResultsForParents.
 */

import type { FusionRule } from '@/src/types';
import { SPECIES } from './species';
import { COSTS } from '@/src/constants/game';

/*

Fusion Rules: A[B] = C, very rarely A + B = C

*/
export const FUSION_RULES_MASTER: FusionRule[] = [
  // FUSION ONLY GRASS MEADOW
  { parentSpeciesA: SPECIES.BEE_SLIME.id, parentSpeciesB: SPECIES.FLOWER_SLIME.id, resultSpeciesId: SPECIES.POLLEN_SLIME.id, candyCost: COSTS.FUSE_UNCOMMON, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.NIMBUS.id, parentSpeciesB: SPECIES.GRASS_SLIME.id, resultSpeciesId: SPECIES.WIND_SLIME.id, candyCost: COSTS.FUSE_UNCOMMON, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.SUN_SLIME.id, parentSpeciesB: SPECIES.FLOWER_SLIME.id, resultSpeciesId: SPECIES.SUNFLOWER_SLIME.id, candyCost: COSTS.FUSE_UNCOMMON, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.GRASS_SLIME.id, parentSpeciesB: SPECIES.WIND_SLIME.id, resultSpeciesId: SPECIES.SAMARA_SLIME.id, candyCost: COSTS.FUSE_RARE, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.BERRY_SLIME.id, parentSpeciesB: SPECIES.MOON_SLIME.id, resultSpeciesId: SPECIES.WIND_SLIME.id, candyCost: COSTS.FUSE_RARE, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.POLLEN_SLIME.id, parentSpeciesB: SPECIES.MOON_SLIME.id, resultSpeciesId: SPECIES.PHOSPHOR_SLIME.id, candyCost: COSTS.FUSE_RARE, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.BUTTERFLY_SLIME.id, parentSpeciesB: SPECIES.PHOSPHOR_SLIME.id, resultSpeciesId: SPECIES.FIREFLY_SLIME.id, candyCost: COSTS.FUSE_ULTRA_RARE, deterministic: true, weight: null },
];
