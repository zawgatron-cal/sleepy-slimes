/**
 * SQLite database for Sleepy Slimes.
 * PRD: Relational storage for fusion logic, species, and collection.
 * Schema is minimal baseline; fusion rules and species data will be populated later.
 */

import * as SQLite from 'expo-sqlite';
import type { SleepSession, Slime, Species, Zone, FusionRule, SpawnTableEntry } from '@/src/types';
import { SPECIES, ZONES, FUSION_RULES_MASTER, SPAWN_TABLES_MASTER } from '@/src/data';

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
 * Insert a slime into the DB (player inventory).
 */
export async function insertSlime(slime: Slime): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    'INSERT INTO slimes (id, species_id, acquired_at, source) VALUES (?, ?, ?, ?)',
    [slime.id, slime.speciesId, slime.acquiredAt, slime.source ?? null]
  );
}

/**
 * Delete a slime from the DB by id (e.g. consume during fusion).
 */
export async function deleteSlime(id: string): Promise<void> {
  const database = await getDb();
  await database.runAsync('DELETE FROM slimes WHERE id = ?', [id]);
}

/**
 * Fetch all slimes. For dev page and to hydrate collection store.
 */
export async function getSlimes(): Promise<Slime[]> {
  const database = await getDb();
  const rows = await database.getAllAsync<{
    id: string;
    species_id: string;
    acquired_at: number;
    source: string | null;
  }>('SELECT * FROM slimes ORDER BY acquired_at DESC');
  return (rows ?? []).map((r) => ({
    id: r.id,
    speciesId: r.species_id,
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
    effect: string;
    unlocked_by_default: number;
  }>('SELECT id, name, effect, unlocked_by_default FROM zones ORDER BY id');
  return (rows ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    effect: r.effect,
    unlockedByDefault: r.unlocked_by_default !== 0,
  }));
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
      acquired_at INTEGER NOT NULL,
      source TEXT,
      FOREIGN KEY (species_id) REFERENCES species(id)
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

    -- Zones: master list (id, name, effect, unlocked_by_default)
    CREATE TABLE IF NOT EXISTS zones (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      effect TEXT NOT NULL,
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

  // Add weight column to fusion_rules if missing (existing DBs created before this refactor)
  try {
    await database.runAsync('ALTER TABLE fusion_rules ADD COLUMN weight INTEGER');
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!/duplicate column name/i.test(msg)) throw e;
  }
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
        `INSERT OR REPLACE INTO zones (id, name, effect, unlocked_by_default)
         VALUES (?, ?, ?, ?)`,
        [z.id, z.name, z.effect, z.unlockedByDefault ? 1 : 0]
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
 * Close the database (e.g. on app background). Re-open with getDb() when needed.
 */
export async function closeDb(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
    initPromise = null;
  }
}
