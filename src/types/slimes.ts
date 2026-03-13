/**
 * Sleepy Slimes — Type definitions
 * PRD: Static species, tiers (T1–T4), sets, zones, candies, collection.
 * Game constants (Tier, SetId, labels) live in src/constants/game.ts.
 */

import type { Tier, SetId } from '@/src/constants/game';

export type { Tier, SetId } from '@/src/constants/game';

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
  /** Per-instance numeric seed for visuals / randomness. */
  seed?: number;
  /** When this instance was acquired (sleep session id or fusion id). */
  acquiredAt: number;
  /** Optional: link to sleep session or fusion record. */
  source?: 'sleep' | 'fusion';
}

// --- Sleep zones (where you "sleep" in-app) ---
/** Single zone type for master data and DB/UI. Use unlockedByDefault as "unlocked" until progression is persisted. */
export interface Zone {
  id: string;
  name: string;
  /** Short description of effect for UI. */
  effect: string;
  /** Whether this zone is unlocked by default (runtime "unlocked" can be derived from progression later). */
  unlockedByDefault: boolean;
}
/** Weighted slime spawn rule for the spawn tables. */
export interface SpawnTableEntry {
  zoneId: string;
  speciesId: string;
  weight: number;
}

/** One fusion rule: (parentA + parentB) → result. Use weight: null for deterministic, number for probabilistic. */
export interface FusionRule {
  parentSpeciesA: string;
  parentSpeciesB: string;
  resultSpeciesId: string;
  candyCost: number;
  deterministic: boolean;
  /** null for deterministic rules; relative weight for probabilistic (e.g. 1 and 1 = 50/50). */
  weight: number | null;
}

// --- Sleep session (one night) ---
// Duration, quality, zone; used to compute candies and spawns.
export interface SleepSession {
  id: string;
  zoneId: string;
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
