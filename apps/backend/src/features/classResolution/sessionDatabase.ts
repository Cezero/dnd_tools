import Database from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const SESSION_DB_PATH = process.env.SESSION_DATABASE_URL ||
  path.join(process.cwd(), 'data', 'sessions.db');

// Ensure data directory exists
const dataDir = path.dirname(SESSION_DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/**
 * Initialize the unified SQLite session database for all entity types.
 * Creates the database file and unified table schema if they don't exist.
 * Enables WAL mode for better concurrency.
 * 
 * **Unified Table**: All entity types (class, race, character) use the same
 * `edit_sessions` table, distinguished by the `entity_type` column.
 */
export function initializeUnifiedSessionDatabase(): DatabaseType {
  const db = new Database(SESSION_DB_PATH);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Create unified edit_sessions table if it doesn't exist
  // Note: resolved_result is only used for character sessions, NULL for class/race
  db.exec(`
    CREATE TABLE IF NOT EXISTS edit_sessions (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('class', 'race', 'character')),
      entity_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      session_key TEXT NOT NULL,
      session_state TEXT NOT NULL,
      resolved_result TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      UNIQUE(entity_type, entity_id, user_id)
    );
    
    CREATE INDEX IF NOT EXISTS idx_edit_sessions_entity_type ON edit_sessions(entity_type);
    CREATE INDEX IF NOT EXISTS idx_edit_sessions_session_key ON edit_sessions(entity_type, session_key);
    CREATE INDEX IF NOT EXISTS idx_edit_sessions_expires_at ON edit_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_edit_sessions_entity_user ON edit_sessions(entity_type, entity_id, user_id);
    
    -- Legacy progression and entity tables (still used for feature progression storage)
    CREATE TABLE IF NOT EXISTS class_session_progressions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      feature_id INTEGER,
      level INTEGER,
      source_type INTEGER,
      edition_id INTEGER,
      domain_id INTEGER,
      feat_id INTEGER,
      companion_id INTEGER,
      is_new INTEGER NOT NULL DEFAULT 1,
      mysql_id INTEGER,
      progression_data TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES edit_sessions(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_class_progression_session ON class_session_progressions(session_id);
    CREATE INDEX IF NOT EXISTS idx_class_progression_mysql_id ON class_session_progressions(mysql_id);
    
    CREATE TABLE IF NOT EXISTS class_session_entities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      progression_id INTEGER NOT NULL,
      type INTEGER NOT NULL,
      applies_to INTEGER NOT NULL,
      applies_to_id INTEGER,
      applies_to_sub_id INTEGER,
      value INTEGER NOT NULL DEFAULT 0,
      bonus_type INTEGER,
      grouping_id INTEGER NOT NULL DEFAULT 0,
      display_in_detail INTEGER NOT NULL DEFAULT 0,
      filter_type INTEGER,
      formula_params_id INTEGER,
      entity_data TEXT,
      is_new INTEGER NOT NULL DEFAULT 1,
      mysql_id INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES edit_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (progression_id) REFERENCES class_session_progressions(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_class_entity_session ON class_session_entities(session_id);
    CREATE INDEX IF NOT EXISTS idx_class_entity_progression ON class_session_entities(progression_id);
    CREATE INDEX IF NOT EXISTS idx_class_entity_mysql_id ON class_session_entities(mysql_id);
    
    CREATE TABLE IF NOT EXISTS race_session_progressions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      feature_id INTEGER,
      level INTEGER,
      source_type INTEGER,
      edition_id INTEGER,
      domain_id INTEGER,
      feat_id INTEGER,
      companion_id INTEGER,
      is_new INTEGER NOT NULL DEFAULT 1,
      mysql_id INTEGER,
      progression_data TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES edit_sessions(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_race_progression_session ON race_session_progressions(session_id);
    CREATE INDEX IF NOT EXISTS idx_race_progression_mysql_id ON race_session_progressions(mysql_id);
    
    CREATE TABLE IF NOT EXISTS race_session_entities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      progression_id INTEGER NOT NULL,
      type INTEGER NOT NULL,
      applies_to INTEGER NOT NULL,
      applies_to_id INTEGER,
      applies_to_sub_id INTEGER,
      value INTEGER NOT NULL DEFAULT 0,
      bonus_type INTEGER,
      grouping_id INTEGER NOT NULL DEFAULT 0,
      display_in_detail INTEGER NOT NULL DEFAULT 0,
      filter_type INTEGER,
      formula_params_id INTEGER,
      entity_data TEXT,
      is_new INTEGER NOT NULL DEFAULT 1,
      mysql_id INTEGER,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES edit_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY (progression_id) REFERENCES race_session_progressions(id) ON DELETE CASCADE
    );
    
    CREATE INDEX IF NOT EXISTS idx_race_entity_session ON race_session_entities(session_id);
    CREATE INDEX IF NOT EXISTS idx_race_entity_progression ON race_session_entities(progression_id);
    CREATE INDEX IF NOT EXISTS idx_race_entity_mysql_id ON race_session_entities(mysql_id);
  `);

  return db;
}

/**
 * Get or initialize the unified session database.
 * Returns a singleton database instance.
 * 
 * **Unified Database**: All entity types (class, race, character) use the same
 * database instance and unified `edit_sessions` table.
 */
let unifiedSessionDbInstance: DatabaseType | null = null;

export function getUnifiedSessionDatabase(): DatabaseType {
  if (!unifiedSessionDbInstance) {
    unifiedSessionDbInstance = initializeUnifiedSessionDatabase();
  }
  return unifiedSessionDbInstance;
}

/**
 * @deprecated Use getUnifiedSessionDatabase() instead.
 * Kept for backward compatibility during migration.
 */
export function getClassSessionDatabase(): DatabaseType {
  return getUnifiedSessionDatabase();
}

/**
 * Close the unified session database connection.
 * Should be called on application shutdown.
 */
export function closeUnifiedSessionDatabase(): void {
  if (unifiedSessionDbInstance) {
    unifiedSessionDbInstance.close();
    unifiedSessionDbInstance = null;
  }
}

/**
 * @deprecated Use closeUnifiedSessionDatabase() instead.
 * Kept for backward compatibility during migration.
 */
export function closeClassSessionDatabase(): void {
  closeUnifiedSessionDatabase();
}
