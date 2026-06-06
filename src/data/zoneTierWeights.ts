/**
 * Per-zone rarity spawn probabilities (percent 0–100 per tier).
 * Used by spawn logic: pick tier from this distribution, then pick a species of that tier from the zone's spawn table.
 * Each area has unique rarity spawn probabilities.
 */

import { Tier, type SpawnableTier } from '@/src/constants/game';
import { ZONES } from './zones';

/** Rarity spawn weights for one zone: spawnable tiers only (percentages sum to 100). */
export type ZoneTierWeights = Record<SpawnableTier, number>;

const DEFAULT_WEIGHTS: ZoneTierWeights = {
  [Tier.COMMON]: 61,
  [Tier.UNCOMMON]: 28,
  [Tier.RARE]: 9,
  [Tier.ULTRA_RARE]: 2,
};

/** Rarity spawn weights by zone id. Every zone has all spawnable tiers. Values are percentages (sum to 100 per zone). */
export const ZONE_TIER_WEIGHTS: Record<string, ZoneTierWeights> = {
  [ZONES.GRASSY_MEADOW.id]: { ...DEFAULT_WEIGHTS },
  [ZONES.THE_SEA.id]: {
    [Tier.COMMON]: 58,
    [Tier.UNCOMMON]: 30,
    [Tier.RARE]: 9,
    [Tier.ULTRA_RARE]: 3,
  },
  [ZONES.FOREST_RUINS.id]: {
    [Tier.COMMON]: 55,
    [Tier.UNCOMMON]: 30,
    [Tier.RARE]: 11,
    [Tier.ULTRA_RARE]: 4,
  },
  [ZONES.SLIME_CITY.id]: {
    [Tier.COMMON]: 60,
    [Tier.UNCOMMON]: 28,
    [Tier.RARE]: 10,
    [Tier.ULTRA_RARE]: 2,
  },
};
