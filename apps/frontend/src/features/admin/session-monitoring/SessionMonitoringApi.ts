import { Api } from '@/services/Api';

import type {
    AdminSessionInfo,
    EntityStateInfo,
    EntityLockInfo,
    WebSocketSubscriptionInfo
} from './types';

/**
 * API client for admin session monitoring endpoints.
 * 
 * Provides methods for fetching session monitoring data and
 * performing admin actions like force-releasing locks.
 * 
 * @see packages/shared/docs/application-overview/admin-session-monitoring.md - Full documentation
 */
export const SessionMonitoringApi = {
    /**
     * Gets all active user sessions.
     * 
     * @returns Promise resolving to array of session information
     */
    getAllSessions: async (): Promise<AdminSessionInfo[]> => {
        return Api<AdminSessionInfo[]>('/admin/sessions', {
            method: 'GET',
        });
    },

    /**
     * Gets all entity states.
     * 
     * @returns Promise resolving to array of entity state information
     */
    getAllEntityStates: async (): Promise<EntityStateInfo[]> => {
        return Api<EntityStateInfo[]>('/admin/entity-states', {
            method: 'GET',
        });
    },

    /**
     * Gets all entity locks.
     * 
     * @returns Promise resolving to array of entity lock information
     */
    getAllLocks: async (): Promise<EntityLockInfo[]> => {
        return Api<EntityLockInfo[]>('/admin/locks', {
            method: 'GET',
        });
    },

    /**
     * Gets all WebSocket subscriptions.
     * 
     * @returns Promise resolving to array of WebSocket subscription information
     */
    getAllWebSocketSubscriptions: async (): Promise<WebSocketSubscriptionInfo[]> => {
        return Api<WebSocketSubscriptionInfo[]>('/admin/websocket-subscriptions', {
            method: 'GET',
        });
    },

    /**
     * Force releases a lock on an entity.
     * 
     * @param entityType - The entity type
     * @param entityId - The entity ID
     * @returns Promise resolving to success response
     */
    forceReleaseLock: async (entityType: string, entityId: number): Promise<{ success: boolean }> => {
        return Api<{ success: boolean }>(`/admin/locks/${entityType}/${entityId}/force-release`, {
            method: 'POST',
        });
    },
};
