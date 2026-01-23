import type { ClassEditState } from '@shared/schema';
import { ClassUpdateType } from '@shared/static-data';

/**
 * Database row structure for unified edit_sessions table (class type).
 * 
 * Note: Uses unified table with entity_type = 'class'.
 */
export interface ClassSessionRow {
    id: string;
    class_id: number;
    user_id: number;
    session_key: string;
    class_state: string;
    created_at: number;
    updated_at: number;
    expires_at: number;
}

/**
 * Class session stored in Redis
 */
export interface ClassSession {
    id: string;
    classId: number;
    userId: number;
    sessionKey: string;
    classState: ClassEditState;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
}

/**
 * Discriminated union type for class update operations.
 * Used by the update applier system to apply updates to class edit state.
 */
export type ClassUpdate =
    | { type: typeof ClassUpdateType.LinkFeature; payload: { featureId: number } }
    | { type: typeof ClassUpdateType.UnlinkFeature; payload: { featureId: number } }
    | { type: typeof ClassUpdateType.UpdateClassField; payload: { field: string; value: unknown } }
    | { type: typeof ClassUpdateType.SetSpellcastingProgression; payload: { progression: unknown } }
    | { type: typeof ClassUpdateType.SetSpellsKnownProgression; payload: { progression: unknown } };
