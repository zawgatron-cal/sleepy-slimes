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


/** Cosmetic variant per slime instance (exactly one; not combinable). */
export const SlimeVariant = {
  STANDARD: 'standard',
  PRISMATIC: 'prismatic',
  EXOTIC: 'exotic',
  GOLD: 'gold',
} as const;
export type SlimeVariant = (typeof SlimeVariant)[keyof typeof SlimeVariant];

export const SLIME_VARIANT_LABELS: Record<SlimeVariant, string> = {
  [SlimeVariant.STANDARD]: 'Standard',
  [SlimeVariant.PRISMATIC]: 'Prismatic',
  [SlimeVariant.EXOTIC]: 'Exotic',
  [SlimeVariant.GOLD]: 'Gold',
};

/** Default for new slimes until the rarity roll system exists. */
export const DEFAULT_SLIME_VARIANT = SlimeVariant.STANDARD;


// --- Set ids (themed sets) ---
export const SetId = {
  NONE: 'none',
  COLOR: 'color',
  NATURE: 'nature',
  TECH: 'tech',
  LUXURY: 'luxury',
} as const;
export type SetId = (typeof SetId)[keyof typeof SetId];

/** Slimepedia sections (excludes `none`). Array order = display order. */
export const SLIMEPEDIA_SETS = [
  { id: SetId.NATURE, label: 'Nature' },
  { id: SetId.TECH, label: 'Tech' },
  { id: SetId.COLOR, label: 'Color' },
  { id: SetId.LUXURY, label: 'Luxury' },
] as const satisfies readonly { id: SetId; label: string }[];

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

/** Slimes rolled per valid sleep session (`slimeCountDistribution`). */
export const MIN_SLIMES_PER_SLEEP_SESSION = 1;
export const MAX_SLIMES_PER_SLEEP_SESSION = 5;

/**
 * Minimum streak count (nights in a row) to earn streak bonuses.
 * Streak must be **above 3** ⇒ first rewarding night is streak === 4.
 */
export const STREAK_BONUS_MIN_STREAK = 4;

/** Flat candy bonus when streak is at least `STREAK_BONUS_MIN_STREAK`. */
export const STREAK_CANDY_FLAT_BONUS = 5;

// Zone ids are plain strings; use ZONES.GRASSY_MEADOW.id etc. from data/zones.
