// --- Tiers (T1–T5) ---
export const Tier = {
  COMMON: 1,
  UNCOMMON: 2,
  RARE: 3,
  ULTRA_RARE: 4,
  LEGENDARY: 5,
} as const;
export type Tier = (typeof Tier)[keyof typeof Tier];

/** Tiers that can appear in zone sleep spawn rolls (excludes fusion-only Legendary). */
export type SpawnableTier = Exclude<Tier, typeof Tier.LEGENDARY>;

export const TIER_LABELS = {
  [Tier.COMMON]: 'Common',
  [Tier.UNCOMMON]: 'Uncommon',
  [Tier.RARE]: 'Rare',
  [Tier.ULTRA_RARE]: 'Ultra Rare',
  [Tier.LEGENDARY]: 'Legendary',
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

/** Fallback when DB value is missing or invalid. */
export const DEFAULT_SLIME_VARIANT = SlimeVariant.STANDARD;

/**
 * Base variant drop rates for sleep spawns and fusion offspring (sum = 10_000 ⇒ 100%).
 * Standard ~94.89%, Prismatic ~5%, Exotic ~0.1%, Gold ~0.01%.
 */
export const SLIME_VARIANT_DROP_TABLE: ReadonlyArray<{
  variant: SlimeVariant;
  weight: number;
}> = [
  { variant: SlimeVariant.STANDARD, weight: 9489 },
  { variant: SlimeVariant.PRISMATIC, weight: 500 },
  { variant: SlimeVariant.EXOTIC, weight: 10 },
  { variant: SlimeVariant.GOLD, weight: 1 },
];

/** Per-instance progression level (1 = newly hatched / fused). */
export const MIN_SLIME_LEVEL = 1;
export const MAX_SLIME_LEVEL = 5;
export const DEFAULT_SLIME_LEVEL = MIN_SLIME_LEVEL;

export type SlimeLevel = 1 | 2 | 3 | 4 | 5;

// --- Set ids (themed sets) ---
export const SetId = {
  NONE: 'none',
  NATURE: 'nature',
  OCEAN: 'ocean',
  NIGHT: 'night',
  SPIRIT: 'spirit',
  ELEMENTAL: 'elemental',
  COSMIC: 'cosmic',
  TECH: 'tech',
  ROYAL: 'royal',
  CREATURE: 'creature',
  WHIMSY: 'whimsy',
} as const;
export type SetId = (typeof SetId)[keyof typeof SetId];

/** Slimepedia sections (excludes `none`). Array order = display order. */
export const SLIMEPEDIA_SETS = [
  { id: SetId.NATURE, label: 'Nature' },
  { id: SetId.OCEAN, label: 'Ocean' },
  { id: SetId.NIGHT, label: 'Night' },
  { id: SetId.SPIRIT, label: 'Spirit' },
  { id: SetId.ELEMENTAL, label: 'Elemental' },
  { id: SetId.COSMIC, label: 'Cosmic' },
  { id: SetId.TECH, label: 'Tech' },
  { id: SetId.ROYAL, label: 'Royal' },
  { id: SetId.CREATURE, label: 'Creature' },
  { id: SetId.WHIMSY, label: 'Whimsy' },
] as const satisfies readonly { id: SetId; label: string }[];

export const COSTS = {
  FUSE_COMMON: 5,
  FUSE_UNCOMMON: 8,
  FUSE_RARE: 15,
  FUSE_ULTRA_RARE: 30,
  FUSE_LEGENDARY: 50,
} as const;



// --- Sleep rewards ---

export const MIN_VALID_SLEEP_SECONDS = 10;
export const CANDIES_PER_HOUR = 1.3;
export const MIN_CANDIES_PER_VALID_SESSION = 1;
export const MAX_CANDIES_PER_SESSION = Infinity;

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
