/**
 * Sleepy Slimes — Type definitions
 * PRD: Static species, tiers (T1–T4), sets, zones, candies, collection.
 * Slime visuals/procedural not implemented yet; these are data structures only.
 */

// --- Tiers (gameplay progression) ---
// T1 Common → T4 Ultra Rare. Affects fusion cost, unlock order, difficulty.
export type Tier = 1 | 2 | 3 | 4;

export const TIER_LABELS: Record<Tier, string> = {
  1: 'Common',
  2: 'Uncommon',
  3: 'Rare',
  4: 'Ultra Rare',
};

// --- Themed sets (Color, Nature, Tech, etc.) ---
// Used for zone boosts and encyclopedia grouping.
export type SetId = 'color' | 'nature' | 'tech' | 'luxury';

export const SET_LABELS: Record<SetId, string> = {
  color: 'Color Set',
  nature: 'Nature Set',
  tech: 'Tech Set',
  luxury: 'Luxury Set',
};

// --- Species (hand-defined template for a slime type) ---
// Each species has a tier and belongs to a set. Fusion rules defined elsewhere.
export interface Species {
  id: string;
  name: string;
  setId: SetId;
  tier: Tier;
  /** If true, this species can only be obtained via fusion (no sleep spawn). */
  fusionOnly: boolean;
  /** Optional: deterministic recipe key for encyclopedia/fusion logic. */
  recipeKey?: string;
}

// --- Slime (instance owned by player) ---
// References a species. Cosmetic rarity can be added later (visuals only).
export interface Slime {
  id: string;
  speciesId: string;
  /** When this instance was acquired (sleep session id or fusion id). */
  acquiredAt: number;
  /** Optional: link to sleep session or fusion record. */
  source?: 'sleep' | 'fusion';
}

// --- Sleep zones (where you "sleep" in-app) ---
// Affects which slimes spawn; unlocked via progression.
export type ZoneId = 'cozy_bedroom' | 'forest_cabin' | 'urban_apartment' | 'luxury_hotel';

export interface Zone {
  id: ZoneId;
  name: string;
  /** Short description of effect for UI. */
  effect: string;
  /** Whether the player has unlocked this zone. */
  unlocked: boolean;
}

// --- Sleep session (one night) ---
// Duration, quality, zone; used to compute candies and spawns.
export interface SleepSession {
  id: string;
  zoneId: ZoneId;
  /** Start time (epoch ms). */
  startedAt: number;
  /** End time (epoch ms); set when user stops sleep. */
  endedAt?: number;
  /** Hours slept (can be manual or derived from startedAt/endedAt). */
  durationHours: number;
  /** 0–1 or 1–5 depending on UI; used for bonuses. */
  quality: number;
  /** Candies awarded for this session (computed). */
  candiesEarned: number;
}

// --- Fusion (combine two slimes → one) ---
// Recipe / result logic will live in SQLite + fusion service later.
export interface FusionResult {
  success: boolean;
  /** Resulting slime if success. */
  slime?: Slime;
  /** Candy cost applied. */
  candyCost: number;
  /** Error or tier-up message. */
  message?: string;
}

// --- Candies (universal currency) ---
// Earned: sleep (base per hour + bonuses + streak). Spent: fusion only.
export interface CandiesState {
  total: number;
  /** Last time candies were updated (e.g. after sleep). */
  lastUpdatedAt: number;
}

// --- Streaks (for sleep consistency bonus) ---
export interface StreakState {
  /** Consecutive days with a completed sleep session. */
  currentStreak: number;
  /** Longest streak (for display). */
  longestStreak: number;
  /** Last date (YYYY-MM-DD) that contributed to streak. */
  lastDate: string | null;
}
