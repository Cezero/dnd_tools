import type { DraftRef } from '@shared/schema';
import { DraftType } from '@shared/static-data';


import { getRedisClient } from './redisClient';
import type { RedisSessionClient } from './types';

/**
 * Entity reference type for tracking which entities a user is viewing/editing.
 * 
 * @deprecated Use DraftRef from @shared/schema instead
 */
export type EntityRef = DraftRef;

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
 * @see DraftLockService - For lock management
 * @see DraftStateService - For entity state management
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
            
            // Refresh TTL on read (touch) to keep session alive while actively used
            await this.redis.expire(key, this.SESSION_TTL_SECONDS);
            
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
     * @param objectName - The entity type name (e.g., 'class', 'feature', 'character')
     * @param id - The entity ID
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * await userSessionService.addViewingEntity(userId, 'class', 1);
     * ```
     */
    async addViewingEntity(userId: number, draftType: DraftType, id: number): Promise<void> {
        const session = await this.getUserSession(userId);
        const now = new Date();
        
        const entityRef: EntityRef = { draftType, id };
        
        if (session) {
            // Check if already viewing
            const isViewing = session.viewing.some(
                e => e.draftType === draftType && e.id === id
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
     * @param objectName - The entity type name (e.g., 'class', 'feature', 'character')
     * @param id - The entity ID
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * await userSessionService.removeViewingEntity(userId, 'class', 1);
     * ```
     */
    async removeViewingEntity(userId: number, draftType: DraftType, id: number): Promise<void> {
        const session = await this.getUserSession(userId);
        
        if (!session) {
            return; // No session to update
        }
        
        const updatedViewing = session.viewing.filter(
            e => !(e.draftType === draftType && e.id === id)
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
     * handled separately via DraftLockService.
     * 
     * @param userId - The user ID
     * @param objectName - The entity type name (e.g., 'class', 'feature', 'character')
     * @param id - The entity ID
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * await userSessionService.setEditingEntity(userId, 'class', 1);
     * ```
     */
    async setEditingEntity(userId: number, draftType: DraftType, id: number): Promise<void> {
        const session = await this.getUserSession(userId);
        const now = new Date();
        
        const entityRef: EntityRef = { draftType, id };
        
        if (session) {
            // Check if already editing
            const isEditing = session.editing.some(
                e => e.draftType === draftType && e.id === id
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
     * handled separately via DraftLockService.
     * 
     * @param userId - The user ID
     * @param objectName - The entity type name (e.g., 'class', 'feature', 'character')
     * @param id - The entity ID
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * await userSessionService.clearEditingEntity(userId, 'class', 1);
     * ```
     */
    async clearEditingEntity(userId: number, draftType: DraftType, id: number): Promise<void> {
        const session = await this.getUserSession(userId);
        
        if (!session) {
            return; // No session to update
        }
        
        const updatedEditing = session.editing.filter(
            e => !(e.draftType === draftType && e.id === id)
        );
        
        await this.setUserSession(userId, {
            ...session,
            editing: updatedEditing,
            updatedAt: new Date()
        });
    }

    /**
     * Removes a draft from all user sessions that reference it.
     * 
     * This method scans all user sessions and removes the specified draft
     * from both viewing and editing lists. Used when a draft is deleted
     * to clean up stale session references.
     * 
     * **Performance Note**: This method scans all user sessions, which can be
     * expensive with many active users. Consider optimizing with a reverse
     * index if this becomes a performance bottleneck.
     * 
     * @param draftType - The draft type
     * @param id - The draft ID
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * // Clean up all session references to a deleted draft
     * await userSessionService.removeDraftFromAllSessions(DraftType.Character, 123);
     * ```
     */
    async removeDraftFromAllSessions(draftType: DraftType, id: number): Promise<void> {
        try {
            // Find all user session keys
            const sessionKeys = await this.redis.keys('session:user:*');
            
            // Process each session
            const cleanupPromises = sessionKeys.map(async (key) => {
                try {
                    // Extract userId from key (format: session:user:{userId})
                    const userIdMatch = key.match(/^session:user:(\d+)$/);
                    if (!userIdMatch) {
                        return; // Skip invalid keys
                    }
                    
                    const userId = parseInt(userIdMatch[1], 10);
                    if (Number.isNaN(userId)) {
                        return; // Skip invalid user IDs
                    }
                    
                    const session = await this.getUserSession(userId);
                    if (!session) {
                        return; // Session doesn't exist or expired
                    }
                    
                    // Check if session references this draft
                    const hasInViewing = session.viewing.some(
                        e => e.draftType === draftType && e.id === id
                    );
                    const hasInEditing = session.editing.some(
                        e => e.draftType === draftType && e.id === id
                    );
                    
                    if (!hasInViewing && !hasInEditing) {
                        return; // Session doesn't reference this draft
                    }
                    
                    // Remove from viewing and editing lists
                    const updatedViewing = session.viewing.filter(
                        e => !(e.draftType === draftType && e.id === id)
                    );
                    const updatedEditing = session.editing.filter(
                        e => !(e.draftType === draftType && e.id === id)
                    );
                    
                    // Update session if it changed
                    await this.setUserSession(userId, {
                        ...session,
                        viewing: updatedViewing,
                        editing: updatedEditing,
                        updatedAt: new Date()
                    });
                } catch (error) {
                    // Log but don't fail - best effort cleanup
                    console.error(`Error cleaning up draft ${draftType}:${id} from session ${key}:`, error);
                }
            });
            
            await Promise.all(cleanupPromises);
        } catch (error) {
            console.error(`Error removing draft ${draftType}:${id} from all sessions:`, error);
            throw new Error(`Failed to remove draft from all sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
