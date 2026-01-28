import { DraftType } from '@shared/static-data';

import { DraftStatePubSub } from './DraftStatePubSub';
import { getRedisClient } from '../session/redisClient';
import type { RedisSessionClient } from '../session/types';
import { UserSessionService } from '../session/UserSessionService';


/**
 * Generic service for managing draft states in Redis.
 * 
 * Draft states are stored independently from user sessions, allowing multiple
 * users to view the same draft state simultaneously. When a draft state is
 * updated, changes propagate to all viewing sessions via Redis pub/sub.
 * 
 * **Redis Key Pattern**: `state:{draftType}:{id}`
 * **Redis Meta Key Pattern**: `stateMeta:{draftType}:{id}`
 * 
 * Examples:
 * - `state:1:1` - Draft state for class (DraftType.Class=1) with ID 1
 * - `state:3:5` - Draft state for feature (DraftType.Feature=3) with ID 5
 * - `state:4:10` - Draft state for character (DraftType.Character=4) with ID 10
 * - `stateMeta:4:10` - Metadata for character draft state (includes lastUpdated)
 * 
 * **Draft Lifecycle**:
 * 1. Draft created when editing session is initialized
 * 2. Draft updated on each modification
 * 3. Draft persisted to MySQL on explicit save operation
 * 4. Draft remains in Redis until explicitly deleted or expired
 * 
 * **Integration with Pub/Sub**:
 * When draft is updated via `setState`, it automatically publishes the update
 * to the corresponding pub/sub channel for real-time propagation to all
 * viewing sessions.
 * 
 * @see DraftStatePubSub - For pub/sub functionality
 * @see packages/shared/docs/application-overview/entity-state-management.md - Full documentation
 * 
 * @example
 * ```typescript
 * const stateService = new DraftStateService();
 * 
 * // Get draft state
 * const classState = await stateService.getState<ClassEditState>(DraftType.Class, 1);
 * 
 * // Set entity state (automatically publishes update)
 * await stateService.setState(DraftType.Class, 1, updatedState);
 * 
 * // Delete entity state
 * await stateService.deleteState(DraftType.Class, 1);
 * ```
 */
export class DraftStateService {
    private redis: RedisSessionClient;
    private pubSub: DraftStatePubSub;
    private userSessionService: UserSessionService;
    /**
     * TTL for draft states (30 minutes in seconds).
     * Matches session and lock TTL to ensure drafts expire when sessions/locks expire.
     */
    private readonly DRAFT_TTL_SECONDS = 30 * 60; // 30 minutes

    constructor() {
        this.redis = getRedisClient();
        this.pubSub = new DraftStatePubSub();
        this.userSessionService = new UserSessionService();
    }

    /**
     * Builds Redis key for draft state.
     * 
     * @param draftType - The draft type (numeric enum value)
     * @param id - The draft ID
     * @returns Redis key string
     */
    private buildStateKey(draftType: DraftType, id: number): string {
        return `state:${draftType}:${id}`;
    }

    /**
     * Builds Redis key for draft state metadata (e.g., lastUpdated timestamps).
     */
    private buildStateMetaKey(draftType: DraftType, id: number): string {
        return `stateMeta:${draftType}:${id}`;
    }

    /**
     * Retrieves draft state from Redis.
     * 
     * @param draftType - The draft type (numeric enum value)
     * @param id - The draft ID
     * @returns The draft state, or null if not found
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * const state = await stateService.getState<ClassEditState>(DraftType.Class, 1);
     * if (state) {
     *   console.log('Class draft state:', state);
     * }
     * ```
     */
    async getState<T>(draftType: DraftType, id: number): Promise<T | null> {
        const key = this.buildStateKey(draftType, id);
        const metaKey = this.buildStateMetaKey(draftType, id);
        
        try {
            const value = await this.redis.get(key);
            
            if (!value) {
                return null;
            }
            
            // Refresh TTL on read (touch) to keep draft alive while actively used
            await this.redis.expire(key, this.DRAFT_TTL_SECONDS);
            const metaValue = await this.redis.get(metaKey);
            if (metaValue) {
                await this.redis.expire(metaKey, this.DRAFT_TTL_SECONDS);
            }
            
            return JSON.parse(value) as T;
        } catch (error) {
            console.error(`Error getting draft state for ${draftType}:${id}:`, error);
            throw new Error(`Failed to get draft state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Stores draft state in Redis.
     * 
     * Draft is stored with no expiration (persists until explicitly deleted).
     * The draft can optionally be published to the pub/sub channel for
     * real-time propagation to all viewing sessions.
     * 
     * @param draftType - The draft type (numeric enum value)
     * @param id - The draft ID
     * @param state - The draft state to store (must be JSON-serializable)
     * @param options - Optional configuration
     * @param options.publish - Whether to publish the update to pub/sub (default: true)
     * @throws Error if Redis operation fails or state is not serializable
     * 
     * @example
     * ```typescript
     * // Store state and publish update (default)
     * await stateService.setState(DraftType.Class, 1, {
     *   id: 1,
     *   name: 'Wizard',
     *   features: []
     * });
     * 
     * // Store state without publishing (for internal updates)
     * await stateService.setState(DraftType.Class, 1, updatedState, { publish: false });
     * ```
     */
    async setState<T>(draftType: DraftType, id: number, state: T, options?: { publish?: boolean }): Promise<void> {
        const key = this.buildStateKey(draftType, id);
        const metaKey = this.buildStateMetaKey(draftType, id);
        const shouldPublish = options?.publish !== false; // Default to true for backward compatibility
        
        try {
            const serialized = JSON.stringify(state);
            
            // Store state with TTL matching session/lock TTL (30 minutes)
            // TTL is refreshed on read (getState) to keep drafts alive while actively used
            await this.redis.setEx(key, this.DRAFT_TTL_SECONDS, serialized);
            await this.redis.setEx(
                metaKey,
                this.DRAFT_TTL_SECONDS,
                JSON.stringify({ lastUpdated: new Date().toISOString() })
            );
            
            // Publish state update to pub/sub channel (if enabled)
            if (shouldPublish) {
                try {
                    await this.pubSub.publish(draftType, id, state);
                } catch (publishError) {
                    // Log publish errors but don't fail the setState operation
                    // Publishing is for real-time updates and shouldn't block state storage
                    console.warn(`Failed to publish draft update for ${draftType}:${id}:`, publishError);
                }
            }
        } catch (error) {
            console.error(`Error setting draft state for ${draftType}:${id}:`, error);
            throw new Error(`Failed to set entity state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Deletes entity state from Redis.
     * 
     * Also cleans up session references to the deleted draft from all user sessions.
     * This ensures that users don't have stale session entries claiming they're
     * editing/viewing a draft that no longer exists.
     * 
     * @param draftType - The draft type (numeric enum value)
     * @param id - The draft ID
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * await stateService.deleteState(DraftType.Class, 1);
     * ```
     */
    async deleteState(draftType: DraftType, id: number): Promise<void> {
        const key = this.buildStateKey(draftType, id);
        const metaKey = this.buildStateMetaKey(draftType, id);
        
        try {
            // Delete the draft state and metadata
            await this.redis.del(key);
            await this.redis.del(metaKey);
            
            // Clean up session references to this draft
            // This is best-effort - if it fails, we still want the draft deleted
            try {
                await this.userSessionService.removeDraftFromAllSessions(draftType, id);
            } catch (sessionError) {
                // Log but don't fail - the draft is already deleted
                console.error(`Error cleaning up session references for draft ${draftType}:${id}:`, sessionError);
            }
        } catch (error) {
            console.error(`Error deleting draft state for ${draftType}:${id}:`, error);
            throw new Error(`Failed to delete entity state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Publishes state update to Redis pub/sub channel.
     * 
     * This method is called automatically by `setState`, but can also be called
     * explicitly if needed to publish a state update without modifying the stored state.
     * 
     * The channel pattern is: `channel:state:{draftType}:{id}`
     * 
     * @param draftType - The draft type (numeric enum value)
     * @param id - The draft ID
     * @param state - The state to publish
     * @throws Error if pub/sub operation fails
     * 
     * @example
     * ```typescript
     * await stateService.publishStateUpdate(DraftType.Class, 1, updatedState);
     * ```
     */
    async publishStateUpdate<T>(draftType: DraftType, id: number, state: T): Promise<void> {
        await this.pubSub.publish(draftType, id, state);
    }
}
