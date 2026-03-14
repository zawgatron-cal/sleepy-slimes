/**
 * Per-zone rarity spawn probabilities (percent 0–100 per tier).
 * Used by spawn logic: pick tier from this distribution, then pick a species of that tier from the zone's spawn table.
 * Each area has unique rarity spawn probabilities.
 */

import { Tier } from '@/src/constants/game';
import { ZONES } from './zones';

/** Rarity spawn weights for one zone: all four tiers required (percentages sum to 100). */
export type ZoneTierWeights = Record<Tier, number>;

/** Rarity spawn weights by zone id. Every zone has all tiers. Values are percentages (sum to 100 per zone). */
export const ZONE_TIER_WEIGHTS: Record<string, ZoneTierWeights> = {
  [ZONES.GRASSY_MEADOW.id]: {
    [Tier.COMMON]: 61,
    [Tier.UNCOMMON]: 28,
    [Tier.RARE]: 9,
    [Tier.ULTRA_RARE]: 2,
  },
};
