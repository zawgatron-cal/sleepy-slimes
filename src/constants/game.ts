/**
 * Game constants: tiers, sets, zone ids, and their display labels.
 * Types are derived from the consts so labels don't need separate typings.
 */

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

// Zone ids are plain strings; use ZONES.COZY_BEDROOM.id etc. from data/zones.
