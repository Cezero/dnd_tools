# Admin Session Monitoring

*Administrative tools for monitoring user sessions, entity states, locks, and WebSocket subscriptions.*

## 📋 **Overview**

The admin session monitoring system provides comprehensive monitoring capabilities for administrators to view and manage all active sessions, entity states, locks, and WebSocket subscriptions in the system.

**Key Features**:
- **User Session Monitoring**: View all active user sessions and their viewing/editing entities
- **Entity State Monitoring**: View all entity states in Redis
- **Lock Monitoring**: View all active entity locks and force-release locks
- **WebSocket Subscription Monitoring**: View all active WebSocket subscriptions

**Source Files**:
- `apps/backend/src/features/shared/session/AdminSessionMonitoringService.ts`
- `apps/backend/src/features/shared/session/AdminSessionMonitoringController.ts`
- `apps/frontend/src/features/admin/session-monitoring/SessionMonitoringPage.tsx`

## 🏗️ **Architecture**

### **Backend Service**

The `AdminSessionMonitoringService` provides methods to:
- Query all user sessions from Redis
- Query all entity states from Redis
- Query all entity locks from Redis
- Query all WebSocket subscriptions

### **Backend Controller**

The `AdminSessionMonitoringController` provides REST API endpoints:
- `GET /api/admin/sessions` - Get all user sessions
- `GET /api/admin/entity-states` - Get all entity states
- `GET /api/admin/locks` - Get all entity locks
- `GET /api/admin/websocket-subscriptions` - Get all WebSocket subscriptions
- `POST /api/admin/locks/:entityType/:entityId/force-release` - Force release a lock

### **Frontend Page**

The `SessionMonitoringPage` displays:
- Table of all user sessions
- Table of all entity states
- Table of all entity locks with force-release action
- Table of all WebSocket subscriptions

## 🔐 **Access Control**

All admin monitoring endpoints require:
1. **Authentication**: User must be authenticated
2. **Admin Authorization**: User must have admin privileges

**Middleware**:
```typescript
// All routes require admin authentication
AdminSessionMonitoringRouter.use(requireAdmin);
```

## 📊 **Data Structures**

### **AdminSessionInfo**

```typescript
interface AdminSessionInfo {
    userId: number;
    userName: string;
    viewing: DraftRef[];
    editing: DraftRef[];
    sessionKey: string;
}
```

**Fields**:
- `userId`: User ID
- `userName`: User name (fetched from user profile service)
- `viewing`: Array of entities the user is viewing
- `editing`: Array of entities the user is editing
- `sessionKey`: Redis key for the session

### **EntityStateInfo**

```typescript
interface EntityStateInfo {
    draftType: number;
    id: number;
    hasState: boolean;
    lastUpdated: Date | null;
}
```

**Fields**:
- `entityType`: Entity type (e.g., 'class', 'feature', 'character')
- `entityId`: Entity ID
- `hasState`: Whether state exists in Redis
- `lastUpdated`: Last update timestamp (if available)

### **EntityLockInfo**

```typescript
interface EntityLockInfo {
    draftType: number;
    id: number;
    lockedBy: number;
    lockedByUserName: string | null;
    lockedAt: Date | null;
}
```

**Fields**:
- `entityType`: Entity type
- `entityId`: Entity ID
- `lockedBy`: User ID of the user holding the lock
- `lockedByUserName`: User name of the user holding the lock
- `lockedAt`: Lock acquisition timestamp (if available)

### **WebSocketSubscriptionInfo**

```typescript
interface WebSocketSubscriptionInfo {
    clientId: string;
    userId: number | null;
    userName: string | null;
    subscriptions: DraftRef[];
}
```

**Fields**:
- `clientId`: WebSocket client ID
- `userId`: User ID (if authenticated)
- `userName`: User name (if authenticated)
- `subscriptions`: Array of entities the client is subscribed to

## 🔧 **Force Release Lock**

Administrators can force-release locks on entities:

```typescript
// Force release lock
await SessionMonitoringApi.forceReleaseLock('feature', 123);

// Backend implementation
await lockService.forceReleaseLock('feature', 123, adminUserId);
```

**Use Cases**:
- **Stuck Locks**: Release locks that are stuck due to client disconnection
- **Emergency Access**: Force release locks for emergency access
- **Debugging**: Release locks during development and debugging

**Security**: Only administrators can force-release locks.

## 📈 **User Name Resolution**

The service fetches user names from the user profile service:

```typescript
private async getUserName(userId: number): Promise<string | null> {
    const profile = await userProfileService.getUserProfile(userId);
    return profile?.username || null;
}
```

**Fallback**: If user name cannot be fetched, displays `User {userId}`.

## 🔍 **Query Patterns**

### **User Sessions**

```typescript
// Get all session keys
const sessionKeys = await redis.keys('session:user:*');

// For each session key
for (const key of sessionKeys) {
    const userId = extractUserId(key);
    const session = await userSessionService.getUserSession(userId);
    // ... process session
}
```

### **Entity States**

```typescript
// Get all state keys
const stateKeys = await redis.keys('state:*');

// Parse draftType and id from key (DraftType is numeric)
for (const key of stateKeys) {
    const match = key.match(/^state:(\d+):(\d+)$/);
    const [, draftType, id] = match;
    // ... process state + stateMeta
}
```

### **Entity Locks**

```typescript
// Get all lock keys
const lockKeys = await redis.keys('lock:*');

// Parse draftType and id from key (DraftType is numeric)
for (const key of lockKeys) {
    const match = key.match(/^lock:(\d+):(\d+)$/);
    const [, draftType, id] = match;
    const lockedBy = await redis.get(key);
    // ... process lock + lockMeta
}
```

## 🕒 **State/Lock timestamps (metadata keys)**

Admin monitoring surfaces timestamps via small Redis metadata keys written alongside state/lock keys:

- **Draft state**:
  - `state:{draftType}:{id}` → JSON draft state
  - `stateMeta:{draftType}:{id}` → `{ "lastUpdated": "<ISO timestamp>" }`
- **Draft lock**:
  - `lock:{draftType}:{id}` → `userId`
  - `lockMeta:{draftType}:{id}` → `{ "lockedAt": "<ISO timestamp>" }`

These are written by:

- `apps/backend/src/features/shared/draftState/DraftStateService.ts` (`setState`)
- `apps/backend/src/features/shared/draftState/DraftLockService.ts` (`acquireLock` refresh / create)

## 📡 **WebSocket subscription reporting**

WebSocket subscription reporting is powered by a read-only snapshot API on the running WebSocket server:

- `apps/backend/src/features/shared/websocket/WebSocketServer.ts` (`getSubscriptionsSnapshot`)
- `apps/backend/src/features/shared/websocket/webSocketServerRegistry.ts` (register/get instance)
- `apps/backend/src/index.ts` (registers instance at startup)

## 🎯 **Frontend Integration**

The admin monitoring page is accessible at `/admin/session-monitoring`:

```typescript
// Route configuration
{
    path: '/admin/session-monitoring',
    component: SessionMonitoringPage,
    requireAuth: true,
    requireAdmin: true
}
```

**Features**:
- **Real-time Refresh**: Manual refresh button to reload data
- **Force Release**: Action buttons to force-release locks
- **User Name Display**: Shows user names instead of just IDs
- **Entity Reference Display**: Shows entity type and ID for all references

## 🔍 **Related Documentation**

- [Entity State Management](./entity-state-management.md) - Entity state management system
- [Entity Locking](./entity-locking.md) - Draft lock keying and TTL behavior
- [WebSocket State Updates](./websocket-state-updates.md) - WebSocket implementation details
