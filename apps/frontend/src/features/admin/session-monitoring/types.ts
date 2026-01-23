import type {
    DraftRef,
    AdminSessionInfo,
    DraftStateInfo,
    DraftLockInfo,
    WebSocketSubscriptionInfo
} from '@shared/schema';

/**
 * Entity reference type for tracking which entities a user is viewing/editing.
 * 
 * @deprecated Use DraftRef from @shared/schema instead
 */
export type EntityRef = DraftRef;

/**
 * Admin session information for monitoring.
 * 
 * Re-exported from @shared/schema for convenience.
 */
export type { AdminSessionInfo };

/**
 * Entity state information for monitoring.
 * 
 * Note: lastUpdated is an ISO string (not Date) as per DraftStateInfo schema.
 * 
 * @deprecated Use DraftStateInfo from @shared/schema instead
 */
export type EntityStateInfo = DraftStateInfo;

/**
 * Entity lock information for monitoring.
 * 
 * Note: lockedAt is an ISO string (not Date) as per DraftLockInfo schema.
 * 
 * @deprecated Use DraftLockInfo from @shared/schema instead
 */
export type EntityLockInfo = DraftLockInfo;

/**
 * WebSocket subscription information for monitoring.
 * 
 * Re-exported from @shared/schema for convenience.
 */
export type { WebSocketSubscriptionInfo };
