/**
 * Master fusion rules — (parentA + parentB) → result, with candy cost.
 * All deterministic (one outcome per parent pair). Lookup supports either parent order via getFusionResultsForParents.
 */

import type { FusionRule } from '@/src/types';
import { SPECIES } from './species';
import { COSTS } from '@/src/constants/game';

export const FUSION_RULES_MASTER: FusionRule[] = [
  { parentSpeciesA: SPECIES.FLOWER_SLIME.id, parentSpeciesB: SPECIES.GRASS_SLIME.id, resultSpeciesId: SPECIES.BERRY_SLIME.id, candyCost: COSTS.FUSE_UNCOMMON, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.BEE_SLIME.id, parentSpeciesB: SPECIES.FLOWER_SLIME.id, resultSpeciesId: SPECIES.POLLEN_SLIME.id, candyCost: COSTS.FUSE_UNCOMMON, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.CLOUD_SLIME.id, parentSpeciesB: SPECIES.GRASS_SLIME.id, resultSpeciesId: SPECIES.WIND_SLIME.id, candyCost: COSTS.FUSE_UNCOMMON, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.SLIME.id, parentSpeciesB: SPECIES.FLOWER_SLIME.id, resultSpeciesId: SPECIES.LOVE_SLIME.id, candyCost: COSTS.FUSE_UNCOMMON, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.MOON_SLIME.id, parentSpeciesB: SPECIES.SLIME.id, resultSpeciesId: SPECIES.SLEEPING_SLIME.id, candyCost: COSTS.FUSE_RARE, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.DEW_SLIME.id, parentSpeciesB: SPECIES.WIND_SLIME.id, resultSpeciesId: SPECIES.DAWN_SLIME.id, candyCost: COSTS.FUSE_RARE, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.GRASS_SLIME.id, parentSpeciesB: SPECIES.WIND_SLIME.id, resultSpeciesId: SPECIES.SAMARA_SLIME.id, candyCost: COSTS.FUSE_RARE, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.BEE_SLIME.id, parentSpeciesB: SPECIES.MOON_SLIME.id, resultSpeciesId: SPECIES.PHOSPHOR_SLIME.id, candyCost: COSTS.FUSE_RARE, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.LOVE_SLIME.id, parentSpeciesB: SPECIES.MOON_SLIME.id, resultSpeciesId: SPECIES.CUPID_SLIME.id, candyCost: COSTS.FUSE_ULTRA_RARE, deterministic: true, weight: null },
  { parentSpeciesA: SPECIES.BUTTERFLY_SLIME.id, parentSpeciesB: SPECIES.PHOSPHOR_SLIME.id, resultSpeciesId: SPECIES.FIREFLY_SLIME.id, candyCost: COSTS.FUSE_ULTRA_RARE, deterministic: true, weight: null },
];
