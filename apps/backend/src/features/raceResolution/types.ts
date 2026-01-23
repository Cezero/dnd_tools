import type { RaceEditState } from '@shared/schema';
import { RaceUpdateType } from '@shared/static-data';

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
 * Race session stored in Redis
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

/**
 * Discriminated union type for race update operations.
 * Used by the update applier system to apply updates to race edit state.
 */
export type RaceUpdate =
    | { type: typeof RaceUpdateType.LinkFeature; payload: { featureId: number } }
    | { type: typeof RaceUpdateType.UnlinkFeature; payload: { featureId: number } }
    | { type: typeof RaceUpdateType.UpdateRaceField; payload: { field: string; value: unknown } };
