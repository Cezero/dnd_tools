import { getRedisClient } from '../session/redisClient';
import type { RedisSessionClient } from '../session/types';

import { EntityStatePubSub } from './EntityStatePubSub';

/**
 * Generic service for managing entity states in Redis.
 * 
 * Entity states are stored independently from user sessions, allowing multiple
 * users to view the same entity state simultaneously. When an entity state is
 * updated, changes propagate to all viewing sessions via Redis pub/sub.
 * 
 * **Redis Key Pattern**: `state:{entityType}:{entityId}`
 * 
 * Examples:
 * - `state:class:1` - State for class with ID 1
 * - `state:feature:5` - State for feature with ID 5
 * - `state:character:10` - State for character with ID 10
 * 
 * **State Lifecycle**:
 * 1. State created when entity editing session is initialized
 * 2. State updated on each entity modification
 * 3. State persisted to MySQL on explicit save operation
 * 4. State remains in Redis until explicitly deleted or expired
 * 
 * **Integration with Pub/Sub**:
 * When state is updated via `setState`, it automatically publishes the update
 * to the corresponding pub/sub channel for real-time propagation to all
 * viewing sessions.
 * 
 * @see EntityStatePubSub - For pub/sub functionality
 * @see packages/shared/docs/application-overview/entity-state-management.md - Full documentation
 * 
 * @example
 * ```typescript
 * const stateService = new EntityStateService();
 * 
 * // Get entity state
 * const classState = await stateService.getState<ClassEditState>('class', 1);
 * 
 * // Set entity state (automatically publishes update)
 * await stateService.setState('class', 1, updatedState);
 * 
 * // Delete entity state
 * await stateService.deleteState('class', 1);
 * ```
 */
export class EntityStateService {
    private redis: RedisSessionClient;
    private pubSub: EntityStatePubSub;

    constructor() {
        this.redis = getRedisClient();
        this.pubSub = new EntityStatePubSub();
    }

    /**
     * Builds Redis key for entity state.
     * 
     * @param entityType - The entity type (e.g., 'class', 'feature', 'character')
     * @param entityId - The entity ID
     * @returns Redis key string
     */
    private buildStateKey(entityType: string, entityId: number): string {
        return `state:${entityType}:${entityId}`;
    }

    /**
     * Retrieves entity state from Redis.
     * 
     * @param entityType - The entity type (e.g., 'class', 'feature', 'character')
     * @param entityId - The entity ID
     * @returns The entity state, or null if not found
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * const state = await stateService.getState<ClassEditState>('class', 1);
     * if (state) {
     *   console.log('Class state:', state);
     * }
     * ```
     */
    async getState<T>(entityType: string, entityId: number): Promise<T | null> {
        const key = this.buildStateKey(entityType, entityId);
        
        try {
            const value = await this.redis.get(key);
            
            if (!value) {
                return null;
            }
            
            return JSON.parse(value) as T;
        } catch (error) {
            console.error(`Error getting state for ${entityType}:${entityId}:`, error);
            throw new Error(`Failed to get entity state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Stores entity state in Redis.
     * 
     * State is stored with no expiration (persists until explicitly deleted).
     * The state can optionally be published to the pub/sub channel for
     * real-time propagation to all viewing sessions.
     * 
     * @param entityType - The entity type (e.g., 'class', 'feature', 'character')
     * @param entityId - The entity ID
     * @param state - The entity state to store (must be JSON-serializable)
     * @param options - Optional configuration
     * @param options.publish - Whether to publish the update to pub/sub (default: true)
     * @throws Error if Redis operation fails or state is not serializable
     * 
     * @example
     * ```typescript
     * // Store state and publish update (default)
     * await stateService.setState('class', 1, {
     *   id: 1,
     *   name: 'Wizard',
     *   features: []
     * });
     * 
     * // Store state without publishing (for internal updates)
     * await stateService.setState('class', 1, updatedState, { publish: false });
     * ```
     */
    async setState<T>(entityType: string, entityId: number, state: T, options?: { publish?: boolean }): Promise<void> {
        const key = this.buildStateKey(entityType, entityId);
        const shouldPublish = options?.publish !== false; // Default to true for backward compatibility
        
        try {
            const serialized = JSON.stringify(state);
            
            // Store state with no expiration (persists until deleted)
            // Using a very long TTL (1 year) as a safety measure, but states
            // should be explicitly deleted when no longer needed
            const oneYearInSeconds = 365 * 24 * 60 * 60;
            await this.redis.setEx(key, oneYearInSeconds, serialized);
            
            // Publish state update to pub/sub channel (if enabled)
            if (shouldPublish) {
                try {
                    await this.pubSub.publish(entityType, entityId, state);
                } catch (publishError) {
                    // Log publish errors but don't fail the setState operation
                    // Publishing is for real-time updates and shouldn't block state storage
                    console.warn(`Failed to publish state update for ${entityType}:${entityId}:`, publishError);
                }
            }
        } catch (error) {
            console.error(`Error setting state for ${entityType}:${entityId}:`, error);
            throw new Error(`Failed to set entity state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Deletes entity state from Redis.
     * 
     * @param entityType - The entity type (e.g., 'class', 'feature', 'character')
     * @param entityId - The entity ID
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * await stateService.deleteState('class', 1);
     * ```
     */
    async deleteState(entityType: string, entityId: number): Promise<void> {
        const key = this.buildStateKey(entityType, entityId);
        
        try {
            await this.redis.del(key);
        } catch (error) {
            console.error(`Error deleting state for ${entityType}:${entityId}:`, error);
            throw new Error(`Failed to delete entity state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Publishes state update to Redis pub/sub channel.
     * 
     * This method is called automatically by `setState`, but can also be called
     * explicitly if needed to publish a state update without modifying the stored state.
     * 
     * The channel pattern is: `channel:state:{entityType}:{entityId}`
     * 
     * @param entityType - The entity type (e.g., 'class', 'feature', 'character')
     * @param entityId - The entity ID
     * @param state - The state to publish
     * @throws Error if pub/sub operation fails
     * 
     * @example
     * ```typescript
     * await stateService.publishStateUpdate('class', 1, updatedState);
     * ```
     */
    async publishStateUpdate<T>(entityType: string, entityId: number, state: T): Promise<void> {
        await this.pubSub.publish(entityType, entityId, state);
    }
}
