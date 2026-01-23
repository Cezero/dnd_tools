
import { typedApi } from '@/services/Api';
import {
    AdminSessionsResponseSchema,
    DraftStatesResponseSchema,
    DraftLocksResponseSchema,
    WebSocketSubscriptionsResponseSchema,
    DraftRefRequestSchema,
    DraftSaveResponseSchema,
    type AdminSessionInfo,
    type DraftStateInfo,
    type DraftLockInfo,
    type WebSocketSubscriptionInfo,
} from '@shared/schema';
import { DraftType } from '@shared/static-data';

/**
 * API client for admin session monitoring endpoints.
 * 
 * Provides methods for fetching session monitoring data and
 * performing admin actions like force-releasing locks.
 * 
 * All methods use `typedApi` for type-safe API calls with automatic validation.
 * 
 * @see packages/shared/docs/application-overview/admin-session-monitoring.md - Full documentation
 */
const getAllSessionsApi = typedApi<undefined, typeof AdminSessionsResponseSchema>({
    path: '/admin/sessions',
    method: 'GET',
    responseSchema: AdminSessionsResponseSchema,
});

const getAllEntityStatesApi = typedApi<undefined, typeof DraftStatesResponseSchema>({
    path: '/admin/entity-states',
    method: 'GET',
    responseSchema: DraftStatesResponseSchema,
});

const getAllLocksApi = typedApi<undefined, typeof DraftLocksResponseSchema>({
    path: '/admin/locks',
    method: 'GET',
    responseSchema: DraftLocksResponseSchema,
});

const getAllWebSocketSubscriptionsApi = typedApi<undefined, typeof WebSocketSubscriptionsResponseSchema>({
    path: '/admin/websocket-subscriptions',
    method: 'GET',
    responseSchema: WebSocketSubscriptionsResponseSchema,
});

const forceReleaseLockApi = typedApi<typeof DraftRefRequestSchema, typeof DraftSaveResponseSchema>({
    path: '/admin/locks/force-release',
    method: 'POST',
    requestSchema: DraftRefRequestSchema,
    responseSchema: DraftSaveResponseSchema,
});

export const SessionMonitoringApi = {
    /**
     * Gets all active user sessions.
     * 
     * @returns Promise resolving to array of session information
     * 
     * @example
     * ```typescript
     * const sessions = await SessionMonitoringApi.getAllSessions();
     * ```
     */
    getAllSessions: async (): Promise<AdminSessionInfo[]> => {
        return getAllSessionsApi();
    },

    /**
     * Gets all entity states.
     * 
     * @returns Promise resolving to array of entity state information
     * 
     * @example
     * ```typescript
     * const states = await SessionMonitoringApi.getAllEntityStates();
     * ```
     */
    getAllEntityStates: async (): Promise<DraftStateInfo[]> => {
        return getAllEntityStatesApi();
    },

    /**
     * Gets all entity locks.
     * 
     * @returns Promise resolving to array of entity lock information
     * 
     * @example
     * ```typescript
     * const locks = await SessionMonitoringApi.getAllLocks();
     * ```
     */
    getAllLocks: async (): Promise<DraftLockInfo[]> => {
        return getAllLocksApi();
    },

    /**
     * Gets all WebSocket subscriptions.
     * 
     * @returns Promise resolving to array of WebSocket subscription information
     * 
     * @example
     * ```typescript
     * const subscriptions = await SessionMonitoringApi.getAllWebSocketSubscriptions();
     * ```
     */
    getAllWebSocketSubscriptions: async (): Promise<WebSocketSubscriptionInfo[]> => {
        return getAllWebSocketSubscriptionsApi();
    },

    /**
     * Force releases a lock on a draft.
     * 
     * @param draftType - The draft type (e.g., DraftType.Feature, DraftType.Class, DraftType.Race, DraftType.Character)
     * @param id - The draft ID
     * @returns Promise resolving to success response
     * 
     * @example
     * ```typescript
     * await SessionMonitoringApi.forceReleaseLock(DraftType.Feature, 123);
     * ```
     */
    forceReleaseLock: async (draftType: DraftType, id: number): Promise<{ success: boolean }> => {
        return forceReleaseLockApi({ draftType, id });
    },
};
