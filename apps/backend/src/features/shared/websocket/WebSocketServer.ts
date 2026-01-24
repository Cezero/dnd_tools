import type { Server as HTTPServer , IncomingMessage } from 'http';
import { WebSocketServer as WSServer, WebSocket } from 'ws';

import { WebSocketClientMessageSchema, type WebSocketClientMessage, type WebSocketServerMessage } from '@shared/schema';
import { DraftType } from '@shared/static-data';

import { authService } from '../../auth/authService';
import { DraftStatePubSub } from '../draftState/DraftStatePubSub';

/**
 * Client connection information.
 * 
 * TODO should be in types.ts
 */
interface ClientConnection {
    ws: WebSocket;
    clientId: string;
    userId: number | null;
    subscriptions: Set<string>; // Set of "draftType:entityId" strings (draftType is numeric)
    topicSubscriptions: Set<string>; // Set of "topic:topicId" strings
}

/**
 * WebSocket server for real-time entity state updates.
 * 
 * Subscribes to Redis pub/sub channels and forwards state updates to
 * connected clients. Clients can subscribe/unsubscribe to entity state updates.
 * 
 * **Message Protocol**:
 * 
 * Client → Server:
 * - `{ type: 'subscribe', entityType: string, entityId: number }` - Subscribe to entity state updates
 * - `{ type: 'unsubscribe', entityType: string, entityId: number }` - Unsubscribe from entity state updates
 * 
 * Server → Client:
 * - `{ type: 'stateUpdate', entityType: string, entityId: number, state: T }` - Entity state update
 * - `{ type: 'error', message: string }` - Error message
 * 
 * **Channel Pattern**: `channel:state:{draftType}:{entityId}` (draftType is numeric enum value)
 * 
 * **Authentication**: User authentication should be handled via the initial HTTP upgrade request.
 * The userId is extracted from the request and stored with the client connection.
 * 
 * @see DraftStatePubSub - For Redis pub/sub operations
 * @see packages/shared/docs/application-overview/websocket-state-updates.md - Full documentation
 * 
 * @example
 * ```typescript
 * const httpServer = createHTTPServer();
 * const wsServer = new WebSocketServer();
 * wsServer.initialize(httpServer);
 * 
 * // Clients can now connect and subscribe to entity state updates
 * ```
 */
export class WebSocketServer {
    private wss: WSServer | null = null;
    private clients: Map<string, ClientConnection> = new Map();
    private pubSub: DraftStatePubSub;
    private nextClientId = 1;
    // Track how many clients are subscribed to each entity
    private entitySubscriptions: Map<string, Set<string>> = new Map(); // "draftType:entityId" -> Set of clientIds (draftType is numeric)
    private topicSubscriptions: Map<string, Set<string>> = new Map(); // "topic:topicId" -> Set of clientIds

    constructor() {
        this.pubSub = new DraftStatePubSub();
    }

    /**
     * Initializes the WebSocket server on the HTTP server.
     * 
     * @param server - The HTTP server instance
     * @throws Error if initialization fails
     * 
     * @example
     * ```typescript
     * const httpServer = createHTTPServer();
     * wsServer.initialize(httpServer);
     * ```
     */
    initialize(server: HTTPServer): void {
        if (this.wss) {
            console.warn('WebSocket server already initialized');
            return;
        }

        // Create WebSocket server with path filter
        this.wss = new WSServer({
            server,
            path: '/ws' // Only accept connections on /ws path
        });

        this.wss.on('connection', async (ws: WebSocket, req: IncomingMessage) => {
            try {
                await this.handleClientConnection(ws, req);
            } catch (error) {
                console.error('Error handling WebSocket connection:', error);
                ws.close();
            }
        });

        // Initialize pub/sub service
        this.pubSub.initialize().catch(error => {
            console.error('Failed to initialize pub/sub service:', error);
        });

        console.log('WebSocket server initialized');
    }

    /**
     * Handles a new client connection.
     * 
     * Extracts user ID from the request, creates a client connection,
     * and sets up message handlers.
     * 
     * @param ws - The WebSocket connection
     * @param req - The HTTP request that initiated the connection
     */
    private async handleClientConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
        const clientId = `client-${this.nextClientId++}`;

        // Extract user ID from request (async)
        let userId: number | null = null;
        try {
            userId = await this.extractUserId(req);
        } catch (error: unknown) {
            console.error('Error extracting user ID:', error);
            // Continue with null userId (anonymous connection)
        }

        const connection: ClientConnection = {
            ws,
            clientId,
            userId,
            subscriptions: new Set(),
            topicSubscriptions: new Set(),
        };

        this.clients.set(clientId, connection);

        console.log(`WebSocket client connected: ${clientId} (user: ${userId || 'anonymous'})`);

        // Handle incoming messages
        ws.on('message', (data: Buffer) => {
            try {
                const raw = JSON.parse(data.toString()) as unknown;
                const parsed = WebSocketClientMessageSchema.safeParse(raw);
                if (!parsed.success) {
                    this.sendError(ws, 'Invalid message format');
                    return;
                }
                this.handleClientMessage(clientId, parsed.data);
            } catch (error) {
                console.error(`Error parsing message from client ${clientId}:`, error);
                this.sendError(ws, 'Invalid message format');
            }
        });

        // Handle disconnection
        ws.on('close', () => {
            this.handleClientDisconnect(clientId);
        });

        // Handle errors
        ws.on('error', (error: Error) => {
            console.error(`WebSocket error for client ${clientId}:`, error);
            this.handleClientDisconnect(clientId);
        });
    }

    /**
     * Extracts user ID from the HTTP request.
     * 
     * Extracts JWT token from Authorization header and validates it to get user ID.
     * 
     * @param req - The HTTP request
     * @returns User ID or null if not authenticated
     */
    private async extractUserId(req: IncomingMessage): Promise<number | null> {
        try {
            // Extract token from Authorization header
            const authHeader = req.headers.authorization;
            if (!authHeader?.startsWith('Bearer ')) {
                return null;
            }

            const token = authHeader.split(' ')[1];
            const result = await authService.getUserFromToken(token);

            if (!result.success || !result.user) {
                return null;
            }

            return result.user.id;
        } catch (error) {
            console.error('Error extracting user ID from WebSocket request:', error);
            return null;
        }
    }

    /**
     * Handles a message from a client.
     * 
     * @param clientId - The client ID
     * @param message - The message from the client
     */
    private async handleClientMessage(clientId: string, message: WebSocketClientMessage): Promise<void> {
        const connection = this.clients.get(clientId);
        if (!connection) {
            console.error(`Client ${clientId} not found`);
            return;
        }

        switch (message.type) {
            case 'subscribe':
                await this.handleSubscribe(clientId, message.entityType, message.entityId);
                break;

            case 'unsubscribe':
                await this.handleUnsubscribe(clientId, message.entityType, message.entityId);
                break;

            case 'subscribeTopic':
                await this.handleSubscribeTopic(clientId, message.topic, message.topicId);
                break;

            case 'unsubscribeTopic':
                await this.handleUnsubscribeTopic(clientId, message.topic, message.topicId);
                break;

            default:
                this.sendError(connection.ws, 'Unknown message type');
        }
    }

    private buildTopicChannel(topic: 'characterResolved', topicId: number): string {
        switch (topic) {
            case 'characterResolved':
                return `channel:character:resolved:${topicId}`;
            default: {
                const _exhaustive: never = topic;
                return _exhaustive;
            }
        }
    }

    private async handleSubscribeTopic(clientId: string, topic: 'characterResolved', topicId: number): Promise<void> {
        const connection = this.clients.get(clientId);
        if (!connection) {
            return;
        }

        const subscriptionKey = `${topic}:${topicId}`;
        if (connection.topicSubscriptions.has(subscriptionKey)) {
            return;
        }

        const channel = this.buildTopicChannel(topic, topicId);

        try {
            if (!this.topicSubscriptions.has(subscriptionKey)) {
                this.topicSubscriptions.set(subscriptionKey, new Set());

                await this.pubSub.subscribeChannel(channel, (payload) => {
                    const clientIds = this.topicSubscriptions.get(subscriptionKey);
                    if (!clientIds) {
                        return;
                    }

                    for (const subscribedClientId of clientIds) {
                        const subscribedConnection = this.clients.get(subscribedClientId);
                        if (subscribedConnection) {
                            this.sendTopicUpdate(subscribedConnection.ws, topic, topicId, payload);
                        }
                    }
                });
            }

            this.topicSubscriptions.get(subscriptionKey)!.add(clientId);
            connection.topicSubscriptions.add(subscriptionKey);
            console.log(`Client ${clientId} subscribed to topic ${topic}:${topicId}`);
        } catch (error) {
            console.error(`Error subscribing client ${clientId} to topic ${topic}:${topicId}:`, error);
            this.sendError(connection.ws, `Failed to subscribe to topic ${topic}:${topicId}`);
        }
    }

    private async handleUnsubscribeTopic(clientId: string, topic: 'characterResolved', topicId: number): Promise<void> {
        const connection = this.clients.get(clientId);
        if (!connection) {
            return;
        }

        const subscriptionKey = `${topic}:${topicId}`;
        if (!connection.topicSubscriptions.has(subscriptionKey)) {
            return;
        }

        const channel = this.buildTopicChannel(topic, topicId);

        try {
            const clientIds = this.topicSubscriptions.get(subscriptionKey);
            if (clientIds) {
                clientIds.delete(clientId);
                if (clientIds.size === 0) {
                    await this.pubSub.unsubscribeChannel(channel);
                    this.topicSubscriptions.delete(subscriptionKey);
                }
            }

            connection.topicSubscriptions.delete(subscriptionKey);
            console.log(`Client ${clientId} unsubscribed from topic ${topic}:${topicId}`);
        } catch (error) {
            console.error(`Error unsubscribing client ${clientId} from topic ${topic}:${topicId}:`, error);
            this.sendError(connection.ws, `Failed to unsubscribe from topic ${topic}:${topicId}`);
        }
    }

    /**
     * Handles a client subscription to an entity state.
     * 
     * @param clientId - The client ID
     * @param entityType - The entity type (string representation of numeric DraftType from frontend)
     * @param entityId - The entity ID
     */
    private async handleSubscribe(clientId: string, entityType: string, entityId: number): Promise<void> {
        const connection = this.clients.get(clientId);
        if (!connection) {
            return;
        }

        // Parse string entityType to numeric DraftType enum
        const draftType = parseInt(entityType, 10) as DraftType;
        if (isNaN(draftType) || !Object.values(DraftType).includes(draftType)) {
            this.sendError(connection.ws, `Invalid entity type: ${entityType}`);
            return;
        }

        const subscriptionKey = `${draftType}:${entityId}`;

        if (connection.subscriptions.has(subscriptionKey)) {
            // Already subscribed
            return;
        }

        try {
            // Track this client's subscription
            if (!this.entitySubscriptions.has(subscriptionKey)) {
                this.entitySubscriptions.set(subscriptionKey, new Set());

                // Subscribe to Redis pub/sub channel (only once per entity, regardless of client count)
                await this.pubSub.subscribe(draftType, entityId, (state) => {
                    // Broadcast to all clients subscribed to this entity
                    const clientIds = this.entitySubscriptions.get(subscriptionKey);
                    if (clientIds) {
                        for (const subscribedClientId of clientIds) {
                            const subscribedConnection = this.clients.get(subscribedClientId);
                            if (subscribedConnection) {
                                this.sendStateUpdate(subscribedConnection.ws, draftType, entityId, state);
                            }
                        }
                    }
                });
            }

            // Add this client to the entity's subscription set
            this.entitySubscriptions.get(subscriptionKey)!.add(clientId);
            connection.subscriptions.add(subscriptionKey);
            console.log(`Client ${clientId} subscribed to ${draftType}:${entityId}`);
        } catch (error) {
            console.error(`Error subscribing client ${clientId} to ${draftType}:${entityId}:`, error);
            this.sendError(connection.ws, `Failed to subscribe to ${draftType}:${entityId}`);
        }
    }

    /**
     * Handles a client unsubscription from an entity state.
     * 
     * @param clientId - The client ID
     * @param entityType - The entity type (string representation of numeric DraftType from frontend)
     * @param entityId - The entity ID
     */
    private async handleUnsubscribe(clientId: string, entityType: string, entityId: number): Promise<void> {
        const connection = this.clients.get(clientId);
        if (!connection) {
            return;
        }

        // Parse string entityType to numeric DraftType enum
        const draftType = parseInt(entityType, 10) as DraftType;
        if (isNaN(draftType) || !Object.values(DraftType).includes(draftType)) {
            this.sendError(connection.ws, `Invalid entity type: ${entityType}`);
            return;
        }

        const subscriptionKey = `${draftType}:${entityId}`;

        if (!connection.subscriptions.has(subscriptionKey)) {
            // Not subscribed
            return;
        }

        try {
            // Remove this client from the entity's subscription set
            const clientIds = this.entitySubscriptions.get(subscriptionKey);
            if (clientIds) {
                clientIds.delete(clientId);

                // If no more clients are subscribed, unsubscribe from Redis
                if (clientIds.size === 0) {
                    await this.pubSub.unsubscribe(draftType, entityId);
                    this.entitySubscriptions.delete(subscriptionKey);
                }
            }

            connection.subscriptions.delete(subscriptionKey);
            console.log(`Client ${clientId} unsubscribed from ${draftType}:${entityId}`);
        } catch (error) {
            console.error(`Error unsubscribing client ${clientId} from ${draftType}:${entityId}:`, error);
            this.sendError(connection.ws, `Failed to unsubscribe from ${draftType}:${entityId}`);
        }
    }

    /**
     * Handles client disconnection.
     * 
     * Unsubscribes from all subscriptions and removes the client.
     * 
     * @param clientId - The client ID
     */
    private async handleClientDisconnect(clientId: string): Promise<void> {
        const connection = this.clients.get(clientId);
        if (!connection) {
            return;
        }

        // Unsubscribe from all subscriptions
        for (const subscriptionKey of connection.subscriptions) {
            const [draftTypeStr, entityIdStr] = subscriptionKey.split(':');
            const draftType = parseInt(draftTypeStr, 10) as DraftType;
            const entityId = parseInt(entityIdStr, 10);

            if (!isNaN(draftType) && !isNaN(entityId) && Object.values(DraftType).includes(draftType)) {
                try {
                    // Remove this client from the entity's subscription set
                    const clientIds = this.entitySubscriptions.get(subscriptionKey);
                    if (clientIds) {
                        clientIds.delete(clientId);

                        // If no more clients are subscribed, unsubscribe from Redis
                        if (clientIds.size === 0) {
                            await this.pubSub.unsubscribe(draftType, entityId);
                            this.entitySubscriptions.delete(subscriptionKey);
                        }
                    }
                } catch (error) {
                    console.error(`Error unsubscribing ${clientId} from ${subscriptionKey}:`, error);
                }
            }
        }

        // Unsubscribe from all topic subscriptions
        for (const topicKey of connection.topicSubscriptions) {
            const [topic, topicIdStr] = topicKey.split(':');
            const topicId = parseInt(topicIdStr, 10);

            if (Number.isNaN(topicId)) {
                continue;
            }

            try {
                const clientIds = this.topicSubscriptions.get(topicKey);
                if (clientIds) {
                    clientIds.delete(clientId);
                    if (clientIds.size === 0) {
                        await this.pubSub.unsubscribeChannel(this.buildTopicChannel(topic as 'characterResolved', topicId));
                        this.topicSubscriptions.delete(topicKey);
                    }
                }
            } catch (error) {
                console.error(`Error unsubscribing ${clientId} from topic ${topicKey}:`, error);
            }
        }

        this.clients.delete(clientId);
        console.log(`WebSocket client disconnected: ${clientId}`);
    }

    /**
     * Sends a state update to a client.
     * 
     * @param ws - The WebSocket connection
     * @param draftType - The draft type (numeric enum value)
     * @param entityId - The entity ID
     * @param state - The updated state
     */
    private sendStateUpdate(ws: WebSocket, draftType: DraftType, entityId: number, state: unknown): void {
        const message: WebSocketServerMessage = {
            type: 'stateUpdate',
            entityType: String(draftType), // Send as string for frontend compatibility
            entityId,
            state
        };

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    /**
     * Sends an error message to a client.
     * 
     * @param ws - The WebSocket connection
     * @param message - The error message
     */
    private sendError(ws: WebSocket, message: string): void {
        const errorMessage: WebSocketServerMessage = {
            type: 'error',
            message
        };

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(errorMessage));
        }
    }

    private sendTopicUpdate(ws: WebSocket, topic: 'characterResolved', topicId: number, payload: unknown): void {
        const message: WebSocketServerMessage = {
            type: 'topicUpdate',
            topic,
            topicId,
            payload,
        };

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }

    /**
     * Broadcasts a state update to all subscribed clients.
     * 
     * This is called by DraftStateService when state is updated.
     * 
     * @param draftType - The draft type (numeric enum value)
     * @param entityId - The entity ID
     * @param state - The updated state
     */
    async broadcastStateUpdate<T>(draftType: DraftType, entityId: number, state: T): Promise<void> {
        const subscriptionKey = `${draftType}:${entityId}`;

        for (const [_clientId, connection] of this.clients.entries()) {
            if (connection.subscriptions.has(subscriptionKey)) {
                this.sendStateUpdate(connection.ws, draftType, entityId, state);
            }
        }
    }

    /**
     * Returns a read-only snapshot of current client subscriptions.
     *
     * This is used by admin monitoring endpoints to show live WebSocket subscription state
     * without exposing raw sockets or internal mutable structures.
     */
    getSubscriptionsSnapshot(): Array<{ clientId: string; userId: number | null; subscriptions: Array<{ draftType: DraftType; id: number }> }> {
        const snapshot: Array<{ clientId: string; userId: number | null; subscriptions: Array<{ draftType: DraftType; id: number }> }> = [];

        for (const connection of this.clients.values()) {
            const subscriptions: Array<{ draftType: DraftType; id: number }> = [];

            for (const subscriptionKey of connection.subscriptions) {
                const [draftTypeStr, entityIdStr] = subscriptionKey.split(':');
                const draftType = parseInt(draftTypeStr, 10) as DraftType;
                const entityId = parseInt(entityIdStr, 10);

                if (Number.isNaN(draftType) || Number.isNaN(entityId)) {
                    continue;
                }

                if (!Object.values(DraftType).includes(draftType)) {
                    continue;
                }

                subscriptions.push({ draftType, id: entityId });
            }

            snapshot.push({
                clientId: connection.clientId,
                userId: connection.userId,
                subscriptions
            });
        }

        return snapshot;
    }

    /**
     * Closes the WebSocket server and cleans up resources.
     */
    async close(): Promise<void> {
        // Close all client connections
        for (const connection of this.clients.values()) {
            connection.ws.close();
        }
        this.clients.clear();

        // Close pub/sub service
        await this.pubSub.close();

        // Close WebSocket server
        if (this.wss) {
            return new Promise((resolve) => {
                this.wss!.close(() => {
                    this.wss = null;
                    resolve();
                });
            });
        }
    }
}
