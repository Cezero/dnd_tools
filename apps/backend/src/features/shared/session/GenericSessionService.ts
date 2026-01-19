import { v4 as uuidv4 } from 'uuid';

import { getRedisClient } from './redisClient';
import type { RedisSessionClient } from './types';
import type { Session, SessionConfig, EntityType } from './types';

/**
 * Generic session service for managing entity editing sessions in Redis.
 * 
 * Provides persistent session storage using Redis for scalable,
 * in-memory database operations. Sessions survive backend restarts and automatically
 * expire after a configurable period of inactivity using Redis TTL.
 * 
 * **Generic Type Parameters**:
 * - `TEntityId`: The type of the entity ID (must extend number)
 * - `TState`: The type of the session state (must be JSON-serializable)
 * 
 * **Features**:
 * - Automatic expiration via Redis TTL (no manual cleanup needed)
 * - Session state persistence (entity edits, resolved features)
 * - Per-user, per-entity session isolation
 * - High-performance in-memory storage
 * 
 * **Configuration**:
 * The service is configured via `SessionConfig` which specifies:
 * - Entity type discriminator ('class', 'race', or 'character')
 * - Session key builder function
 * 
 * **Redis Key Patterns**:
 * - By session key: `session:{entityType}:{sessionKey}`
 * - By session ID: `session:{entityType}:id:{sessionId}`
 * - Index: `session:{entityType}:index:{sessionKey}` → `{sessionId}` (for reverse lookup)
 * 
 * **Usage Example**:
 * ```typescript
 * const config: SessionConfig<number, ClassEditState> = {
 *   entityType: 'class',
 *   buildSessionKey: (classId, userId) => `${classId}:${userId}`
 * };
 * 
 * const service = new GenericSessionService(config);
 * const session = await service.createSession(classId, userId, initialState);
 * ```
 * 
 * **Session Lifecycle**:
 * 1. Session created when entity editing begins
 * 2. Session updated on each state change
 * 3. Session expires after inactivity period (handled by Redis TTL)
 * 4. Session saved to MySQL on explicit save
 * 5. Session deleted on cancel or after expiration
 * 
 * @template TEntityId - The entity ID type (must extend number)
 * @template TState - The session state type (must be JSON-serializable)
 * 
 * @see SessionConfig - Configuration interface
 * @see Session - Session data structure
 * 
 * @example
 * // Class session service
 * const classService = new GenericSessionService<number, ClassEditState>({
 *   entityType: 'class',
 *   buildSessionKey: (id, userId) => `${id}:${userId}`
 * });
 */

/**
 * Validates entity type to ensure it's a valid value.
 * 
 * @param entityType - The entity type to validate
 * @returns True if valid, false otherwise
 */
function isValidEntityType(entityType: string): entityType is EntityType {
    return entityType === 'class' || entityType === 'race' || entityType === 'character';
}

/**
 * Builds Redis key for session by session key.
 */
function buildSessionKey(entityType: EntityType, sessionKey: string): string {
    return `session:${entityType}:${sessionKey}`;
}

/**
 * Builds Redis key for session by session ID.
 */
function buildSessionIdKey(entityType: EntityType, sessionId: string): string {
    return `session:${entityType}:id:${sessionId}`;
}

/**
 * Builds Redis key for session index (reverse lookup from sessionKey to sessionId).
 */
function buildSessionIndexKey(entityType: EntityType, sessionKey: string): string {
    return `session:${entityType}:index:${sessionKey}`;
}

export class GenericSessionService<TEntityId extends number, TState> {
    private redis: RedisSessionClient;
    private config: SessionConfig<TEntityId, TState>;
    private readonly SESSION_TTL_SECONDS: number;

    /**
     * Creates a new generic session service instance.
     * 
     * **Security Note**: Entity type from config is validated to ensure it's a valid value.
     * This value comes from trusted configuration, not user input.
     * 
     * **Redis Storage**: All sessions are stored in Redis with entity type prefixes
     * in the key names for organization and filtering.
     * 
     * @param config - Configuration for the session service
     * @throws Error if entity type is not valid
     */
    constructor(config: SessionConfig<TEntityId, TState>) {
        // Validate entity type
        if (!isValidEntityType(config.entityType)) {
            throw new Error(`Invalid entity type: ${config.entityType}. Must be 'class', 'race', or 'character'`);
        }

        this.config = config;
        this.redis = getRedisClient();
        const ttlMinutes = parseInt(process.env.SESSION_EXPIRATION_MINUTES || '30', 10);
        this.SESSION_TTL_SECONDS = ttlMinutes * 60;
    }

    /**
     * Retrieves an active session for an entity and user.
     * 
     * Only returns sessions that have not expired. Returns null if no active session exists.
     * Redis TTL automatically handles expiration checking.
     * 
     * **Session Key Format**: `{entityId}:{userId}`
     * 
     * **Expiration Check**: Redis TTL automatically removes expired keys
     * 
     * @param entityId - The entity ID to retrieve session for
     * @param userId - The user ID to retrieve session for
     * @returns Promise resolving to the active session, or null if no active session exists
     * 
     * @example
     * const session = await service.getSession(123, 456);
     * if (session) {
     *   console.log('Active session:', session.state);
     * }
     */
    async getSession(entityId: TEntityId, userId: number): Promise<Session<TEntityId, TState> | null> {
        const sessionKey = this.config.buildSessionKey(entityId, userId);
        const redisKey = buildSessionKey(this.config.entityType, sessionKey);

        return this.getSessionByRedisKey(redisKey);
    }

    /**
     * Retrieves a session by its unique session ID.
     * 
     * Only returns sessions that have not expired. Returns null if session not found or expired.
     * Redis TTL automatically handles expiration checking.
     * 
     * **Expiration Check**: Redis TTL automatically removes expired keys
     * 
     * @param sessionId - The unique session ID (UUID v4 format)
     * @returns The active session, or null if session not found or expired
     * 
     * @example
     * const session = service.getSessionById('550e8400-e29b-41d4-a716-446655440000');
     * if (session) {
     *   console.log('Session state:', session.state);
     * }
     */
    async getSessionById(sessionId: string): Promise<Session<TEntityId, TState> | null> {
        const redisKey = buildSessionIdKey(this.config.entityType, sessionId);
        return this.getSessionByRedisKey(redisKey);
    }

    /**
     * Internal helper to retrieve session by Redis key.
     * 
     * @param redisKey - The Redis key to retrieve
     * @returns The session, or null if not found or expired
     */
    private async getSessionByRedisKey(redisKey: string): Promise<Session<TEntityId, TState> | null> {
        const data = await this.redis.get(redisKey);
        if (!data) {
            return null;
        }

        const sessionData = JSON.parse(data);

        // Check if session has expired (backup check, though Redis TTL should handle this)
        if (sessionData.expiresAt && sessionData.expiresAt < Date.now()) {
            return null;
        }

        return {
            id: sessionData.id,
            entityId: sessionData.entityId as TEntityId,
            userId: sessionData.userId,
            sessionKey: sessionData.sessionKey,
            state: sessionData.state as TState,
            createdAt: new Date(sessionData.createdAt),
            updatedAt: new Date(sessionData.updatedAt),
            expiresAt: new Date(sessionData.expiresAt)
        };
    }

    /**
     * Creates a new editing session for an entity.
     * 
     * If an existing session exists for this entity/user combination, it is deleted first.
     * The new session is assigned a unique UUID v4 ID and expiration time based on SESSION_TTL_SECONDS.
     * 
     * **Session Expiration**: Sessions expire after SESSION_TTL_SECONDS (default: 30 minutes)
     * 
     * **State Serialization**: Session state is JSON-serialized before storage
     * 
     * **Redis Keys Created**:
     * - `session:{entityType}:{sessionKey}` - Main session data
     * - `session:{entityType}:id:{sessionId}` - Lookup by session ID
     * - `session:{entityType}:index:{sessionKey}` - Reverse lookup index
     * 
     * @param entityId - The entity ID to create session for
     * @param userId - The user ID to create session for
     * @param state - Initial session state (must be JSON-serializable)
     * @returns Promise resolving to the created session
     * 
     * @example
     * const initialState = { classId: 1, name: 'Fighter', ... };
     * const session = await service.createSession(1, 100, initialState);
     * console.log('Session ID:', session.id);
     */
    async createSession(
        entityId: TEntityId,
        userId: number,
        state: TState
    ): Promise<Session<TEntityId, TState>> {
        const sessionKey = this.config.buildSessionKey(entityId, userId);
        const now = Date.now();
        const expiresAt = now + (this.SESSION_TTL_SECONDS * 1000);

        // Delete any existing session for this entity/user
        await this.deleteSession(sessionKey);

        const session: Session<TEntityId, TState> = {
            id: uuidv4(),
            entityId,
            userId,
            sessionKey,
            state,
            createdAt: new Date(now),
            updatedAt: new Date(now),
            expiresAt: new Date(expiresAt)
        };

        // Prepare session data for storage
        const sessionData = {
            id: session.id,
            entityId: session.entityId,
            userId: session.userId,
            sessionKey: session.sessionKey,
            state: session.state,
            createdAt: now,
            updatedAt: now,
            expiresAt: now + (this.SESSION_TTL_SECONDS * 1000)
        };

        const sessionRedisKey = buildSessionKey(this.config.entityType, sessionKey);
        const sessionIdRedisKey = buildSessionIdKey(this.config.entityType, session.id);
        const indexRedisKey = buildSessionIndexKey(this.config.entityType, sessionKey);

        // Store session data in Redis with TTL
        await Promise.all([
            this.redis.setEx(sessionRedisKey, this.SESSION_TTL_SECONDS, JSON.stringify(sessionData)),
            this.redis.setEx(sessionIdRedisKey, this.SESSION_TTL_SECONDS, JSON.stringify(sessionData)),
            this.redis.setEx(indexRedisKey, this.SESSION_TTL_SECONDS, session.id)
        ]);

        return session;
    }

    /**
     * Updates an existing session with new state.
     * 
     * Extends the session expiration time on each update. Throws an error if the session doesn't exist.
     * 
     * **Expiration Extension**: Each update extends the session expiration by SESSION_TTL_SECONDS
     * 
     * **State Serialization**: Session state is JSON-serialized before storage
     * 
     * @param sessionKey - The session key (entityId:userId) to update
     * @param state - Updated session state (must be JSON-serializable)
     * @returns Promise resolving when update is complete
     * 
     * @throws Error if the session is not found (sessionKey doesn't exist)
     * 
     * @example
     * const updatedState = { ...currentState, name: 'Updated Name' };
     * await service.updateSession('1:100', updatedState);
     */
    async updateSession(
        sessionKey: string,
        state: TState
    ): Promise<void> {
        const redisKey = buildSessionKey(this.config.entityType, sessionKey);
        const existingData = await this.redis.get(redisKey);

        if (!existingData) {
            throw new Error(`Session not found: ${sessionKey}`);
        }

        const existingSession = JSON.parse(existingData);
        const now = Date.now();
        const expiresAt = now + (this.SESSION_TTL_SECONDS * 1000);

        const updatedSessionData = {
            ...existingSession,
            state,
            updatedAt: now,
            expiresAt
        };

        const sessionIdRedisKey = buildSessionIdKey(this.config.entityType, existingSession.id);

        // Update session data and extend TTL
        await Promise.all([
            this.redis.setEx(redisKey, this.SESSION_TTL_SECONDS, JSON.stringify(updatedSessionData)),
            this.redis.setEx(sessionIdRedisKey, this.SESSION_TTL_SECONDS, JSON.stringify(updatedSessionData))
        ]);
    }

    /**
     * Deletes a session by its session key (entityId:userId).
     * 
     * Silently succeeds if the session doesn't exist. This is safe to call even if
     * the session has already been deleted.
     * 
     * @param sessionKey - The session key (entityId:userId) to delete
     * @returns Promise resolving when deletion is complete
     * 
     * @example
     * await service.deleteSession('1:100');
     */
    async deleteSession(sessionKey: string): Promise<void> {
        const redisKey = buildSessionKey(this.config.entityType, sessionKey);
        const indexRedisKey = buildSessionIndexKey(this.config.entityType, sessionKey);

        // Get session ID from index for cleanup
        const sessionId = await this.redis.get(indexRedisKey);
        const sessionIdRedisKey = sessionId ? buildSessionIdKey(this.config.entityType, sessionId) : null;

        // Delete all related keys
        const keysToDelete = [redisKey, indexRedisKey];
        if (sessionIdRedisKey) {
            keysToDelete.push(sessionIdRedisKey);
        }

        if (keysToDelete.length > 0) {
            await this.redis.del(keysToDelete);
        }
    }

    /**
     * Deletes a session by its unique session ID.
     * 
     * Silently succeeds if the session doesn't exist. This is safe to call even if
     * the session has already been deleted or expired.
     * 
     * @param sessionId - The unique session ID (UUID v4 format) to delete
     * @returns Promise resolving when deletion is complete
     * 
     * @example
     * await service.deleteSessionById('550e8400-e29b-41d4-a716-446655440000');
     */
    async deleteSessionById(sessionId: string): Promise<void> {
        const sessionIdRedisKey = buildSessionIdKey(this.config.entityType, sessionId);
        const sessionData = await this.redis.get(sessionIdRedisKey);

        if (!sessionData) {
            return; // Session doesn't exist, silently succeed
        }

        const session = JSON.parse(sessionData);
        const sessionKey = session.sessionKey;

        // Delete all related keys
        const redisKey = buildSessionKey(this.config.entityType, sessionKey);
        const indexRedisKey = buildSessionIndexKey(this.config.entityType, sessionKey);

        await this.redis.del([redisKey, sessionIdRedisKey, indexRedisKey]);
    }

    /**
     * Removes all expired sessions from Redis.
     * 
     * **Note**: This method is kept for backward compatibility but is no longer needed.
     * Redis automatically removes expired keys using TTL. This method does nothing.
     * 
     * @returns Promise resolving to 0 (no manual cleanup needed)
     * 
     * @deprecated Redis TTL handles expiration automatically
     */
    async cleanupExpiredSessions(): Promise<number> {
        // Redis handles expiration automatically via TTL
        // No manual cleanup needed
        return 0;
    }

    /**
     * Cleans up the service.
     * 
     * **Note**: Redis connection is managed as a singleton and should remain open
     * for the application lifetime. This method does nothing but is kept for
     * backward compatibility.
     * 
     * **When to Call**: Typically called during application shutdown or in tests
     * 
     * @returns void
     * 
     * @example
     * // In test teardown
     * service.destroy();
     */
    destroy(): void {
        // Redis connection is managed as a singleton
        // No cleanup needed here
    }
}
