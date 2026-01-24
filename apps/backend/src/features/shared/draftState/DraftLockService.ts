import { DraftType } from '@shared/static-data';

import { getRedisClient } from '../session/redisClient';
import type { RedisSessionClient } from '../session/types';

/**
 * Service for managing draft locks in Redis.
 * 
 * Draft locks prevent concurrent editing conflicts by ensuring only one user
 * can edit a draft at a time. Locks are context-aware:
 * - **Admin editing**: Long-lived locks (30+ minutes) for Class/Race/Feature editing
 * - **Game sessions**: Short-lived locks (seconds) or message ordering for Character updates
 * 
 * **Redis Key Pattern**: `lock:{draftType}:{id}` → `userId`
 * **Redis Meta Key Pattern**: `lockMeta:{draftType}:{id}` → JSON `{ lockedAt: <ISO string> }`
 * 
 * Examples:
 * - `lock:1:1` → `123` (user 123 is editing class (DraftType.Class=1) 1 draft)
 * - `lock:3:5` → `456` (user 456 is editing feature (DraftType.Feature=3) 5 draft)
 * - `lockMeta:3:5` → `{ "lockedAt": "2026-01-24T12:34:56.789Z" }`
 * 
 * **Lock Lifecycle**:
 * 1. Lock acquired when user starts editing (via `acquireLock`)
 * 2. Lock held for duration of editing session (with TTL extension)
 * 3. Lock released when user saves or cancels (via `releaseLock`)
 * 4. Lock expires automatically after TTL if not explicitly released
 * 
 * **TTL Behavior**:
 * - Admin editing: Default 30 minutes (1800 seconds), configurable
 * - Game sessions: Short-lived (seconds), or use message ordering instead
 * 
 * **Force Release**:
 * Admin-only `forceReleaseLock` function allows releasing locks held by
 * stale sessions (e.g., when session IDs change during development).
 * 
 * @see packages/shared/docs/application-overview/entity-locking.md - Full documentation
 * 
 * @example
 * ```typescript
 * const lockService = new DraftLockService();
 * 
 * // Acquire lock for admin editing (30 min TTL)
 * const acquired = await lockService.acquireLock(DraftType.Class, 1, userId);
 * if (acquired) {
 *   // User can now edit
 * }
 * 
 * // Check if draft is locked
 * const lockedBy = await lockService.checkLock(DraftType.Class, 1);
 * if (lockedBy !== null) {
 *   console.log(`Class 1 draft is locked by user ${lockedBy}`);
 * }
 * 
 * // Release lock
 * await lockService.releaseLock(DraftType.Class, 1, userId);
 * 
 * // Admin: Force release lock (debug function)
 * await lockService.forceReleaseLock(DraftType.Class, 1, adminUserId);
 * ```
 */
export class DraftLockService {
    private redis: RedisSessionClient;
    
    /**
     * Default TTL for admin editing locks (30 minutes in seconds).
     */
    private readonly DEFAULT_ADMIN_TTL_SECONDS = 30 * 60; // 30 minutes

    constructor() {
        this.redis = getRedisClient();
    }

    /**
     * Builds Redis key for entity lock.
     * 
     * @param draftType - The draft type (numeric enum value)
     * @param id - The draft ID
     * @returns Redis key string
     */
    private buildLockKey(draftType: DraftType, id: number): string {
        return `lock:${draftType}:${id}`;
    }

    /**
     * Builds Redis key for lock metadata (e.g., lockedAt timestamps).
     */
    private buildLockMetaKey(draftType: DraftType, id: number): string {
        return `lockMeta:${draftType}:${id}`;
    }

    /**
     * Acquires a lock for an entity.
     * 
     * If the entity is already locked by another user, returns false.
     * If the entity is not locked or locked by the same user, acquires/refreshes the lock.
     * 
     * @param draftType - The draft type (numeric enum value)
     * @param id - The draft ID
     * @param userId - The user ID requesting the lock
     * @param ttl - Optional TTL in seconds (default: 30 minutes for admin editing)
     * @returns True if lock was acquired, false if already locked by another user
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * // Admin editing with default TTL
     * const acquired = await lockService.acquireLock(DraftType.Class, 1, userId);
     * 
     * // Game session with short TTL
     * const acquired = await lockService.acquireLock(DraftType.Character, 10, userId, 60);
     * ```
     */
    async acquireLock(
        draftType: DraftType,
        id: number,
        userId: number,
        ttl?: number
    ): Promise<boolean> {
        const key = this.buildLockKey(draftType, id);
        const metaKey = this.buildLockMetaKey(draftType, id);
        const ttlSeconds = ttl ?? this.DEFAULT_ADMIN_TTL_SECONDS;
        
        try {
            // Check if lock exists
            const existingLock = await this.redis.get(key);
            
            if (existingLock) {
                const lockedByUserId = parseInt(existingLock, 10);
                
                // If locked by same user, refresh the lock
                if (lockedByUserId === userId) {
                    await this.redis.setEx(key, ttlSeconds, existingLock);
                    const existingMeta = await this.redis.get(metaKey);
                    if (existingMeta) {
                        // Preserve original lockedAt, but refresh TTL
                        await this.redis.setEx(metaKey, ttlSeconds, existingMeta);
                    } else {
                        // Meta missing: create it on refresh
                        await this.redis.setEx(
                            metaKey,
                            ttlSeconds,
                            JSON.stringify({ lockedAt: new Date().toISOString() })
                        );
                    }
                    return true;
                }
                
                // Locked by different user
                return false;
            }
            
            // No existing lock, acquire it
            await this.redis.setEx(key, ttlSeconds, userId.toString());
            await this.redis.setEx(
                metaKey,
                ttlSeconds,
                JSON.stringify({ lockedAt: new Date().toISOString() })
            );
            return true;
        } catch (error) {
            console.error(`Error acquiring lock for ${draftType}:${id}:`, error);
            throw new Error(`Failed to acquire lock: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Releases a lock for an entity.
     * 
     * Only releases the lock if it's held by the specified user.
     * This prevents accidental release of locks held by other users.
     * 
     * @param draftType - The draft type (numeric enum value)
     * @param id - The draft ID
     * @param userId - The user ID releasing the lock
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * await lockService.releaseLock(DraftType.Class, 1, userId);
     * ```
     */
    async releaseLock(draftType: DraftType, id: number, userId: number): Promise<void> {
        const key = this.buildLockKey(draftType, id);
        const metaKey = this.buildLockMetaKey(draftType, id);
        
        try {
            // Check if lock exists and is held by this user
            const existingLock = await this.redis.get(key);
            
            if (existingLock) {
                const lockedByUserId = parseInt(existingLock, 10);
                
                // Only release if held by this user
                if (lockedByUserId === userId) {
                    await this.redis.del(key);
                    await this.redis.del(metaKey);
                } else {
                    throw new Error(`Lock is held by user ${lockedByUserId}, not ${userId}`);
                }
            }
            // If no lock exists, that's fine - already released
        } catch (error) {
            console.error(`Error releasing lock for ${draftType}:${id}:`, error);
            throw new Error(`Failed to release lock: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Checks if an entity is locked and returns the user ID holding the lock.
     * 
     * @param draftType - The draft type (numeric enum value)
     * @param id - The draft ID
     * @returns The user ID holding the lock, or null if not locked
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * const lockedBy = await lockService.checkLock(DraftType.Class, 1);
     * if (lockedBy !== null) {
     *   console.log(`Class 1 is locked by user ${lockedBy}`);
     * }
     * ```
     */
    async checkLock(draftType: DraftType, id: number): Promise<number | null> {
        const key = this.buildLockKey(draftType, id);
        
        try {
            const value = await this.redis.get(key);
            
            if (!value) {
                return null;
            }
            
            // Parse the value and ensure it's a valid number
            const parsed = parseInt(value, 10);
            
            // Handle NaN case - if value can't be parsed, log warning and return null
            if (isNaN(parsed)) {
                console.warn(`[DraftLockService] Lock value for ${draftType}:${id} is not a valid number: "${value}"`);
                return null;
            }
            
            return parsed;
        } catch (error) {
            console.error(`Error checking lock for ${draftType}:${id}:`, error);
            throw new Error(`Failed to check lock: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Admin-only debug function to force release a lock.
     * 
     * This function allows administrators to release locks that may be held
     * by stale sessions (e.g., when session IDs change during development
     * due to code recompilation or other changes).
     * 
     * **Security**: This function should only be accessible to admin users.
     * The requesting user ID is logged for audit purposes.
     * 
     * @param draftType - The draft type (numeric enum value)
     * @param id - The draft ID
     * @param requestingUserId - The admin user ID requesting the force release
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * // Admin force releases a lock held by a stale session
     * await lockService.forceReleaseLock(DraftType.Class, 1, adminUserId);
     * ```
     * 
     * @see packages/shared/docs/application-overview/entity-locking.md - Lock documentation
     */
    async forceReleaseLock(
        draftType: DraftType,
        id: number,
        requestingUserId: number
    ): Promise<void> {
        const key = this.buildLockKey(draftType, id);
        const metaKey = this.buildLockMetaKey(draftType, id);
        
        try {
            const existingLock = await this.redis.get(key);
            
            if (existingLock) {
                const lockedByUserId = parseInt(existingLock, 10);
                
                // Log the force release for audit purposes
                console.log(
                    `[ADMIN] Force releasing lock for ${draftType}:${id} ` +
                    `(was locked by user ${lockedByUserId}, released by admin user ${requestingUserId})`
                );
                
                await this.redis.del(key);
                await this.redis.del(metaKey);
            } else {
                // No lock exists, that's fine
                console.log(
                    `[ADMIN] Force release requested for ${draftType}:${id} ` +
                    `by admin user ${requestingUserId}, but no lock exists`
                );
            }
        } catch (error) {
            console.error(`Error force releasing lock for ${draftType}:${id}:`, error);
            throw new Error(`Failed to force release lock: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
