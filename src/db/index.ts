/**
 * SQLite database for Sleepy Slimes.
 * PRD: Relational storage for fusion logic, species, and collection.
 * Schema is minimal baseline; fusion rules and species data will be populated later.
 */

import * as SQLite from 'expo-sqlite';

const DB_NAME = 'sleepy_slimes.db';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Get or create the app database. Call once at app init (e.g. in root layout).
 */
export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db;
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await ensureSchema(db);
  return db;
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
