import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import type { CharacterEditState, ResolutionResult } from './types';
import type { CharacterWithAllDetailsResponse } from '@shared/schema';
import { getSessionDatabase } from './sessionDatabase';

/**
 * Extended resolution result with derived data for frontend
 */
export interface ResolvedCharacterResult extends ResolutionResult {
    classSkills: Array<{ skillId: number; skillSubId: number | null }>;
    skillBonuses: Array<{ skillId: number; skillSubId: number | null; bonus: number; source: string }>;
    grantedFeats: number[];
    availableFeats: number;
    availableFighterBonusFeats: number;
    sessionId: string;
}

/**
 * Character session stored in SQLite
 */
interface CharacterSession {
    id: string;
    characterId: number;
    userId: number;
    sessionKey: string;
    characterState: CharacterEditState;
    resolvedResult: ResolvedCharacterResult;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
}

/**
 * Service for managing character editing sessions in SQLite.
 * 
 * Provides persistent session storage using better-sqlite3 for lightweight,
 * on-disk database operations. Sessions survive backend restarts and automatically
 * expire after a configurable period of inactivity.
 * 
 * Features:
 * - Automatic cleanup of expired sessions
 * - Session state persistence (character edits, resolved features)
 * - Per-user, per-character session isolation
 * - WAL mode for concurrent access
 */
export class CharacterSessionService {
    private db: Database;
    private cleanupInterval: NodeJS.Timeout | null = null;
    private readonly SESSION_TTL_MS = (parseInt(process.env.SESSION_EXPIRATION_MINUTES || '30') * 60 * 1000);

    constructor(db?: Database) {
        this.db = db || getSessionDatabase();
        // Run cleanup every 5 minutes
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredSessions().catch(console.error);
        }, 5 * 60 * 1000);
    }

    /**
     * Retrieves an active session for a character and user.
     * 
     * Only returns sessions that have not expired. Returns null if no active session exists.
     */
    getSession(characterId: number, userId: number): CharacterSession | null {
        const sessionKey = `${characterId}:${userId}`;
        const row = this.db.prepare(`
            SELECT * FROM character_edit_sessions 
            WHERE session_key = ? AND expires_at > ?
        `).get(sessionKey, Date.now()) as any;

        if (!row) return null;

        return {
            id: row.id,
            characterId: row.character_id,
            userId: row.user_id,
            sessionKey: row.session_key,
            characterState: JSON.parse(row.character_state),
            resolvedResult: JSON.parse(row.resolved_result),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            expiresAt: new Date(row.expires_at)
        };
    }

    /**
     * Retrieves a session by its unique session ID.
     * 
     * Only returns sessions that have not expired. Returns null if session not found or expired.
     */
    getSessionById(sessionId: string): CharacterSession | null {
        const row = this.db.prepare(`
            SELECT * FROM character_edit_sessions 
            WHERE id = ? AND expires_at > ?
        `).get(sessionId, Date.now()) as any;

        if (!row) return null;

        return {
            id: row.id,
            characterId: row.character_id,
            userId: row.user_id,
            sessionKey: row.session_key,
            characterState: JSON.parse(row.character_state),
            resolvedResult: JSON.parse(row.resolved_result),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            expiresAt: new Date(row.expires_at)
        };
    }

    /**
     * Creates a new editing session for a character.
     * 
     * If an existing session exists for this character/user combination, it is deleted first.
     * The new session is assigned a unique ID and expiration time.
     */
    async createSession(
        character: CharacterWithAllDetailsResponse,
        userId: number,
        characterState: CharacterEditState,
        resolvedResult: ResolvedCharacterResult
    ): Promise<CharacterSession> {
        const sessionKey = `${character.id}:${userId}`;
        const now = Date.now();
        const expiresAt = now + this.SESSION_TTL_MS;

        // Delete any existing session for this character/user
        this.db.prepare('DELETE FROM character_edit_sessions WHERE session_key = ?').run(sessionKey);

        const session: CharacterSession = {
            id: uuidv4(),
            characterId: character.id,
            userId,
            sessionKey,
            characterState,
            resolvedResult,
            createdAt: new Date(now),
            updatedAt: new Date(now),
            expiresAt: new Date(expiresAt)
        };

        this.db.prepare(`
            INSERT INTO character_edit_sessions 
            (id, character_id, user_id, session_key, character_state, resolved_result, created_at, updated_at, expires_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            session.id,
            session.characterId,
            session.userId,
            session.sessionKey,
            JSON.stringify(session.characterState),
            JSON.stringify(session.resolvedResult),
            now,
            now,
            expiresAt
        );

        return session;
    }

    /**
     * Updates an existing session with new character state and resolution results.
     * 
     * Extends the session expiration time on each update. Throws an error if the session doesn't exist.
     */
    /**
     * Updates an existing session with new character state and resolved result.
     * 
     * **Spell Operation Integration**:
     * This method is called by `characterService.addSpellKnown()` and `removeSpellKnown()`
     * when an active resolution session exists. After a spell is added or removed:
     * 1. The character state is rebuilt from the updated character (including new/removed spells)
     * 2. Features are re-resolved using `CharacterResolutionService.resolveCharacterFeatures()`
     * 3. This method updates the session with the new character state and resolved result
     * 4. The session expiration time is extended
     * 
     * This ensures that the resolution session stays synchronized with the character's
     * spell state, allowing subsequent spell operations to use the updated resolved
     * progressions for validation.
     * 
     * @param sessionKey - The session key (characterId:userId) to update
     * @param characterState - Updated character edit state (includes new/removed spells)
     * @param resolvedResult - Updated resolved character result (includes new resolved progressions)
     * @throws Error if the session is not found
     * 
     * @see characterService.addSpellKnown - Calls this after adding a spell
     * @see characterService.removeSpellKnown - Calls this after removing a spell
     * @see CharacterResolutionService.resolveCharacterFeatures - Re-resolves features after spell changes
     */
    async updateSession(
        sessionKey: string,
        characterState: CharacterEditState,
        resolvedResult: ResolvedCharacterResult
    ): Promise<void> {
        const now = Date.now();
        const expiresAt = now + this.SESSION_TTL_MS; // Extend expiration

        const result = this.db.prepare(`
            UPDATE character_edit_sessions 
            SET character_state = ?, resolved_result = ?, updated_at = ?, expires_at = ?
            WHERE session_key = ?
        `).run(
            JSON.stringify(characterState),
            JSON.stringify(resolvedResult),
            now,
            expiresAt,
            sessionKey
        );

        if (result.changes === 0) {
            throw new Error(`Session not found: ${sessionKey}`);
        }
    }

    /**
     * Deletes a session by its session key (characterId:userId).
     * 
     * Silently succeeds if the session doesn't exist.
     */
    async deleteSession(sessionKey: string): Promise<void> {
        this.db.prepare('DELETE FROM character_edit_sessions WHERE session_key = ?').run(sessionKey);
    }

    /**
     * Deletes a session by its unique session ID.
     * 
     * Silently succeeds if the session doesn't exist.
     */
    async deleteSessionById(sessionId: string): Promise<void> {
        this.db.prepare('DELETE FROM character_edit_sessions WHERE id = ?').run(sessionId);
    }

    /**
     * Removes all expired sessions from the database.
     * 
     * Called automatically every 5 minutes by the cleanup interval.
     * 
     * @returns Number of sessions deleted
     */
    async cleanupExpiredSessions(): Promise<number> {
        const result = this.db.prepare('DELETE FROM character_edit_sessions WHERE expires_at < ?').run(Date.now());
        return result.changes;
    }

    /**
     * Cleans up the service by stopping the cleanup interval.
     * 
     * Note: Does not close the database connection as it's a singleton
     * that should remain open for the application lifetime.
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        // Note: We don't close the database here as it's a singleton
        // The database should be closed at application shutdown
    }
}

