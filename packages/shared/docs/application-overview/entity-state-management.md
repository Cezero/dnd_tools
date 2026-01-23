# Entity State Management

*Decoupled entity state management system using Redis for real-time state synchronization.*

## 📋 **Overview**

The entity state management system provides a decoupled architecture for managing entity states independently of user sessions. Entity states are stored in Redis and propagated in real-time to all viewing clients via Redis Pub/Sub and WebSocket connections.

**Key Concepts**:
- **Decoupled Sessions**: User sessions track which entities are being viewed/edited, separate from entity states
- **Independent Entity States**: Each entity has its own state stored in Redis (`state:{entityType}:{entityId}`)
- **Real-time Propagation**: State updates propagate to all viewing clients via Redis Pub/Sub and WebSocket
- **Explicit Persistence**: States are persisted to MySQL database only on explicit "save" commands
- **Context-aware Locking**: Long-lived locks for admin editing, message ordering for game sessions

**Source Files**:
- `apps/backend/src/features/shared/entityState/EntityStateService.ts`
- `apps/backend/src/features/shared/entityState/EntityLockService.ts`
- `apps/backend/src/features/shared/entityState/EntityStatePubSub.ts`
- `apps/backend/src/features/shared/session/UserSessionService.ts`

## 🏗️ **Architecture**

### **State Storage**

Entity states are stored in Redis with a consistent key pattern:

```
state:{entityType}:{entityId}
```

**Examples**:
- `state:class:1` - State for class with ID 1
- `state:feature:5` - State for feature with ID 5
- `state:character:10` - State for character with ID 10

**State Structure**: The state contains the full entity data (e.g., `FeatureWithRelations` for features, `ClassEditState` for classes).

### **Session Management**

User sessions track which entities a user is viewing or editing:

```
session:user:{userId}
```

**Session Structure**:
- `viewing`: Array of entities the user is viewing (subscribed to state updates)
- `editing`: Array of entities the user is editing (has locks on)

### **Lock Management**

Entity locks prevent concurrent editing:

```
lock:{entityType}:{entityId} -> userId
```

**Lock Types**:
- **Admin Locks**: Long-lived locks for admin editing contexts (Class, Feature, Race)
- **Game Session Locks**: Message ordering for dynamic game session entities (Character)

## 🔄 **State Update Flow**

### **1. State Update**

When an entity state is updated:

```typescript
// Backend service updates state
await entityStateService.setState('feature', 123, updatedState);

// State is stored in Redis
// Redis key: state:feature:123

// Update is published to Redis Pub/Sub channel
// Channel: channel:state:feature:123
```

## ✍️ **Draft editing: path-based updates (`updateValue`)**

Admin editing for **Class**, **Race**, and **Feature** uses the draft system (Redis-backed) with a path-based update endpoint:

- **Route**: `PUT /drafts/update-value`
- **Source**:
  - Backend routes: `apps/backend/src/features/shared/draftState/draftRoutes.ts`
  - Controller: `apps/backend/src/features/shared/draftState/draftController.ts`
  - Update service: `apps/backend/src/features/shared/draftState/StateUpdateService.ts`
  - Path logic: `apps/backend/src/features/shared/utils/pathParser.ts`
  - Request/response schemas: `packages/shared/schema/src/state.ts`
  - Draft action enum: `packages/shared/static-data/src/DraftData.ts`

### **Request shape**

The request body is validated by `UpdateStateValueSchema` (`packages/shared/schema/src/state.ts`):

- **draftType**: numeric enum (`DraftType`)
- **id**: **draft id (non-zero)**. For new drafts, call `POST /drafts/start-editing` with `id = 0` first, and use the **minted negative id** returned in `StartEditingResponse.id`.
- **path**: dot-notation path
- **value**: scalar (`string | number | boolean | null`)
- **action**: optional `DraftAction` (defaults to Update)

### **New drafts: minted negative ids**

New drafts are created with a **minted negative id** to avoid collisions and to keep the draft id consistent with the draft state's internal id fields:

- **Start**: `POST /drafts/start-editing` with `{ draftType, id: 0 }`
- **Response**: `{ success: true, draftType, id: <negativeDraftId> }`
- **State keys**: the draft is stored under `state:{draftType}:{negativeDraftId}` and locked under `lock:{draftType}:{negativeDraftId}`
- **Internal ids**:
  - Feature drafts: `state.id === negativeDraftId`
  - Class drafts: `state.classId === negativeDraftId`
  - Race drafts: `state.raceId === negativeDraftId`

After minting, **all subsequent draft operations** (`update-value`, `save`, `cancel`) must use the **minted negative id**.

### **Save behavior: create vs update**

`POST /drafts/save` persists the Redis draft to the database:

- **Create**: \(id < 0\) → validate/transform using the **Create** schema (no id field) and create a new database row. The response returns the new **positive** database id.
- **Update**: \(id > 0\) → validate/transform using the **Update** schema and update the existing database row.

### **DraftAction**

`DraftAction` lives in `@shared/static-data` (`packages/shared/static-data/src/DraftData.ts`) and controls how `value` is applied:

- **Update (0)**: set/overwrite a value at `path`
- **Remove (1)**: delete/remove at `path` (delete key, splice index, or remove element from an array)
- **Add (2)**:
  - append to an array (e.g. `featureIds`)
  - or create a new object in an array-of-objects (see response `id` below)

### **Path syntax: index segments and `byId` selectors**

We support **both** path styles:

- **Index-based segments**: `entities.0.appliesTo` (kept for Zod error paths and paired-index arrays)
- **Selector segments (preferred where possible)**: `entities.byId.<id>.appliesTo`

Selector key fields:

- Default key field is `id`.
- Some arrays use a different unique key field; the backend resolves this via
  `DRAFT_ARRAY_SELECTOR_KEY_FIELD_MAP` (`packages/shared/static-data/src/DraftData.ts`).
  Example: `sourceBookInfo` uses `sourceBookId`, so `sourceBookInfo.byId.<sourceBookId>.pageNumber` works.

### **Response shape: optional `id` for Add-new-object**

`UpdateStateValueResponseSchema` now supports:

- **success**: boolean
- **id?**: number (only when `DraftAction.Add` creates a new nested object)

This `id` is a **draft-stable temporary id** (typically negative) used for nested children of Feature drafts (e.g. Feature `entities` / `prerequisites`):

- Frontend calls `updateValue('entities', 0, DraftAction.Add)`
- Backend appends a new object to the draft array and returns `{ success: true, id: <tempId> }`
- Frontend uses that id in subsequent nested updates via `entities.byId.<tempId>.<field>`

**Important**: for Feature drafts, `DraftAction.Add` for `entities` creates a **fully shaped** `FeatureEntity` (not just an `{ id }` stub), including:

- `id`: minted temporary negative id (returned in the response)
- `featureId`: set to the draft id (the minted negative feature draft id)
- required enum fields (`type`, `appliesTo`) set to safe defaults
- required scalars (`value`, `displayInDetail`, etc.) set to safe defaults

### **2. Pub/Sub Propagation**

Redis Pub/Sub broadcasts the update:

```typescript
// EntityStatePubSub publishes to channel
await pubSub.publish('feature', 123, updatedState);

// All subscribers receive the update
// - WebSocket server (forwards to frontend clients)
// - Other backend services (if needed)
```

### **3. WebSocket Forwarding**

WebSocket server forwards updates to connected clients:

```typescript
// WebSocket server receives Pub/Sub update
pubSub.subscribe('feature', 123, (state) => {
    // Forward to all subscribed clients
    for (const client of subscribedClients) {
        client.send({ type: 'stateUpdate', entityType: 'feature', entityId: 123, state });
    }
});
```

### **4. Frontend Update**

Frontend clients receive and apply updates:

```typescript
// Frontend WebSocket client receives update
wsService.subscribe('feature', 123, (state) => {
    // Invalidate React Query cache to trigger refetch
    queryClient.invalidateQueries({
        queryKey: ['features', 'item', 123]
    });
    
    // React components automatically re-render with fresh data
});
```

## 🔐 **Locking Strategy**

### **Admin Editing Contexts**

For admin editing (Class, Feature, Race):

```typescript
// Acquire lock before editing
const lockAcquired = await lockService.acquireLock('class', 1, userId);

if (!lockAcquired) {
    throw new Error('Entity is locked by another user');
}

// Edit entity state
await entityStateService.setState('class', 1, updatedState);

// Release lock on save or cancel
await lockService.releaseLock('class', 1, userId);
```

**Lock TTL**: Long-lived locks (e.g., 1 hour) for admin editing sessions.

### **Game Session Contexts**

For dynamic game sessions (Character):

```typescript
// No blocking locks - use message ordering
// Updates are applied in order via Redis Pub/Sub
await entityStateService.setState('character', 10, updatedState);
```

**Message Ordering**: Redis Pub/Sub ensures updates are received in order.

## 💾 **Database Persistence**

Entity states are persisted to MySQL only on explicit "save" commands:

```typescript
// Save state to database
await featureStateService.saveFeatureStateToDatabase(featureId);

// State is read from Redis
const state = await featureStateService.getFeatureState(featureId);

// State is persisted to MySQL
await featureSystemService.updateFeature(featureId, state);
```

**Persistence Strategy**:
- States remain in Redis for real-time access
- Database is updated only on explicit save
- Redis state is the source of truth during editing

## 🔗 **Integration Points**

### **Feature System**

Features are managed as independent entities:

```typescript
// Feature state contains full FeatureWithRelations
const featureState: FeatureState = {
    id: 123,
    name: 'Power Attack',
    // ... full feature data
};

// Parent entities (Class, Race) reference features by ID
const classState: ClassEditState = {
    id: 1,
    name: 'Fighter',
    featureIds: [123, 456, 789] // Reference feature IDs
};
```

### **User Sessions**

User sessions track viewing/editing entities:

```typescript
// Add entity to viewing list
await userSessionService.addViewingEntity(userId, { entityType: 'feature', entityId: 123 });

// Set editing entity
await userSessionService.setEditingEntity(userId, { entityType: 'feature', entityId: 123 });
```

## 📊 **State Lifecycle**

### **1. Initialization**

```typescript
// Initialize entity state from database
const state = await featureStateService.initializeFeatureState(featureId);

// State is stored in Redis
// User session is updated
await userSessionService.setEditingEntity(userId, { entityType: 'feature', entityId });
```

### **2. Updates**

```typescript
// Apply incremental update
await featureStateService.updateFeatureState(featureId, update);

// State is updated in Redis
// Update is published via Pub/Sub
// All viewing clients receive update
```

### **3. Persistence**

```typescript
// Save state to database
await featureStateService.saveFeatureStateToDatabase(featureId);

// State is persisted to MySQL
// Redis state remains for continued editing
```

### **4. Cleanup**

```typescript
// Cancel editing session
await userSessionService.clearEditingEntity(userId);

// Lock is released
await lockService.releaseLock('feature', featureId, userId);

// State remains in Redis (for potential reuse)
```

## 🎯 **Benefits**

### **Decoupling**

- **Independent States**: Entity states are independent of user sessions
- **Multiple Viewers**: Multiple users can view the same entity simultaneously
- **Session Flexibility**: User sessions can track multiple entities

### **Real-time Updates**

- **Instant Propagation**: Updates propagate to all viewing clients immediately
- **No Polling**: WebSocket connections eliminate need for polling
- **Efficient**: Redis Pub/Sub provides efficient message distribution

### **Scalability**

- **Redis Performance**: In-memory storage provides fast access
- **Pub/Sub Efficiency**: Redis Pub/Sub scales to many subscribers
- **State Isolation**: Each entity state is independent

### **Flexibility**

- **Context-aware Locking**: Different locking strategies for different contexts
- **Explicit Persistence**: Database updates only when needed
- **State Reuse**: States can remain in Redis for quick access

## 🔍 **Related Documentation**

- [WebSocket State Updates](./websocket-state-updates.md) - WebSocket implementation details
- [Admin Session Monitoring](./admin-session-monitoring.md) - Admin monitoring tools
- [Session State Management](./session-state-management.md) - Legacy session management (being phased out)
