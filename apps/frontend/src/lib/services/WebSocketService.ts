import { DraftType } from '@shared/static-data';

/**
 * WebSocket client service for real-time entity state updates.
 * 
 * Provides a connection to the backend WebSocket server and manages
 * subscriptions to entity state updates.
 * 
 * **Message Protocol**:
 * 
 * Client → Server:
 * - `{ type: 'subscribe', entityType: string, entityId: number }` - Subscribe to entity state updates
 *   (entityType is the numeric DraftType enum value as a string, e.g., "1" for Class, "3" for Feature)
 * - `{ type: 'unsubscribe', entityType: string, entityId: number }` - Unsubscribe from entity state updates
 * 
 * Server → Client:
 * - `{ type: 'stateUpdate', entityType: string, entityId: number, state: T }` - Entity state update
 * - `{ type: 'error', message: string }` - Error message
 * 
 * **Connection Management**:
 * - Automatically reconnects on connection loss
 * - Manages subscription state across reconnections
 * - Handles connection errors gracefully
 * 
 * @see packages/shared/docs/application-overview/websocket-state-updates.md - Full documentation
 * 
 * @example
 * ```typescript
 * const wsService = WebSocketService.getInstance();
 * await wsService.connect();
 * 
 * const subscriptionId = wsService.subscribe(DraftType.Feature, 123, (state) => {
 *   console.log('Feature 123 updated:', state);
 * });
 * 
 * // Later...
 * wsService.unsubscribe(subscriptionId);
 * ```
 */
export class WebSocketService {
    private static instance: WebSocketService | null = null;
    private ws: WebSocket | null = null;
    private subscriptions: Map<string, Set<(state: unknown) => void>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private reconnectDelay = 1000; // Start with 1 second
    private isConnecting = false;
    private pendingSubscriptions: Array<{ draftType: DraftType; entityId: number; callback: (state: unknown) => void }> = [];

    private constructor() {
        // Private constructor for singleton pattern
    }

    /**
     * Gets the singleton instance of WebSocketService.
     * 
     * @returns The WebSocketService instance
     */
    static getInstance(): WebSocketService {
        if (!WebSocketService.instance) {
            WebSocketService.instance = new WebSocketService();
        }
        return WebSocketService.instance;
    }

    /**
     * Connects to the WebSocket server.
     * 
     * @throws Error if connection fails
     * 
     * @example
     * ```typescript
     * await wsService.connect();
     * ```
     */
    async connect(): Promise<void> {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return; // Already connected
        }

        if (this.isConnecting) {
            return; // Connection in progress
        }

        this.isConnecting = true;

        try {
            // Determine WebSocket URL based on current location
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.host;
            const wsUrl = `${protocol}//${host}/ws`;

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('WebSocket connected');
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;

                // Resubscribe to all pending subscriptions
                for (const sub of this.pendingSubscriptions) {
                    this.subscribe(sub.draftType, sub.entityId, sub.callback);
                }
                this.pendingSubscriptions = [];
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.isConnecting = false;
            };

            this.ws.onclose = () => {
                console.log('WebSocket disconnected');
                this.isConnecting = false;
                this.ws = null;

                // Attempt to reconnect
                this.attemptReconnect();
            };
        } catch (error) {
            this.isConnecting = false;
            throw new Error(`Failed to connect to WebSocket: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Attempts to reconnect to the WebSocket server.
     */
    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000); // Max 30 seconds

        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect().catch(error => {
                console.error('Reconnection failed:', error);
            });
        }, delay);
    }

    /**
     * Handles incoming messages from the server.
     * 
     * @param message - The message from the server
     */
    private handleMessage(message: { type: string; entityType?: string; entityId?: number; state?: unknown; message?: string }): void {
        switch (message.type) {
            case 'stateUpdate':
                if (message.entityType && message.entityId !== undefined && message.state !== undefined) {
                    const subscriptionKey = `${message.entityType}:${message.entityId}`;
                    const callbacks = this.subscriptions.get(subscriptionKey);
                    if (callbacks) {
                        callbacks.forEach(callback => {
                            try {
                                callback(message.state);
                            } catch (error) {
                                console.error('Error in subscription callback:', error);
                            }
                        });
                    }
                }
                break;

            case 'error':
                console.error('WebSocket error from server:', message.message);
                break;

            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    /**
     * Disconnects from the WebSocket server.
     */
    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.subscriptions.clear();
        this.pendingSubscriptions = [];
        this.reconnectAttempts = 0;
    }

    /**
     * Subscribes to entity state updates.
     * 
     * @param draftType - The draft type enum (e.g., DraftType.Feature, DraftType.Class, DraftType.Character)
     * @param entityId - The entity ID
     * @param callback - Callback function to invoke when state is updated
     * @returns Subscription ID (for unsubscribing)
     * 
     * @example
     * ```typescript
     * const subscriptionId = wsService.subscribe(DraftType.Feature, 123, (state) => {
     *   console.log('Feature updated:', state);
     * });
     * ```
     */
    subscribe(draftType: DraftType, entityId: number, callback: (state: unknown) => void): string {
        // Use numeric draftType value as string for subscription key
        const subscriptionKey = `${draftType}:${entityId}`;

        if (!this.subscriptions.has(subscriptionKey)) {
            this.subscriptions.set(subscriptionKey, new Set());
        }

        this.subscriptions.get(subscriptionKey)!.add(callback);

        // Send subscribe message if connected
        // Backend expects entityType as string (numeric value as string for now)
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'subscribe',
                entityType: String(draftType), // Send numeric enum value as string
                entityId
            }));
        } else {
            // Queue subscription for when connection is established
            this.pendingSubscriptions.push({ draftType, entityId, callback });
            // Try to connect if not already connecting
            if (!this.isConnecting && !this.ws) {
                this.connect().catch(error => {
                    console.error('Failed to connect for subscription:', error);
                });
            }
        }

        return subscriptionKey;
    }

    /**
     * Unsubscribes from entity state updates.
     * 
     * @param subscriptionId - The subscription ID (entityType:entityId format)
     * 
     * @example
     * ```typescript
     * wsService.unsubscribe('feature:123');
     * ```
     */
    unsubscribe(subscriptionId: string): void {
        const [draftTypeStr, entityIdStr] = subscriptionId.split(':');
        const draftType = parseInt(draftTypeStr, 10) as DraftType;
        const entityId = parseInt(entityIdStr, 10);

        if (isNaN(draftType) || isNaN(entityId)) {
            console.error(`Invalid subscription ID: ${subscriptionId}`);
            return;
        }

        this.subscriptions.delete(subscriptionId);

        // Send unsubscribe message if connected
        // Backend expects entityType as string (numeric value as string for now)
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'unsubscribe',
                entityType: String(draftType), // Send numeric enum value as string
                entityId
            }));
        }
    }

    /**
     * Checks if the WebSocket is connected.
     * 
     * @returns True if connected, false otherwise
     */
    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}
