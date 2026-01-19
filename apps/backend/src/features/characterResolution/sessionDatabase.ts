import type { Database as DatabaseType } from 'better-sqlite3';

import { getUnifiedSessionDatabase, closeUnifiedSessionDatabase } from '../classResolution/sessionDatabase';

/**
 * Initialize the unified SQLite session database.
 * Creates the database file and unified table schema if they don't exist.
 * Enables WAL mode for better concurrency.
 * 
 * **Note**: This function now delegates to the unified database initialization.
 * The unified `edit_sessions` table is created by `initializeUnifiedSessionDatabase()`.
 * 
 * @deprecated Use getUnifiedSessionDatabase() from classResolution/sessionDatabase instead.
 * Kept for backward compatibility.
 */
export function initializeSessionDatabase(): DatabaseType {
  return getUnifiedSessionDatabase();
}

/**
 * Get or initialize the unified session database.
 * Returns a singleton database instance.
 * 
 * **Unified Database**: Character sessions now use the unified `edit_sessions` table
 * along with class and race sessions.
 * 
 * @deprecated Use getUnifiedSessionDatabase() from classResolution/sessionDatabase instead.
 * Kept for backward compatibility.
 */
export function getSessionDatabase(): DatabaseType {
  return getUnifiedSessionDatabase();
}

/**
 * Close the unified session database connection.
 * Should be called on application shutdown.
 * 
 * @deprecated Use closeUnifiedSessionDatabase() from classResolution/sessionDatabase instead.
 * Kept for backward compatibility.
 */
export function closeSessionDatabase(): void {
  closeUnifiedSessionDatabase();
}










