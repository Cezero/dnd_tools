import type { DraftRef } from '@shared/schema';
import { DraftType, isValidDraftType } from '@shared/static-data';


import { getRedisClient } from './redisClient';
import type { RedisSessionClient } from './types';
import { UserSessionService, type UserSession } from './UserSessionService';
import { userProfileService } from '../../userProfile/userProfileService';
import { DraftLockService } from '../draftState/DraftLockService';
import { DraftStateService } from '../draftState/DraftStateService';
import { getWebSocketServerInstance } from '../websocket/webSocketServerRegistry';

/**
 * Admin session information for monitoring.
 * 
 * Note: Uses DraftRef (from @shared/schema) for entity references.
 * Date fields are Date objects (not ISO strings like in schema).
 */
export interface AdminSessionInfo {
    userId: number;
    userName: string;
    viewing: DraftRef[];
    editing: DraftRef[];
    sessionKey: string;
}

/**
 * Draft state information for monitoring.
 * 
 * Note: lastUpdated is a Date object (not ISO string like in DraftStateInfo schema).
 */
export interface EntityStateInfo {
    draftType: DraftType;
    id: number;
    hasState: boolean;
    lastUpdated: Date | null;
}

/**
 * Draft lock information for monitoring.
 * 
 * Note: lockedAt is a Date object (not ISO string like in DraftLockInfo schema).
 */
export interface EntityLockInfo {
    draftType: DraftType;
    id: number;
    lockedBy: number;
    lockedByUserName: string | null;
    lockedAt: Date | null;
}

/**
 * WebSocket subscription information for monitoring.
 * 
 * Note: Uses DraftRef (from @shared/schema) for entity references.
 */
export interface WebSocketSubscriptionInfo {
    clientId: string;
    userId: number | null;
    userName: string | null;
    subscriptions: DraftRef[];
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
 * @see DraftLockService - For lock data
 * @see DraftStateService - For entity state data
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
    private lockService: DraftLockService;
    private stateService: DraftStateService;

    constructor() {
        this.redis = getRedisClient();
        this.userSessionService = new UserSessionService();
        this.lockService = new DraftLockService();
        this.stateService = new DraftStateService();
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
                // Parse draft type (numeric enum) and ID from key: state:{draftType}:{id}
                const match = key.match(/^state:(\d+):(\d+)$/);
                if (!match) {
                    continue;
                }

                const [, draftTypeStr, idStr] = match;
                const draftType = parseInt(draftTypeStr, 10);
                const id = parseInt(idStr, 10);

                if (isNaN(draftType) || isNaN(id)) {
                    continue;
                }

                // Validate draft type
                if (!isValidDraftType(draftType)) {
                    continue; // Skip invalid draft types
                }

                // Get state to check if it exists and get last updated time
                const stateValue = await this.redis.get(key);
                const hasState = stateValue !== null;

                const metaValue = await this.redis.get(`stateMeta:${draftType}:${id}`);
                let lastUpdated: Date | null = null;
                if (metaValue) {
                    try {
                        const parsed = JSON.parse(metaValue) as { lastUpdated?: string };
                        if (parsed.lastUpdated) {
                            const parsedDate = new Date(parsed.lastUpdated);
                            if (!Number.isNaN(parsedDate.getTime())) {
                                lastUpdated = parsedDate;
                            }
                        }
                    } catch {
                        // Ignore malformed metadata values; admin monitoring should be resilient.
                    }
                }

                states.push({
                    draftType,
                    id,
                    hasState,
                    lastUpdated
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
                // Parse draft type (numeric enum) and ID from key: lock:{draftType}:{id}
                const match = key.match(/^lock:(\d+):(\d+)$/);
                if (!match) {
                    continue;
                }

                const [, draftTypeStr, idStr] = match;
                const draftType = parseInt(draftTypeStr, 10);
                const id = parseInt(idStr, 10);

                if (isNaN(draftType) || isNaN(id)) {
                    continue;
                }

                // Validate draft type
                if (!isValidDraftType(draftType)) {
                    continue; // Skip invalid draft types
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

                const metaValue = await this.redis.get(`lockMeta:${draftType}:${id}`);
                let lockedAt: Date | null = null;
                if (metaValue) {
                    try {
                        const parsed = JSON.parse(metaValue) as { lockedAt?: string };
                        if (parsed.lockedAt) {
                            const parsedDate = new Date(parsed.lockedAt);
                            if (!Number.isNaN(parsedDate.getTime())) {
                                lockedAt = parsedDate;
                            }
                        }
                    } catch {
                        // Ignore malformed metadata values; admin monitoring should be resilient.
                    }
                }

                locks.push({
                    draftType,
                    id,
                    lockedBy,
                    lockedByUserName: lockedByUserName || `User ${lockedBy}`,
                    lockedAt
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
        const wsServer = getWebSocketServerInstance();
        if (!wsServer) {
            return [];
        }

        const snapshot = wsServer.getSubscriptionsSnapshot();
        const results: WebSocketSubscriptionInfo[] = [];

        for (const item of snapshot) {
            const userName = item.userId ? await this.getUserName(item.userId) : null;
            results.push({
                clientId: item.clientId,
                userId: item.userId,
                userName,
                subscriptions: item.subscriptions,
            });
        }

        return results;
    }
}
