import type { ClassEditState, ClassUpdate } from '@shared/schema';

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
 * Class session stored in SQLite
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

// Re-export shared types for convenience
export type { ClassEditState, ClassUpdate };
