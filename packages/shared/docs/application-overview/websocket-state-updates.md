# WebSocket State Updates

*Real-time entity state updates via WebSocket connections.*

## 📋 **Overview**

The WebSocket state update system provides real-time bidirectional communication between the frontend and backend for entity state synchronization. Frontend clients subscribe to entity state updates, and the backend forwards Redis Pub/Sub messages to subscribed clients.

**Key Concepts**:
- **WebSocket Server**: Backend server that manages WebSocket connections and subscriptions
- **WebSocket Client**: Frontend service that manages WebSocket connection and subscriptions
- **Subscription Management**: Clients subscribe/unsubscribe to entity state updates
- **Automatic Reconnection**: Client automatically reconnects on connection loss
- **Message Protocol**: JSON-based message protocol for client-server communication

**Source Files**:
- `apps/backend/src/features/shared/websocket/WebSocketServer.ts`
- `apps/frontend/src/lib/services/WebSocketService.ts`
- `apps/frontend/src/lib/hooks/useEntityStateSubscription.ts`
- `apps/frontend/src/lib/hooks/useTopicSubscription.ts`

## 🏗️ **Architecture**

### **Backend WebSocket Server**

The WebSocket server:
1. Accepts WebSocket connections on `/ws` path
2. Extracts and validates user authentication from connection request
3. Manages client subscriptions to entity state updates
4. Subscribes to Redis Pub/Sub channels for subscribed entities
5. Forwards Pub/Sub updates to subscribed clients

### **Frontend WebSocket Client**

The WebSocket client:
1. Connects to backend WebSocket server
2. Manages subscription state across reconnections
3. Handles incoming state updates
4. Automatically reconnects on connection loss

## 📡 **Message Protocol**

### **Client → Server Messages**

#### **Subscribe**

```typescript
{
    type: 'subscribe',
    entityType: string,
    entityId: number
}
```

#### **Unsubscribe**

```typescript
{
    type: 'unsubscribe',
    entityType: string,
    entityId: number
}
```

#### **Subscribe Topic**

Topic subscriptions are for **derived projections** (not DraftTypes). The first topic is `characterResolved`.

```typescript
{
    type: 'subscribeTopic',
    topic: 'characterResolved',
    topicId: number // characterId
}
```

#### **Unsubscribe Topic**

```typescript
{
    type: 'unsubscribeTopic',
    topic: 'characterResolved',
    topicId: number // characterId
}
```

### **Server → Client Messages**

#### **State Update**

```typescript
{
    type: 'stateUpdate',
    entityType: string,
    entityId: number,
    state: T
}
```

#### **Error**

```typescript
{
    type: 'error',
    message: string
}
```

#### **Topic Update**

```typescript
{
    type: 'topicUpdate',
    topic: 'characterResolved',
    topicId: number, // characterId
    payload: ResolvedCharacterResult
}
```

## 🔄 **Subscription Flow**

1. Client subscribes to entity state updates
2. Server subscribes to Redis Pub/Sub channel
3. State update is published to Redis Pub/Sub
4. WebSocket server receives update and forwards to subscribed clients
5. Frontend clients receive and apply updates

### **Topic subscription flow (resolved character)**

For resolved character updates, the backend publishes to a separate Redis channel:

- `channel:character:resolved:{characterId}`

The WebSocket server forwards these as `topicUpdate` messages for clients subscribed to:

- `topic: 'characterResolved'` + `topicId: characterId`

## 🔐 **Authentication**

WebSocket connections are authenticated via JWT tokens in the Authorization header of the upgrade request.

## 🔄 **Reconnection Strategy**

The frontend WebSocket client implements exponential backoff reconnection with automatic subscription restoration.

## 📊 **Multi-Client Subscription Management**

The backend efficiently manages multiple clients subscribing to the same entity by maintaining only one Redis subscription per entity and broadcasting to all subscribed clients.

## 🧰 **Admin monitoring integration**

Admin monitoring can query a read-only snapshot of live WebSocket subscriptions:

- `apps/backend/src/features/shared/websocket/WebSocketServer.ts` (`getSubscriptionsSnapshot`)
- `apps/backend/src/features/shared/websocket/webSocketServerRegistry.ts` (register/get instance)
- `apps/backend/src/features/shared/session/AdminSessionMonitoringService.ts` (`getAllWebSocketSubscriptions`)

## 🎯 **React Hook Integration**

The `useEntityStateSubscription` hook provides React integration with automatic subscription management.

## 🔍 **Related Documentation**

- [Entity State Management](./entity-state-management.md) - Entity state management system
- [Admin Session Monitoring](./admin-session-monitoring.md) - Admin monitoring tools
