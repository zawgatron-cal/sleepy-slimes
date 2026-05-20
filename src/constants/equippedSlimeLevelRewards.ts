/**
 * Equipped slime level bonuses — edit numeric values here.
 *
 * Index 0 = Level 1, … index 4 = Level 5.
 * Reward *kind* per tier is wired in `src/utils/equippedSlimeRewards.ts` (change there to swap reward types).
 */

import { Tier } from '@/src/constants/game';

/** Five levels of bonuses (Lv.1 → Lv.5). */
export type LevelBonusValues = readonly [number, number, number, number, number];

// --- Common: % more candies ---
export const COMMON_CANDY_PERCENT_MORE: LevelBonusValues = [5, 10, 15, 20, 30];

// --- Uncommon: % chance for +1 slime roll ---
export const UNCOMMON_EXTRA_SLIME_ROLL_PERCENT: LevelBonusValues = [10, 15, 20, 45, 75];

// --- Rare: spawn chance (percentage points added to zone tier weights) ---
export const RARE_SPAWN_RARE_PERCENT: LevelBonusValues = [3, 5, 7, 8, 10];
export const RARE_SPAWN_ULTRA_PERCENT: LevelBonusValues = [0, 0, 0, 1, 3];

// --- Ultra Rare: variant drop (percentage points added to roll weights) ---
export const ULTRA_RARE_PRISMATIC_PERCENT: LevelBonusValues = [1, 3, 5, 7, 0];
export const ULTRA_RARE_EXOTIC_PERCENT: LevelBonusValues = [0, 0, 0, 0, 0.1];

/**
 * Which value columns apply to each tier (documentation + dev tools).
 * Game logic uses the switch in `getEquippedSlimeBonus`; keep in sync when editing kinds.
 */
export const EQUIPPED_SLIME_REWARD_KIND_BY_TIER = {
  [Tier.COMMON]: 'candy_percent_more',
  [Tier.UNCOMMON]: 'extra_slime_roll_percent',
  [Tier.RARE]: 'tier_spawn_percent',
  [Tier.ULTRA_RARE]: 'variant_drop_percent',
} as const;
