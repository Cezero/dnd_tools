import type { DraftRefRequest } from '@shared/schema';

/**
 * Entity type discriminator for session storage.
 * 
 * Used to distinguish between different entity types in Redis session storage.
 */
export type EntityType = 'class' | 'race' | 'character';

/**
 * Request body type for entity operations (viewing, editing).
 * 
 * Used in API requests to specify which entity a user is viewing or editing.
 * 
 * @deprecated Use DraftRefRequest from @shared/schema instead
 */
export type EntityRefRequest = DraftRefRequest;

/**
 * Interface for Redis operations used by session services.
 * This is a narrow interface that abstracts over both RedisClientType and RedisClusterType.
 */
export interface RedisSessionClient {
    get(key: string): Promise<string | null>;
    setEx(key: string, seconds: number, value: string): Promise<string>;
    del(keys: string | string[]): Promise<number>;
    /**
     * Refresh TTL for an existing key.
     *
     * Implementations should delegate to the underlying Redis client's EXPIRE
     * operation and ignore the concrete return value. Callers do not depend
     * on the boolean/number result, only on side effects.
     */
    expire(key: string, seconds: number): Promise<void>;
    keys(pattern: string): Promise<string[]>;
    flushAll(): Promise<string>;
    quit(): Promise<void>;
}

/**
 * Configuration for generic session service.
 * 
 * Specifies entity type and session key builder function to customize the service
 * for different entity types. All sessions are stored in Redis with entity type
 * prefixes in the key names.
 * 
 * **Security Note**: Entity type is validated to ensure it's a valid value.
 * These values come from trusted configuration, not user input.
 * 
 * **Redis Storage**: All entity types use Redis with key patterns like
 * `session:{entityType}:{sessionKey}` for organization and filtering.
 * 
 * @template TEntityId - The entity ID type (must extend number)
 * @template TState - The session state type (must be JSON-serializable)
 * 
 * @example
 * ```typescript
 * const config: SessionConfig<number, ClassEditState> = {
 *   entityType: 'class',
 *   buildSessionKey: (classId, userId) => `${classId}:${userId}`
 * };
 * ```
 */
export interface SessionConfig<TEntityId extends number, TState> {
    /** Entity type discriminator ('class', 'race', or 'character') */
    entityType: EntityType;
    /** Function to build session key from entity ID and user ID */
    buildSessionKey: (entityId: TEntityId, userId: number) => string;
}

/**
 * Session data structure stored in Redis.
 * 
 * Represents a session with parsed state and Date objects.
 * This is the structure returned by GenericSessionService methods.
 * 
 * **State Serialization**: The state is stored as JSON in Redis
 * and parsed when retrieved. The state type must be JSON-serializable.
 * 
 * **Expiration**: Sessions expire after a configurable TTL (default: 30 minutes).
 * Redis automatically removes expired sessions using TTL.
 * 
 * @template TEntityId - The entity ID type (must extend number)
 * @template TState - The session state type (must be JSON-serializable)
 * 
 * @example
 * ```typescript
 * const session: Session<number, ClassEditState> = {
 *   id: '550e8400-e29b-41d4-a716-446655440000',
 *   entityId: 1,
 *   userId: 100,
 *   sessionKey: '1:100',
 *   state: { classId: 1, name: 'Fighter', ... },
 *   createdAt: new Date(),
 *   updatedAt: new Date(),
 *   expiresAt: new Date(Date.now() + 30 * 60 * 1000)
 * };
 * ```
 */
export interface Session<TEntityId extends number, TState> {
    /** Unique session identifier (UUID v4) */
    id: string;
    /** Entity ID this session belongs to */
    entityId: TEntityId;
    /** User ID this session belongs to */
    userId: number;
    /** Session key (entityId:userId) */
    sessionKey: string;
    /** Current session state (parsed from JSON) */
    state: TState;
    /** Session creation timestamp */
    createdAt: Date;
    /** Last update timestamp */
    updatedAt: Date;
    /** Session expiration timestamp */
    expiresAt: Date;
}
