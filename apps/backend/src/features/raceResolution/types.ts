import type { RaceEditState, RaceUpdate } from '@shared/schema';

/**
 * Database row structure for unified edit_sessions table (race type).
 * 
 * Note: Uses unified table with entity_type = 'race'.
 */
export interface RaceSessionRow {
    id: string;
    race_id: number;
    user_id: number;
    session_key: string;
    race_state: string;
    created_at: number;
    updated_at: number;
    expires_at: number;
}

/**
 * Race session stored in SQLite
 */
export interface RaceSession {
    id: string;
    raceId: number;
    userId: number;
    sessionKey: string;
    raceState: RaceEditState;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
}

// Re-export shared types for convenience
export type { RaceEditState, RaceUpdate };
