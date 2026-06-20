import { Tier, type Tier as TierType } from '@/src/constants/game';
import type { SlimeLevel } from '@/src/constants/game';

/** Candies + equipped sleep nights to advance one level. */
export type LevelUpRequirement = {
  nights: number;
  candies: number;
};

/** Keys are current level before leveling (1→2 uses key 1). */
export type LevelUpStepKey = 1 | 2 | 3 | 4;

/**
 * Per-rarity requirements for each level transition (fusion + sleep spawns).
 * Totals to reach L5: Common 14n/43c, Uncommon 24n/79c, Rare 38n/150c, Ultra Rare 62n/300c.
 */
export const SLIME_LEVEL_UP_REQUIREMENTS: Record<
  TierType,
  Record<LevelUpStepKey, LevelUpRequirement>
> = {
  [Tier.COMMON]: {
    1: { nights: 2, candies: 5 },
    2: { nights: 3, candies: 8 },
    3: { nights: 4, candies: 12 },
    4: { nights: 5, candies: 18 },
  },
  [Tier.UNCOMMON]: {
    1: { nights: 3, candies: 10 },
    2: { nights: 5, candies: 15 },
    3: { nights: 7, candies: 22 },
    4: { nights: 9, candies: 32 },
  },
  [Tier.RARE]: {
    1: { nights: 4, candies: 18 },
    2: { nights: 7, candies: 28 },
    3: { nights: 11, candies: 42 },
    4: { nights: 16, candies: 62 },
  },
  [Tier.ULTRA_RARE]: {
    1: { nights: 6, candies: 35 },
    2: { nights: 11, candies: 55 },
    3: { nights: 18, candies: 85 },
    4: { nights: 27, candies: 125 },
  },
  [Tier.LEGENDARY]: {
    1: { nights: 8, candies: 50 },
    2: { nights: 18, candies: 80 },
    3: { nights: 28, candies: 130 },
    4: { nights: 36, candies: 180 },
  },
};

/** Cumulative cost to reach level 5 from level 1 (for reference / UI). */
export const SLIME_LEVEL_UP_TOTALS: Record<TierType, LevelUpRequirement> = {
  [Tier.COMMON]: { nights: 14, candies: 43 },
  [Tier.UNCOMMON]: { nights: 24, candies: 79 },
  [Tier.RARE]: { nights: 38, candies: 150 },
  [Tier.ULTRA_RARE]: { nights: 62, candies: 300 },
  [Tier.LEGENDARY]: { nights: 90, candies: 440 },
};

export function isLevelUpStepKey(level: SlimeLevel): level is LevelUpStepKey {
  return level >= 1 && level <= 4;
}
