/**
 * SQLite database for Sleepy Slimes.
 * PRD: Relational storage for fusion logic, species, and collection.
 * Schema is minimal baseline; fusion rules and species data will be populated later.
 */

import * as SQLite from 'expo-sqlite';
import { DEFAULT_SLIME_VARIANT } from '@/src/constants/game';
import type { SleepSession, Slime, Species, Zone, FusionRule, SpawnTableEntry } from '@/src/types';
import { parseEquippedNights } from '@/src/utils/slimeLevelUp';
import { parseSlimeLevel } from '@/src/utils/slimeLevel';
import { parseSlimeVariant } from '@/src/utils/slimeVariant';

import { PLAYER_SETTING_KEYS } from '@/src/constants/playerSettings';
import {
  SPECIES,
  ZONES,
  FUSION_RULES_MASTER,
  SPAWN_TABLES_MASTER,
  sortZonesForDisplay,
} from '@/src/data';

const PLAYER_SETTING_EQUIPPED_SLIME = PLAYER_SETTING_KEYS.EQUIPPED_SLIME_ID;

const DB_NAME = 'sleepy_slimes.db';

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/**
 * Get or create the app database. Call once at app init (e.g. in root layout).
 * Concurrent callers share the same init so we never open the DB twice.
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const database = await SQLite.openDatabaseAsync(DB_NAME);
        await ensureSchema(database);
        await seedFromMasterData(database);
        db = database;
        return database;
      } catch (e) {
        initPromise = null;
        throw e;
      }
    })();
  }
  const database = await initPromise;
  return database;
}

/**
 * Persist a sleep session and return the saved session (with endedAt set).
 */
export async function insertSleepSession(session: SleepSession): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO sleep_sessions (id, zone_id, started_at, ended_at, duration_hours, quality, candies_earned)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      session.id,
      session.zoneId,
      session.startedAt,
      session.endedAt ?? null,
      session.durationHours,
      session.quality,
      session.candiesEarned,
    ]
  );
}

/**
 * Fetch all sleep sessions (newest first). For dev page and streak logic.
 */
export async function getSleepSessions(): Promise<SleepSession[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string;
    zone_id: string;
    started_at: number;
    ended_at: number | null;
    duration_hours: number;
    quality: number;
    candies_earned: number;
  }>('SELECT * FROM sleep_sessions ORDER BY started_at DESC');
  return (rows ?? []).map((r) => ({
    id: r.id,
    zoneId: r.zone_id,
    startedAt: r.started_at,
    endedAt: r.ended_at ?? undefined,
    durationHours: r.duration_hours,
    quality: r.quality,
    candiesEarned: r.candies_earned,
  }));
}

/**
 * Delete a sleep session by id.
 */
export async function deleteSleepSession(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM sleep_sessions WHERE id = ?', [id]);
}

/**
 * Load persisted candies state.
 */
export async function getCandiesState(): Promise<{ total: number; lastUpdatedAt: number } | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<{
    total: number;
    last_updated_at: number;
  }>('SELECT total, last_updated_at FROM candies_state WHERE id = 1');
  if (!row) return null;
  return { total: row.total, lastUpdatedAt: row.last_updated_at };
}

/**
 * Persist candies state (single-row upsert).
 */
export async function upsertCandiesState(total: number, lastUpdatedAt: number): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO candies_state (id, total, last_updated_at)
     VALUES (1, ?, ?)
     ON CONFLICT(id) DO UPDATE SET total = excluded.total, last_updated_at = excluded.last_updated_at`,
    [total, lastUpdatedAt]
  );
}

/**
 * Clear candies_state (set total to 0) for dev reset.
 */
export async function clearCandies(): Promise<void> {
  await upsertCandiesState(0, Date.now());
}

/**
 * Insert a slime into the DB (player inventory).
 */
async function ensureFavoritedColumn(database: SQLite.SQLiteDatabase): Promise<void> {
  try {
    await database.runAsync(
      'ALTER TABLE slimes ADD COLUMN favorited INTEGER NOT NULL DEFAULT 0'
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/duplicate column name/i.test(msg)) throw e;
  }
}

export async function insertSlime(slime: Slime): Promise<void> {
  const database = await getDb();
  const baseArgs = [
    slime.id,
    slime.speciesId,
    slime.variant ?? DEFAULT_SLIME_VARIANT,
    parseSlimeLevel(slime.level),
    parseEquippedNights(slime.equippedNights),
    slime.nickname?.trim() || null,
    slime.acquiredAt,
    slime.source ?? null,
  ] as const;

  try {
    await database.runAsync(
      'INSERT INTO slimes (id, species_id, variant, level, equipped_nights, nickname, favorited, acquired_at, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [...baseArgs.slice(0, 6), slime.favorited ? 1 : 0, ...baseArgs.slice(6)]
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/no such column.*favorited/i.test(msg)) throw e;
    await ensureFavoritedColumn(database);
    await database.runAsync(
      'INSERT INTO slimes (id, species_id, variant, level, equipped_nights, nickname, favorited, acquired_at, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [...baseArgs.slice(0, 6), slime.favorited ? 1 : 0, ...baseArgs.slice(6)]
    );
  }

  await recordSlimepediaDiscovery(slime.speciesId);
}

export async function updateSlimeNickname(
  slimeId: string,
  nickname: string | null
): Promise<void> {
  const database = await getDb();
  const value = nickname?.trim() || null;
  await database.runAsync('UPDATE slimes SET nickname = ? WHERE id = ?', [value, slimeId]);
}

export async function updateSlimeFavorited(
  slimeId: string,
  favorited: boolean
): Promise<void> {
  const database = await getDb();
  try {
    await database.runAsync('UPDATE slimes SET favorited = ? WHERE id = ?', [
      favorited ? 1 : 0,
      slimeId,
    ]);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/no such column.*favorited/i.test(msg)) throw e;
    await ensureFavoritedColumn(database);
    await database.runAsync('UPDATE slimes SET favorited = ? WHERE id = ?', [
      favorited ? 1 : 0,
      slimeId,
    ]);
  }
}

/**
 * Update a slime's level (1–5). Used by progression flows.
 */
export async function updateSlimeLevel(
  slimeId: string,
  level: Slime['level']
): Promise<void> {
  const database = await getDb();
  await database.runAsync('UPDATE slimes SET level = ? WHERE id = ?', [
    parseSlimeLevel(level),
    slimeId,
  ]);
}

/** Nights equipped at current level (toward next level-up). */
export async function updateSlimeEquippedNights(
  slimeId: string,
  equippedNights: number
): Promise<void> {
  const database = await getDb();
  await database.runAsync('UPDATE slimes SET equipped_nights = ? WHERE id = ?', [
    parseEquippedNights(equippedNights),
    slimeId,
  ]);
}

/** Level up: set new level and reset equipped nights for the next tier step. */
export async function applySlimeLevelUp(
  slimeId: string,
  newLevel: Slime['level']
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'UPDATE slimes SET level = ?, equipped_nights = 0 WHERE id = ?',
    [parseSlimeLevel(newLevel), slimeId]
  );
}

export async function getPlayerSetting(key: string): Promise<string | null> {
  const database = await getDb();
  const row = await database.getFirstAsync<{ value: string }>(
    'SELECT value FROM player_settings WHERE key = ?',
    [key]
  );
  return row?.value ?? null;
}

export async function setPlayerSetting(key: string, value: string | null): Promise<void> {
  const database = await getDb();
  if (value == null) {
    await database.runAsync('DELETE FROM player_settings WHERE key = ?', [key]);
    return;
  }
  await database.runAsync(
    `INSERT INTO player_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

export async function getBooleanPlayerSetting(
  key: string,
  defaultValue: boolean
): Promise<boolean> {
  const raw = await getPlayerSetting(key);
  if (raw == null) return defaultValue;
  return raw === '1' || raw === 'true';
}

export async function setBooleanPlayerSetting(key: string, enabled: boolean): Promise<void> {
  await setPlayerSetting(key, enabled ? '1' : '0');
}

export function clampUnitVolume(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export async function getNumberPlayerSetting(
  key: string,
  defaultValue: number
): Promise<number> {
  const raw = await getPlayerSetting(key);
  if (raw == null) return clampUnitVolume(defaultValue);
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? clampUnitVolume(parsed) : clampUnitVolume(defaultValue);
}

export async function setNumberPlayerSetting(key: string, value: number): Promise<void> {
  await setPlayerSetting(key, clampUnitVolume(value).toFixed(2));
}

export async function getEquippedSlimeId(): Promise<string | null> {
  return getPlayerSetting(PLAYER_SETTING_EQUIPPED_SLIME);
}

export async function setEquippedSlimeId(slimeId: string | null): Promise<void> {
  await setPlayerSetting(PLAYER_SETTING_EQUIPPED_SLIME, slimeId);
}

/**
 * Delete a slime from the DB by id (e.g. consume during fusion).
 */
export async function deleteSlime(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM slimes WHERE id = ?', [id]);
}

/**
 * Delete all slimes from the DB. For dev when reimplementing slimes.
 */
export async function clearSlimes(): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM slimes');
}

/**
 * Fetch all slimes. For dev page and to hydrate collection store.
 */
export async function getSlimes(): Promise<Slime[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string;
    species_id: string;
    variant: string | null;
    level: number | null;
    equipped_nights: number | null;
    nickname: string | null;
    favorited: number | null;
    acquired_at: number;
    source: string | null;
  }>('SELECT * FROM slimes ORDER BY acquired_at DESC');
  return (rows ?? []).map((r) => ({
    id: r.id,
    speciesId: r.species_id,
    variant: parseSlimeVariant(r.variant),
    level: parseSlimeLevel(r.level),
    equippedNights: parseEquippedNights(r.equipped_nights),
    nickname: r.nickname?.trim() || undefined,
    favorited: (r.favorited ?? 0) === 1,
    acquiredAt: r.acquired_at,
    source: (r.source as 'sleep' | 'fusion') ?? undefined,
  }));
}

/**
 * Fetch all species. For dev page and spawn logic.
 */
export async function getSpecies(): Promise<Species[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string;
    name: string;
    set_id: string;
    tier: number;
    fusion_only: number;
    recipe_key: string | null;
  }>('SELECT * FROM species');
  return (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    setId: r.set_id as Species['setId'],
    tier: r.tier as Species['tier'],
    fusionOnly: r.fusion_only !== 0,
    recipeKey: r.recipe_key ?? undefined,
  }));
}

/**
 * Fetch spawn candidates and weights for a zone. Use for sleep spawn logic (weighted random).
 * Backed by the `spawn_table_entries` table (previously `zone_spawn_weights`).
 */
export async function getSpawnTableEntries(zoneId: string): Promise<SpawnTableEntry[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ species_id: string; weight: number }>(
    'SELECT species_id, weight FROM spawn_table_entries WHERE zone_id = ? ORDER BY species_id',
    [zoneId]
  );
  return (rows ?? []).map((r) => ({ zoneId, speciesId: r.species_id, weight: r.weight }));
}

/**
 * Fetch all zones (for UI). Same Zone type as master data (unlockedByDefault from DB).
 */
export async function getZones(): Promise<Zone[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string;
    name: string;
    blurb: string;
    unlocked_by_default: number;
  }>('SELECT id, name, blurb, unlocked_by_default FROM zones');
  return sortZonesForDisplay(
    (rows ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      blurb: r.blurb,
      unlockedByDefault: r.unlocked_by_default !== 0,
    }))
  );
}

/**
 * Fetch all fusion rules. For dev UI and for fusion service to resolve results.
 */
export async function getFusionRules(): Promise<FusionRule[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    parent_species_a: string;
    parent_species_b: string;
    result_species_id: string;
    candy_cost: number;
    deterministic: number;
    weight: number | null;
  }>('SELECT parent_species_a, parent_species_b, result_species_id, candy_cost, deterministic, weight FROM fusion_rules');
  return (rows ?? []).map((r) => ({
    parentSpeciesA: r.parent_species_a,
    parentSpeciesB: r.parent_species_b,
    resultSpeciesId: r.result_species_id,
    candyCost: r.candy_cost,
    deterministic: r.deterministic !== 0,
    weight: r.weight,
  }));
}

export type FusionCompletionRecord = {
  parentAId: string;
  parentBId: string;
  resultId: string;
  completedAt: number;
};

function canonicalFusionParents(parentA: string, parentB: string): [string, string] {
  return parentA.localeCompare(parentB) <= 0 ? [parentA, parentB] : [parentB, parentA];
}

/** Permanent slimepedia discovery — first time a species enters the collection. */
export async function recordSlimepediaDiscovery(speciesId: string): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `INSERT INTO slimepedia_discoveries (species_id, discovered_at)
     VALUES (?, ?)
     ON CONFLICT(species_id) DO NOTHING`,
    [speciesId, Date.now()]
  );
}

export async function getSlimepediaDiscoveredSpeciesIds(): Promise<string[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{ species_id: string }>(
    'SELECT species_id FROM slimepedia_discoveries'
  );
  return (rows ?? []).map((r) => r.species_id);
}

/** Dev — wipe slimepedia discovery progress (does not remove slimes). */
export async function clearSlimepediaDiscoveries(): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM slimepedia_discoveries');
}

/** Record a successful fusion for slimepedia recipe unlocks. */
export async function recordFusionCompletion(
  parentSpeciesA: string,
  parentSpeciesB: string,
  resultSpeciesId: string
): Promise<void> {
  const database = await getDb();
  const [parentA, parentB] = canonicalFusionParents(parentSpeciesA, parentSpeciesB);
  const completedAt = Date.now();
  await database.runAsync(
    `INSERT INTO fusion_completions (parent_species_a, parent_species_b, result_species_id, completed_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(parent_species_a, parent_species_b, result_species_id) DO NOTHING`,
    [parentA, parentB, resultSpeciesId, completedAt]
  );
}

export async function getFusionCompletions(): Promise<FusionCompletionRecord[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    parent_species_a: string;
    parent_species_b: string;
    result_species_id: string;
    completed_at: number;
  }>(
    'SELECT parent_species_a, parent_species_b, result_species_id, completed_at FROM fusion_completions ORDER BY completed_at ASC'
  );
  return (rows ?? []).map((r) => ({
    parentAId: r.parent_species_a,
    parentBId: r.parent_species_b,
    resultId: r.result_species_id,
    completedAt: r.completed_at,
  }));
}

async function backfillSlimepediaDiscoveries(
  database: SQLite.SQLiteDatabase
): Promise<void> {
  const rows = await database.getAllAsync<{ species_id: string; acquired_at: number }>(
    'SELECT species_id, MIN(acquired_at) AS acquired_at FROM slimes GROUP BY species_id'
  );
  for (const row of rows ?? []) {
    await database.runAsync(
      `INSERT INTO slimepedia_discoveries (species_id, discovered_at)
       VALUES (?, ?)
       ON CONFLICT(species_id) DO NOTHING`,
      [row.species_id, row.acquired_at]
    );
  }
}

/**
 * Fetch fusion result options for a parent pair (order-agnostic: A+B and B+A).
 */
export async function getFusionResultsForParents(
  parentSpeciesA: string,
  parentSpeciesB: string
): Promise<FusionRule[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    parent_species_a: string;
    parent_species_b: string;
    result_species_id: string;
    candy_cost: number;
    deterministic: number;
    weight: number | null;
  }>(
    `SELECT parent_species_a, parent_species_b, result_species_id, candy_cost, deterministic, weight
     FROM fusion_rules
     WHERE (parent_species_a = ? AND parent_species_b = ?) OR (parent_species_a = ? AND parent_species_b = ?)`,
    [parentSpeciesA, parentSpeciesB, parentSpeciesB, parentSpeciesA]
  );
  return (rows ?? []).map((r) => ({
    parentSpeciesA: r.parent_species_a,
    parentSpeciesB: r.parent_species_b,
    resultSpeciesId: r.result_species_id,
    candyCost: r.candy_cost,
    deterministic: r.deterministic !== 0,
    weight: r.weight,
  }));
}

/**
 * Create tables if they don't exist.
 * - species, slimes, fusion_rules, sleep_sessions, candies_state, zones, spawn_table_entries
 */
async function ensureSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  // Migrate old table name: zone_spawn_weights -> spawn_table_entries
  try {
    await database.runAsync('ALTER TABLE zone_spawn_weights RENAME TO spawn_table_entries');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Ignore if old table does not exist; rethrow other errors.
    if (!/no such table/i.test(msg)) throw e;
  }

  await database.execAsync(`
    -- Species: template for each slime type (Color, Nature, Tech sets, etc.)
    CREATE TABLE IF NOT EXISTS species (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      set_id TEXT NOT NULL,
      tier INTEGER NOT NULL,
      fusion_only INTEGER NOT NULL DEFAULT 0,
      recipe_key TEXT
    );

    -- Slimes: player's collection (each row = one slime instance)
    CREATE TABLE IF NOT EXISTS slimes (
      id TEXT PRIMARY KEY NOT NULL,
      species_id TEXT NOT NULL,
      variant TEXT NOT NULL DEFAULT 'standard',
      level INTEGER NOT NULL DEFAULT 1,
      equipped_nights INTEGER NOT NULL DEFAULT 0,
      nickname TEXT,
      acquired_at INTEGER NOT NULL,
      source TEXT,
      FOREIGN KEY (species_id) REFERENCES species(id)
    );

    -- Key-value player settings (equipped slime, etc.)
    CREATE TABLE IF NOT EXISTS player_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    -- Fusion rules: (parent_a, parent_b) -> result species, candy cost, optional weight for probability
    CREATE TABLE IF NOT EXISTS fusion_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_species_a TEXT NOT NULL,
      parent_species_b TEXT NOT NULL,
      result_species_id TEXT NOT NULL,
      candy_cost INTEGER NOT NULL,
      deterministic INTEGER NOT NULL DEFAULT 1,
      weight INTEGER,
      FOREIGN KEY (result_species_id) REFERENCES species(id)
    );

    -- Sleep sessions: for streaks and candy calculation
    CREATE TABLE IF NOT EXISTS sleep_sessions (
      id TEXT PRIMARY KEY NOT NULL,
      zone_id TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      duration_hours REAL NOT NULL,
      quality REAL NOT NULL,
      candies_earned INTEGER NOT NULL
    );

    -- Candies: single-row persisted balance
    CREATE TABLE IF NOT EXISTS candies_state (
      id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1),
      total INTEGER NOT NULL,
      last_updated_at INTEGER NOT NULL
    );

    -- Zones: master list (id, name, blurb, unlocked_by_default)
    CREATE TABLE IF NOT EXISTS zones (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      blurb TEXT NOT NULL,
      unlocked_by_default INTEGER NOT NULL DEFAULT 0
    );

    -- Per-zone spawn weights: which species can spawn in which zone, with weight
    CREATE TABLE IF NOT EXISTS spawn_table_entries (
      zone_id TEXT NOT NULL,
      species_id TEXT NOT NULL,
      weight INTEGER NOT NULL,
      PRIMARY KEY (zone_id, species_id),
      FOREIGN KEY (zone_id) REFERENCES zones(id),
      FOREIGN KEY (species_id) REFERENCES species(id)
    );

    CREATE INDEX IF NOT EXISTS idx_slimes_species ON slimes(species_id);
    CREATE INDEX IF NOT EXISTS idx_sleep_sessions_started ON sleep_sessions(started_at);
    CREATE INDEX IF NOT EXISTS idx_spawn_table_entries_zone ON spawn_table_entries(zone_id);
  `);

  try {
    await database.runAsync('ALTER TABLE zones RENAME COLUMN effect TO blurb');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/no such column|duplicate column name/i.test(msg)) throw e;
  }

  // Add weight column to fusion_rules if missing (existing DBs created before this refactor)
  try {
    await database.runAsync('ALTER TABLE fusion_rules ADD COLUMN weight INTEGER');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/duplicate column name/i.test(msg)) throw e;
  }

  try {
    await database.runAsync(
      `ALTER TABLE slimes ADD COLUMN variant TEXT NOT NULL DEFAULT '${DEFAULT_SLIME_VARIANT}'`
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/duplicate column name/i.test(msg)) throw e;
  }

  try {
    await database.runAsync('ALTER TABLE slimes ADD COLUMN level INTEGER NOT NULL DEFAULT 1');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/duplicate column name/i.test(msg)) throw e;
  }

  try {
    await database.runAsync(
      'ALTER TABLE slimes ADD COLUMN equipped_nights INTEGER NOT NULL DEFAULT 0'
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/duplicate column name/i.test(msg)) throw e;
  }

  try {
    await database.runAsync('ALTER TABLE slimes ADD COLUMN nickname TEXT');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/duplicate column name/i.test(msg)) throw e;
  }

  await ensureFavoritedColumn(database);

  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS player_settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS slimepedia_discoveries (
      species_id TEXT PRIMARY KEY NOT NULL,
      discovered_at INTEGER NOT NULL,
      FOREIGN KEY (species_id) REFERENCES species(id)
    );

    CREATE TABLE IF NOT EXISTS fusion_completions (
      parent_species_a TEXT NOT NULL,
      parent_species_b TEXT NOT NULL,
      result_species_id TEXT NOT NULL,
      completed_at INTEGER NOT NULL,
      PRIMARY KEY (parent_species_a, parent_species_b, result_species_id),
      FOREIGN KEY (result_species_id) REFERENCES species(id)
    );
  `);

  await backfillSlimepediaDiscoveries(database);
}

/**
 * Seed all master data into the DB. Idempotent; safe to run on every app start.
 * Single transaction for speed and to avoid UNIQUE/race issues.
 */
async function seedFromMasterData(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.withTransactionAsync(async () => {
    for (const s of Object.values(SPECIES) as Species[]) {
      await database.runAsync(
        `INSERT OR REPLACE INTO species (id, name, set_id, tier, fusion_only, recipe_key)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [s.id, s.name, s.setId, s.tier, s.fusionOnly ? 1 : 0, s.recipeKey ?? null]
      );
    }
    for (const z of Object.values(ZONES)) {
      await database.runAsync(
        `INSERT OR REPLACE INTO zones (id, name, blurb, unlocked_by_default)
         VALUES (?, ?, ?, ?)`,
        [z.id, z.name, z.blurb, z.unlockedByDefault ? 1 : 0]
      );
    }
    const validZoneIds = Object.values(ZONES).map((z) => z.id);
    if (validZoneIds.length > 0) {
      const placeholders = validZoneIds.map(() => '?').join(', ');
      await database.runAsync(
        `DELETE FROM spawn_table_entries WHERE zone_id NOT IN (${placeholders})`,
        validZoneIds
      );
      await database.runAsync(
        `DELETE FROM zones WHERE id NOT IN (${placeholders})`,
        validZoneIds
      );
    }
    await database.runAsync('DELETE FROM fusion_rules');
    for (const r of FUSION_RULES_MASTER) {
      await database.runAsync(
        `INSERT INTO fusion_rules (parent_species_a, parent_species_b, result_species_id, candy_cost, deterministic, weight)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          r.parentSpeciesA,
          r.parentSpeciesB,
          r.resultSpeciesId,
          r.candyCost,
          r.deterministic ? 1 : 0,
          r.weight,
        ]
      );
    }
    await database.runAsync('DELETE FROM spawn_table_entries');
    const seen = new Set<string>();
    for (const row of SPAWN_TABLES_MASTER) {
      const key = `${row.zoneId}\0${row.speciesId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      await database.runAsync(
        `INSERT OR REPLACE INTO spawn_table_entries (zone_id, species_id, weight) VALUES (?, ?, ?)`,
        [row.zoneId, row.speciesId, row.weight]
      );
    }
  });
}

/**
 * Dev helper: reconcile species/slimes/fusion_rules with master data without resetting other tables.
 * - Deletes slimes whose species was removed from SPECIES.
 * - Deletes species no longer in SPECIES.
 * - Re-upserts all species from SPECIES.
 * - Rebuilds fusion_rules from FUSION_RULES_MASTER.
 */
export async function rebuildSpeciesSlimesAndFusion(): Promise<void> {
  const database = await getDb();
  await database.withTransactionAsync(async () => {
    const validSpeciesIds = (Object.values(SPECIES) as Species[]).map((s) => s.id);
    if (validSpeciesIds.length > 0) {
      const placeholders = validSpeciesIds.map(() => '?').join(', ');
      await database.runAsync(
        `DELETE FROM slimes WHERE species_id NOT IN (${placeholders})`,
        validSpeciesIds
      );
      await database.runAsync(
        `DELETE FROM species WHERE id NOT IN (${placeholders})`,
        validSpeciesIds
      );
    } else {
      await database.runAsync('DELETE FROM slimes');
      await database.runAsync('DELETE FROM species');
    }

    for (const s of Object.values(SPECIES) as Species[]) {
      await database.runAsync(
        `INSERT OR REPLACE INTO species (id, name, set_id, tier, fusion_only, recipe_key)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [s.id, s.name, s.setId, s.tier, s.fusionOnly ? 1 : 0, s.recipeKey ?? null]
      );
    }

    await database.runAsync('DELETE FROM fusion_rules');
    for (const r of FUSION_RULES_MASTER) {
      await database.runAsync(
        `INSERT INTO fusion_rules (parent_species_a, parent_species_b, result_species_id, candy_cost, deterministic, weight)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          r.parentSpeciesA,
          r.parentSpeciesB,
          r.resultSpeciesId,
          r.candyCost,
          r.deterministic ? 1 : 0,
          r.weight,
        ]
      );
    }

    // Rebuild spawn_table_entries from SPAWN_TABLES_MASTER so spawns stay in sync
    // with current master data (and implicitly, current species).
    await database.runAsync('DELETE FROM spawn_table_entries');
    const seen = new Set<string>();
    for (const row of SPAWN_TABLES_MASTER) {
      const key = `${row.zoneId}\0${row.speciesId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      await database.runAsync(
        `INSERT OR REPLACE INTO spawn_table_entries (zone_id, species_id, weight) VALUES (?, ?, ?)`,
        [row.zoneId, row.speciesId, row.weight]
      );
    }
  });
}

/**
 * Close the database (e.g. on app background). Re-open with getDb() when needed.
 */
export async function closeDb(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    initPromise = null;
  }
}
