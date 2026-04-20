// --- Tiers (T1–T4) ---
export const Tier = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  ULTRA_RARE: 4,
} as const;
export type Tier = (typeof Tier)[keyof typeof Tier];

export const TIER_LABELS = {
  [Tier.COMMON]: 'Common',
  [Tier.UNCOMMON]: 'Uncommon',
  [Tier.RARE]: 'Rare',
  [Tier.ULTRA_RARE]: 'Ultra Rare',
} as const;

// --- Set ids (themed sets) ---
export const SetId = {
  NONE: 'none',
  COLOR: 'color',
  NATURE: 'nature',
  TECH: 'tech',
  LUXURY: 'luxury',
} as const;
export type SetId = (typeof SetId)[keyof typeof SetId];

export const SET_LABELS = {
  [SetId.COLOR]: 'Color Set',
  [SetId.NATURE]: 'Nature Set',
  [SetId.TECH]: 'Tech Set',
  [SetId.LUXURY]: 'Luxury Set',
} as const;

export const COSTS = {
  FUSE_COMMON: 5,
  FUSE_UNCOMMON: 8,
  FUSE_RARE: 15,
  FUSE_ULTRA_RARE: 30,
} as const;



// --- Sleep rewards ---

export const MIN_VALID_SLEEP_SECONDS = 10;
export const CANDIES_PER_HOUR = 1.3;
export const MIN_CANDIES_PER_VALID_SESSION = 1;
export const MAX_CANDIES_PER_SESSION = 15;

/**
 * Minimum streak count (nights in a row) to earn streak bonuses.
 * Streak must be **above 3** ⇒ first rewarding night is streak === 4.
 */
export const STREAK_BONUS_MIN_STREAK = 4;

/** Flat candy bonus when streak is at least `STREAK_BONUS_MIN_STREAK`. */
export const STREAK_CANDY_FLAT_BONUS = 5;

// Zone ids are plain strings; use ZONES.GRASSY_MEADOW.id etc. from data/zones.
