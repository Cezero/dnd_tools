import { WebSocketServer as WSServer, WebSocket } from 'ws';
import type { Server as HTTPServer } from 'http';
import type { IncomingMessage } from 'http';

import { authService } from '../../auth/authService';
import { EntityStatePubSub } from '../entityState/EntityStatePubSub';

/**
 * WebSocket message types for client-server communication.
 */
interface SubscribeMessage {
    type: 'subscribe';
    entityType: string;
    entityId: number;
}

interface UnsubscribeMessage {
    type: 'unsubscribe';
    entityType: string;
    entityId: number;
}

type ClientMessage = SubscribeMessage | UnsubscribeMessage;

interface StateUpdateMessage {
    type: 'stateUpdate';
    entityType: string;
    entityId: number;
    state: unknown;
}

interface ErrorMessage {
    type: 'error';
    message: string;
}

type ServerMessage = StateUpdateMessage | ErrorMessage;

/**
 * Client connection information.
 */
interface ClientConnection {
    ws: WebSocket;
    clientId: string;
    userId: number | null;
    subscriptions: Set<string>; // Set of "entityType:entityId" strings
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
 * **Channel Pattern**: `channel:state:{entityType}:{entityId}`
 * 
 * **Authentication**: User authentication should be handled via the initial HTTP upgrade request.
 * The userId is extracted from the request and stored with the client connection.
 * 
 * @see EntityStatePubSub - For Redis pub/sub operations
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
    private pubSub: EntityStatePubSub;
    private nextClientId = 1;
    // Track how many clients are subscribed to each entity
    private entitySubscriptions: Map<string, Set<string>> = new Map(); // "entityType:entityId" -> Set of clientIds

    constructor() {
        this.pubSub = new EntityStatePubSub();
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
            subscriptions: new Set()
        };

        this.clients.set(clientId, connection);

        console.log(`WebSocket client connected: ${clientId} (user: ${userId || 'anonymous'})`);

        // Handle incoming messages
        ws.on('message', (data: Buffer) => {
            try {
                const message: ClientMessage = JSON.parse(data.toString());
                this.handleClientMessage(clientId, message);
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
    private async handleClientMessage(clientId: string, message: ClientMessage): Promise<void> {
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

            default:
                this.sendError(connection.ws, `Unknown message type: ${(message as { type: string }).type}`);
        }
    }

    /**
     * Handles a client subscription to an entity state.
     * 
     * @param clientId - The client ID
     * @param entityType - The entity type
     * @param entityId - The entity ID
     */
    private async handleSubscribe(clientId: string, entityType: string, entityId: number): Promise<void> {
        const connection = this.clients.get(clientId);
        if (!connection) {
            return;
        }

        const subscriptionKey = `${entityType}:${entityId}`;

        if (connection.subscriptions.has(subscriptionKey)) {
            // Already subscribed
            return;
        }

        try {
            // Track this client's subscription
            if (!this.entitySubscriptions.has(subscriptionKey)) {
                this.entitySubscriptions.set(subscriptionKey, new Set());

                // Subscribe to Redis pub/sub channel (only once per entity, regardless of client count)
                await this.pubSub.subscribe(entityType, entityId, (state) => {
                    // Broadcast to all clients subscribed to this entity
                    const clientIds = this.entitySubscriptions.get(subscriptionKey);
                    if (clientIds) {
                        for (const subscribedClientId of clientIds) {
                            const subscribedConnection = this.clients.get(subscribedClientId);
                            if (subscribedConnection) {
                                this.sendStateUpdate(subscribedConnection.ws, entityType, entityId, state);
                            }
                        }
                    }
                });
            }

            // Add this client to the entity's subscription set
            this.entitySubscriptions.get(subscriptionKey)!.add(clientId);
            connection.subscriptions.add(subscriptionKey);
            console.log(`Client ${clientId} subscribed to ${entityType}:${entityId}`);
        } catch (error) {
            console.error(`Error subscribing client ${clientId} to ${entityType}:${entityId}:`, error);
            this.sendError(connection.ws, `Failed to subscribe to ${entityType}:${entityId}`);
        }
    }

    /**
     * Handles a client unsubscription from an entity state.
     * 
     * @param clientId - The client ID
     * @param entityType - The entity type
     * @param entityId - The entity ID
     */
    private async handleUnsubscribe(clientId: string, entityType: string, entityId: number): Promise<void> {
        const connection = this.clients.get(clientId);
        if (!connection) {
            return;
        }

        const subscriptionKey = `${entityType}:${entityId}`;

        if (!connection.subscriptions.has(subscriptionKey)) {
            // Not subscribed
            return;
        }

        try {
            // Unsubscribe from Redis pub/sub channel
            await this.pubSub.unsubscribe(entityType, entityId);

            connection.subscriptions.delete(subscriptionKey);
            console.log(`Client ${clientId} unsubscribed from ${entityType}:${entityId}`);
        } catch (error) {
            console.error(`Error unsubscribing client ${clientId} from ${entityType}:${entityId}:`, error);
            this.sendError(connection.ws, `Failed to unsubscribe from ${entityType}:${entityId}`);
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
            const [entityType, entityIdStr] = subscriptionKey.split(':');
            const entityId = parseInt(entityIdStr, 10);

            if (!isNaN(entityId)) {
                try {
                    // Remove this client from the entity's subscription set
                    const clientIds = this.entitySubscriptions.get(subscriptionKey);
                    if (clientIds) {
                        clientIds.delete(clientId);

                        // If no more clients are subscribed, unsubscribe from Redis
                        if (clientIds.size === 0) {
                            await this.pubSub.unsubscribe(entityType, entityId);
                            this.entitySubscriptions.delete(subscriptionKey);
                        }
                    }
                } catch (error) {
                    console.error(`Error unsubscribing ${clientId} from ${subscriptionKey}:`, error);
                }
            }
        }

        this.clients.delete(clientId);
        console.log(`WebSocket client disconnected: ${clientId}`);
    }

    /**
     * Sends a state update to a client.
     * 
     * @param ws - The WebSocket connection
     * @param entityType - The entity type
     * @param entityId - The entity ID
     * @param state - The updated state
     */
    private sendStateUpdate(ws: WebSocket, entityType: string, entityId: number, state: unknown): void {
        const message: StateUpdateMessage = {
            type: 'stateUpdate',
            entityType,
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
        const errorMessage: ErrorMessage = {
            type: 'error',
            message
        };

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(errorMessage));
        }
    }

    /**
     * Broadcasts a state update to all subscribed clients.
     * 
     * This is called by EntityStateService when state is updated.
     * 
     * @param entityType - The entity type
     * @param entityId - The entity ID
     * @param state - The updated state
     */
    async broadcastStateUpdate<T>(entityType: string, entityId: number, state: T): Promise<void> {
        const subscriptionKey = `${entityType}:${entityId}`;

        for (const [clientId, connection] of this.clients.entries()) {
            if (connection.subscriptions.has(subscriptionKey)) {
                this.sendStateUpdate(connection.ws, entityType, entityId, state);
            }
        }
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
