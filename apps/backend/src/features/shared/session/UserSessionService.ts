import { getRedisClient } from './redisClient';
import type { RedisSessionClient } from './types';

/**
 * Entity reference type for tracking which entities a user is viewing/editing.
 */
export interface EntityRef {
    entityType: string;
    entityId: number;
}

/**
 * User session data structure.
 * 
 * Tracks which entities a user is currently viewing and editing.
 */
export interface UserSession {
    userId: number;
    viewing: EntityRef[];
    editing: EntityRef[];
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Service for managing user sessions in Redis.
 * 
 * User sessions track which entities a user is viewing or editing, independent
 * of the entity states themselves. This allows multiple users to view the same
 * entity simultaneously, while only one user can edit at a time (enforced by locks).
 * 
 * **Redis Key Pattern**: `session:user:{userId}`
 * 
 * **Session Structure**:
 * - `viewing`: Array of entities the user is viewing (subscribed to state updates)
 * - `editing`: Array of entities the user is editing (has locks on)
 * 
 * **Integration**:
 * - When a user starts viewing an entity, it's added to `viewing` and the user
 *   subscribes to entity state updates via WebSocket
 * - When a user starts editing an entity, it's added to `editing` and a lock is acquired
 * - When a user stops viewing/editing, the entity is removed from the respective array
 * 
 * @see EntityLockService - For lock management
 * @see EntityStateService - For entity state management
 * @see packages/shared/docs/application-overview/entity-state-management.md - Full documentation
 * 
 * @example
 * ```typescript
 * const userSessionService = new UserSessionService();
 * 
 * // Get user session
 * const session = await userSessionService.getUserSession(userId);
 * 
 * // Add entity to viewing list
 * await userSessionService.addViewingEntity(userId, 'class', 1);
 * 
 * // Start editing entity
 * await userSessionService.setEditingEntity(userId, 'class', 1);
 * 
 * // Stop editing entity
 * await userSessionService.clearEditingEntity(userId, 'class', 1);
 * ```
 */
export class UserSessionService {
    private redis: RedisSessionClient;
    private readonly SESSION_TTL_SECONDS = 30 * 60; // 30 minutes

    constructor() {
        this.redis = getRedisClient();
    }

    /**
     * Builds Redis key for user session.
     * 
     * @param userId - The user ID
     * @returns Redis key string
     */
    private buildSessionKey(userId: number): string {
        return `session:user:${userId}`;
    }

    /**
     * Gets user session from Redis.
     * 
     * @param userId - The user ID
     * @returns The user session, or null if not found
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * const session = await userSessionService.getUserSession(userId);
     * if (session) {
     *   console.log('Viewing:', session.viewing);
     *   console.log('Editing:', session.editing);
     * }
     * ```
     */
    async getUserSession(userId: number): Promise<UserSession | null> {
        const key = this.buildSessionKey(userId);
        
        try {
            const value = await this.redis.get(key);
            
            if (!value) {
                return null;
            }
            
            const parsed = JSON.parse(value) as Omit<UserSession, 'createdAt' | 'updatedAt'> & {
                createdAt: string;
                updatedAt: string;
            };
            
            return {
                ...parsed,
                createdAt: new Date(parsed.createdAt),
                updatedAt: new Date(parsed.updatedAt)
            };
        } catch (error) {
            console.error(`Error getting user session for user ${userId}:`, error);
            throw new Error(`Failed to get user session: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Creates or updates user session.
     * 
     * If session doesn't exist, creates a new one. If it exists, updates it.
     * 
     * @param userId - The user ID
     * @param session - The session data
     * @throws Error if Redis operation fails
     */
    private async setUserSession(userId: number, session: UserSession): Promise<void> {
        const key = this.buildSessionKey(userId);
        
        try {
            const serialized = JSON.stringify({
                ...session,
                createdAt: session.createdAt.toISOString(),
                updatedAt: session.updatedAt.toISOString()
            });
            
            await this.redis.setEx(key, this.SESSION_TTL_SECONDS, serialized);
        } catch (error) {
            console.error(`Error setting user session for user ${userId}:`, error);
            throw new Error(`Failed to set user session: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Adds an entity to the user's viewing list.
     * 
     * If the entity is already in the viewing list, does nothing.
     * If the user session doesn't exist, creates it.
     * 
     * @param userId - The user ID
     * @param entityType - The entity type (e.g., 'class', 'feature', 'character')
     * @param entityId - The entity ID
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * await userSessionService.addViewingEntity(userId, 'class', 1);
     * ```
     */
    async addViewingEntity(userId: number, entityType: string, entityId: number): Promise<void> {
        const session = await this.getUserSession(userId);
        const now = new Date();
        
        const entityRef: EntityRef = { entityType, entityId };
        
        if (session) {
            // Check if already viewing
            const isViewing = session.viewing.some(
                e => e.entityType === entityType && e.entityId === entityId
            );
            
            if (isViewing) {
                // Already viewing, just update timestamp
                await this.setUserSession(userId, {
                    ...session,
                    updatedAt: now
                });
                return;
            }
            
            // Add to viewing list
            await this.setUserSession(userId, {
                ...session,
                viewing: [...session.viewing, entityRef],
                updatedAt: now
            });
        } else {
            // Create new session
            await this.setUserSession(userId, {
                userId,
                viewing: [entityRef],
                editing: [],
                createdAt: now,
                updatedAt: now
            });
        }
    }

    /**
     * Removes an entity from the user's viewing list.
     * 
     * @param userId - The user ID
     * @param entityType - The entity type (e.g., 'class', 'feature', 'character')
     * @param entityId - The entity ID
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * await userSessionService.removeViewingEntity(userId, 'class', 1);
     * ```
     */
    async removeViewingEntity(userId: number, entityType: string, entityId: number): Promise<void> {
        const session = await this.getUserSession(userId);
        
        if (!session) {
            return; // No session to update
        }
        
        const updatedViewing = session.viewing.filter(
            e => !(e.entityType === entityType && e.entityId === entityId)
        );
        
        await this.setUserSession(userId, {
            ...session,
            viewing: updatedViewing,
            updatedAt: new Date()
        });
    }

    /**
     * Sets an entity as being edited by the user.
     * 
     * Adds the entity to the editing list. If the entity is already in the editing
     * list, does nothing. If the user session doesn't exist, creates it.
     * 
     * **Note**: This method does not acquire a lock. Lock acquisition should be
     * handled separately via EntityLockService.
     * 
     * @param userId - The user ID
     * @param entityType - The entity type (e.g., 'class', 'feature', 'character')
     * @param entityId - The entity ID
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * await userSessionService.setEditingEntity(userId, 'class', 1);
     * ```
     */
    async setEditingEntity(userId: number, entityType: string, entityId: number): Promise<void> {
        const session = await this.getUserSession(userId);
        const now = new Date();
        
        const entityRef: EntityRef = { entityType, entityId };
        
        if (session) {
            // Check if already editing
            const isEditing = session.editing.some(
                e => e.entityType === entityType && e.entityId === entityId
            );
            
            if (isEditing) {
                // Already editing, just update timestamp
                await this.setUserSession(userId, {
                    ...session,
                    updatedAt: now
                });
                return;
            }
            
            // Add to editing list
            await this.setUserSession(userId, {
                ...session,
                editing: [...session.editing, entityRef],
                updatedAt: now
            });
        } else {
            // Create new session
            await this.setUserSession(userId, {
                userId,
                viewing: [],
                editing: [entityRef],
                createdAt: now,
                updatedAt: now
            });
        }
    }

    /**
     * Removes an entity from the user's editing list.
     * 
     * **Note**: This method does not release a lock. Lock release should be
     * handled separately via EntityLockService.
     * 
     * @param userId - The user ID
     * @param entityType - The entity type (e.g., 'class', 'feature', 'character')
     * @param entityId - The entity ID
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * await userSessionService.clearEditingEntity(userId, 'class', 1);
     * ```
     */
    async clearEditingEntity(userId: number, entityType: string, entityId: number): Promise<void> {
        const session = await this.getUserSession(userId);
        
        if (!session) {
            return; // No session to update
        }
        
        const updatedEditing = session.editing.filter(
            e => !(e.entityType === entityType && e.entityId === entityId)
        );
        
        await this.setUserSession(userId, {
            ...session,
            editing: updatedEditing,
            updatedAt: new Date()
        });
    }
}
