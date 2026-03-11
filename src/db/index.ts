/**
 * SQLite database for Sleepy Slimes.
 * PRD: Relational storage for fusion logic, species, and collection.
 * Schema is minimal baseline; fusion rules and species data will be populated later.
 */

import * as SQLite from 'expo-sqlite';
import type { SleepSession, Slime, Species, ZoneId } from '@/src/types';

const DB_NAME = 'sleepy_slimes.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or create the app database. Call once at app init (e.g. in root layout).
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await ensureSchema(db);
  await seedSpeciesIfEmpty(db);
  return db;
}

/**
 * Seed a few species so we can spawn slimes. Idempotent.
 */
async function seedSpeciesIfEmpty(database: SQLite.SQLiteDatabase): Promise<void> {
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM species'
  );
  if (result && result.count > 0) return;

  // TEMPORARY: Seed species list for dev/spawn; replace with proper data or migration later.
  const species: Array<{ id: string; name: string; set_id: string; tier: number; fusion_only: number }> = [
    { id: 'green_slime', name: 'Green Slime', set_id: 'color', tier: 1, fusion_only: 0 },
    { id: 'pink_slime', name: 'Pink Slime', set_id: 'color', tier: 1, fusion_only: 0 },
    { id: 'blue_slime', name: 'Blue Slime', set_id: 'color', tier: 1, fusion_only: 0 },
  ];
  for (const s of species) {
    await database.runAsync(
      'INSERT OR IGNORE INTO species (id, name, set_id, tier, fusion_only) VALUES (?, ?, ?, ?, ?)',
      [s.id, s.name, s.set_id, s.tier, s.fusion_only]
    );
  }
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
    zoneId: r.zone_id as ZoneId,
    startedAt: r.started_at,
    endedAt: r.ended_at ?? undefined,
    durationHours: r.duration_hours,
    quality: r.quality,
    candiesEarned: r.candies_earned,
  }));
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
 * Create tables if they don't exist.
 * - species: hand-defined slime types (tier, set, fusion-only, recipe)
 * - slimes: player inventory (instance id, species_id, acquired_at, source)
 * - fusion_rules: (placeholder) deterministic or probabilistic fusion recipes
 * - sleep_sessions: history for streaks and candies
 */
async function ensureSchema(database: SQLite.SQLiteDatabase): Promise<void> {
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

    -- Placeholder for fusion logic: recipe_key or (parent_a, parent_b) -> result species / chance
    CREATE TABLE IF NOT EXISTS fusion_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_species_a TEXT NOT NULL,
      parent_species_b TEXT NOT NULL,
      result_species_id TEXT NOT NULL,
      candy_cost INTEGER NOT NULL,
      deterministic INTEGER NOT NULL DEFAULT 1,
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

    CREATE INDEX IF NOT EXISTS idx_slimes_species ON slimes(species_id);
    CREATE INDEX IF NOT EXISTS idx_sleep_sessions_started ON sleep_sessions(started_at);
  `);
}

/**
 * Close the database (e.g. on app background). Re-open with getDb() when needed.
 */
export async function closeDb(): Promise<void> {
  if (db) {
    await db.closeAsync();
    db = null;
  }
}
