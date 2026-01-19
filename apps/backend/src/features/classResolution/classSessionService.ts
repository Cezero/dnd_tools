import type { ClassEditState, ClassSession } from './types';
import { GenericSessionService } from '../shared/session/GenericSessionService';

/**
 * Service for managing class editing sessions in Redis.
 * 
 * **Implementation Note**: This class is a thin wrapper around `GenericSessionService`
 * that provides Class-specific configuration. All session operations are delegated
 * to the generic service.
 * 
 * Provides persistent session storage using Redis for scalable,
 * in-memory database operations. Sessions survive backend restarts and automatically
 * expire after a configurable period of inactivity using Redis TTL.
 * 
 * Features:
 * - Automatic expiration via Redis TTL (no manual cleanup needed)
 * - Session state persistence (class edits, feature progressions)
 * - Per-user, per-class session isolation
 * - High-performance in-memory storage
 * 
 * @see GenericSessionService - Generic implementation
 */
export class ClassSessionService {
    private genericService: GenericSessionService<number, ClassEditState>;

    constructor() {
        this.genericService = new GenericSessionService<number, ClassEditState>({
            entityType: 'class',
            buildSessionKey: (classId, userId) => `${classId}:${userId}`
        });
    }

    /**
     * Gets the underlying generic session service.
     * Used by the generic controller to access session operations.
     */
    getGenericService(): GenericSessionService<number, ClassEditState> {
        return this.genericService;
    }

    /**
     * Retrieves an active session for a class and user.
     * 
     * Only returns sessions that have not expired. Returns null if no active session exists.
     */
    async getSession(classId: number, userId: number): Promise<ClassSession | null> {
        const session = await this.genericService.getSession(classId, userId);
        if (!session) return null;

        return {
            id: session.id,
            classId: session.entityId,
            userId: session.userId,
            sessionKey: session.sessionKey,
            classState: session.state,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            expiresAt: session.expiresAt
        };
    }

    /**
     * Retrieves a session by its unique session ID.
     * 
     * Only returns sessions that have not expired. Returns null if session not found or expired.
     */
    async getSessionById(sessionId: string): Promise<ClassSession | null> {
        const session = await this.genericService.getSessionById(sessionId);
        if (!session) return null;

        return {
            id: session.id,
            classId: session.entityId,
            userId: session.userId,
            sessionKey: session.sessionKey,
            classState: session.state,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            expiresAt: session.expiresAt
        };
    }

    /**
     * Creates a new editing session for a class.
     * 
     * If an existing session exists for this class/user combination, it is deleted first.
     * The new session is assigned a unique ID and expiration time.
     */
    async createSession(
        classId: number,
        userId: number,
        classState: ClassEditState
    ): Promise<ClassSession> {
        const session = await this.genericService.createSession(classId, userId, classState);

        return {
            id: session.id,
            classId: session.entityId,
            userId: session.userId,
            sessionKey: session.sessionKey,
            classState: session.state,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            expiresAt: session.expiresAt
        };
    }

    /**
     * Updates an existing session with new class state.
     * 
     * Extends the session expiration time on each update. Throws an error if the session doesn't exist.
     */
    async updateSession(
        sessionKey: string,
        classState: ClassEditState
    ): Promise<void> {
        return this.genericService.updateSession(sessionKey, classState);
    }

    /**
     * Deletes a session by its session key (classId:userId).
     * 
     * Silently succeeds if the session doesn't exist.
     */
    async deleteSession(sessionKey: string): Promise<void> {
        return this.genericService.deleteSession(sessionKey);
    }

    /**
     * Deletes a session by its unique session ID.
     * 
     * Silently succeeds if the session doesn't exist.
     */
    async deleteSessionById(sessionId: string): Promise<void> {
        return this.genericService.deleteSessionById(sessionId);
    }

    /**
     * Removes all expired sessions from the database.
     * 
     * Called automatically every 5 minutes by the cleanup interval.
     * 
     * @returns Number of sessions deleted
     */
    async cleanupExpiredSessions(): Promise<number> {
        return this.genericService.cleanupExpiredSessions();
    }

    /**
     * Cleans up the service by stopping the cleanup interval.
     * 
     * Note: Does not close the database connection as it's a singleton
     * that should remain open for the application lifetime.
     */
    destroy(): void {
        this.genericService.destroy();
    }
}
