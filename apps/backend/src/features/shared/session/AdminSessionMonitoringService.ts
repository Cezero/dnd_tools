import { getRedisClient } from './redisClient';
import type { RedisSessionClient } from './types';
import { UserSessionService, type UserSession, type EntityRef } from './UserSessionService';
import { EntityLockService } from '../entityState/EntityLockService';
import { EntityStateService } from '../entityState/EntityStateService';
import { userProfileService } from '../../userProfile/userProfileService';

/**
 * Admin session information for monitoring.
 */
export interface AdminSessionInfo {
    userId: number;
    userName: string;
    viewing: EntityRef[];
    editing: EntityRef[];
    sessionKey: string;
}

/**
 * Entity state information for monitoring.
 */
export interface EntityStateInfo {
    entityType: string;
    entityId: number;
    hasState: boolean;
    lastUpdated: Date | null;
}

/**
 * Entity lock information for monitoring.
 */
export interface EntityLockInfo {
    entityType: string;
    entityId: number;
    lockedBy: number;
    lockedByUserName: string | null;
    lockedAt: Date | null;
}

/**
 * WebSocket subscription information for monitoring.
 */
export interface WebSocketSubscriptionInfo {
    clientId: string;
    userId: number | null;
    userName: string | null;
    subscriptions: EntityRef[];
}

/**
 * Service for admin monitoring of all sessions, views, subscriptions, and locks.
 * 
 * Provides comprehensive monitoring capabilities for administrators to view:
 * - All active user sessions and their viewing/editing entities
 * - All entity states in Redis
 * - All active entity locks
 * - All WebSocket subscriptions
 * 
 * **Admin Access**: All methods should be protected by admin authentication middleware.
 * 
 * @see UserSessionService - For user session data
 * @see EntityLockService - For lock data
 * @see EntityStateService - For entity state data
 * @see packages/shared/docs/application-overview/admin-session-monitoring.md - Full documentation
 * 
 * @example
 * ```typescript
 * const monitoringService = new AdminSessionMonitoringService();
 * 
 * // Get all user sessions
 * const sessions = await monitoringService.getAllUserSessions();
 * 
 * // Get all locks
 * const locks = await monitoringService.getAllLocks();
 * ```
 */
export class AdminSessionMonitoringService {
    private redis: RedisSessionClient;
    private userSessionService: UserSessionService;
    private lockService: EntityLockService;
    private stateService: EntityStateService;

    constructor() {
        this.redis = getRedisClient();
        this.userSessionService = new UserSessionService();
        this.lockService = new EntityLockService();
        this.stateService = new EntityStateService();
    }

    /**
     * Gets user name by user ID.
     * 
     * @param userId - The user ID
     * @returns User name or null if not found
     */
    private async getUserName(userId: number): Promise<string | null> {
        try {
            const profile = await userProfileService.getUserProfile(userId);
            return profile?.username || null;
        } catch (error) {
            console.error(`Error fetching user name for user ${userId}:`, error);
            return null;
        }
    }

    /**
     * Gets all active user sessions with viewing/editing entities.
     * 
     * @returns Array of admin session information
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * const sessions = await monitoringService.getAllUserSessions();
     * ```
     */
    async getAllUserSessions(): Promise<AdminSessionInfo[]> {
        try {
            // Get all user session keys
            const sessionKeys = await this.redis.keys('session:user:*');

            const sessions: AdminSessionInfo[] = [];

            for (const key of sessionKeys) {
                const userIdStr = key.replace('session:user:', '');
                const userId = parseInt(userIdStr, 10);

                if (isNaN(userId)) {
                    continue;
                }

                const session = await this.userSessionService.getUserSession(userId);

                if (session) {
                    // Get user name
                    const userName = await this.getUserName(userId);

                    sessions.push({
                        userId: session.userId,
                        userName: userName || `User ${session.userId}`,
                        viewing: session.viewing,
                        editing: session.editing,
                        sessionKey: key
                    });
                }
            }

            return sessions;
        } catch (error) {
            console.error('Error getting all user sessions:', error);
            throw new Error(`Failed to get user sessions: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Gets all entity states in Redis.
     * 
     * @returns Array of entity state information
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * const states = await monitoringService.getAllEntityStates();
     * ```
     */
    async getAllEntityStates(): Promise<EntityStateInfo[]> {
        try {
            // Get all state keys
            const stateKeys = await this.redis.keys('state:*');

            const states: EntityStateInfo[] = [];

            for (const key of stateKeys) {
                // Parse entity type and ID from key: state:{entityType}:{entityId}
                const match = key.match(/^state:([^:]+):(\d+)$/);
                if (!match) {
                    continue;
                }

                const [, entityType, entityIdStr] = match;
                const entityId = parseInt(entityIdStr, 10);

                if (isNaN(entityId)) {
                    continue;
                }

                // Get state to check if it exists and get last updated time
                const stateValue = await this.redis.get(key);
                const hasState = stateValue !== null;

                // TODO: Extract lastUpdated from state if available
                // For now, we can't easily get lastUpdated without parsing the state
                states.push({
                    entityType,
                    entityId,
                    hasState,
                    lastUpdated: null // TODO: Extract from state if available
                });
            }

            return states;
        } catch (error) {
            console.error('Error getting all entity states:', error);
            throw new Error(`Failed to get entity states: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Gets all active entity locks.
     * 
     * @returns Array of entity lock information
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * const locks = await monitoringService.getAllLocks();
     * ```
     */
    async getAllLocks(): Promise<EntityLockInfo[]> {
        try {
            // Get all lock keys
            const lockKeys = await this.redis.keys('lock:*');

            const locks: EntityLockInfo[] = [];

            for (const key of lockKeys) {
                // Parse entity type and ID from key: lock:{entityType}:{entityId}
                const match = key.match(/^lock:([^:]+):(\d+)$/);
                if (!match) {
                    continue;
                }

                const [, entityType, entityIdStr] = match;
                const entityId = parseInt(entityIdStr, 10);

                if (isNaN(entityId)) {
                    continue;
                }

                // Get lock value (userId)
                const lockedByStr = await this.redis.get(key);
                if (!lockedByStr) {
                    continue;
                }

                const lockedBy = parseInt(lockedByStr, 10);
                if (isNaN(lockedBy)) {
                    continue;
                }

                // Get user name
                const lockedByUserName = await this.getUserName(lockedBy);

                locks.push({
                    entityType,
                    entityId,
                    lockedBy,
                    lockedByUserName: lockedByUserName || `User ${lockedBy}`,
                    lockedAt: null // TODO: Extract from lock metadata if available
                });
            }

            return locks;
        } catch (error) {
            console.error('Error getting all locks:', error);
            throw new Error(`Failed to get locks: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Gets all WebSocket subscriptions.
     * 
     * **Note**: This requires access to WebSocket server's internal state.
     * This is a placeholder - actual implementation will need to integrate
     * with WebSocketServer to get subscription information.
     * 
     * @returns Array of WebSocket subscription information
     * @throws Error if operation fails
     * 
     * @example
     * ```typescript
     * const subscriptions = await monitoringService.getAllWebSocketSubscriptions();
     * ```
     */
    async getAllWebSocketSubscriptions(): Promise<WebSocketSubscriptionInfo[]> {
        // TODO: Integrate with WebSocketServer to get actual subscription data
        // For now, return empty array
        // This will need to be implemented when WebSocketServer is integrated
        return [];
    }
}
