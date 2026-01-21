/**
 * Entity reference type for tracking which entities a user is viewing/editing.
 */
export interface EntityRef {
    entityType: string;
    entityId: number;
}

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
