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
 * Initialize the SQLite session database
 * Creates the database file and table schema if they don't exist
 * Enables WAL mode for better concurrency
 */
export function initializeSessionDatabase(): DatabaseType {
  const db = new Database(SESSION_DB_PATH);

  // Enable WAL mode for better concurrency
  db.pragma('journal_mode = WAL');

  // Create sessions table if it doesn't exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS character_edit_sessions (
      id TEXT PRIMARY KEY,
      character_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      session_key TEXT UNIQUE NOT NULL,
      character_state TEXT NOT NULL,
      resolved_result TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    
    CREATE INDEX IF NOT EXISTS idx_session_key ON character_edit_sessions(session_key);
    CREATE INDEX IF NOT EXISTS idx_expires_at ON character_edit_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_character_user ON character_edit_sessions(character_id, user_id);
  `);

  return db;
}

/**
 * Get or initialize the session database
 * Returns a singleton database instance
 */
let sessionDbInstance: DatabaseType | null = null;

export function getSessionDatabase(): DatabaseType {
  if (!sessionDbInstance) {
    sessionDbInstance = initializeSessionDatabase();
  }
  return sessionDbInstance;
}

/**
 * Close the session database connection
 * Should be called on application shutdown
 */
export function closeSessionDatabase(): void {
  if (sessionDbInstance) {
    sessionDbInstance.close();
    sessionDbInstance = null;
  }
}










