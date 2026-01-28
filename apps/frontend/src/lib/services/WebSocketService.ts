/// <reference types="vite/client" />

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
    private topicSubscriptions: Map<string, Set<(payload: unknown) => void>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private reconnectDelay = 1000; // Start with 1 second
    private isConnecting = false;
    private pendingSubscriptions: Array<{ draftType: DraftType; entityId: number; callback: (state: unknown) => void }> = [];
    private pendingTopicSubscriptions: Array<{ topic: 'characterResolved'; topicId: number; callback: (payload: unknown) => void }> = [];

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
            // Determine WebSocket URL
            // Since WebSocket connections can't use HTTP proxies, we need to construct
            // the WebSocket URL. In development, if ports are forwarded, we need to use
            // the same hostname as the frontend but with the backend port.
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            let wsUrl: string;
            
            // Check for environment variable override (useful for port forwarding scenarios)
            const wsUrlOverride = import.meta.env.VITE_WS_URL;
            if (wsUrlOverride) {
                wsUrl = wsUrlOverride;
            } else if (import.meta.env.DEV) {
                // In development, use the same hostname as the frontend (works with port forwarding)
                // but with the backend port. If the backend port is also forwarded, it should
                // be accessible on the same hostname.
                const hostname = window.location.hostname;
                // Default backend port in development
                // Note: Cursor port forwarding may forward a different port (e.g., 3000 instead of 3001)
                // Can be overridden with VITE_WS_PORT environment variable
                const backendPort = import.meta.env.VITE_WS_PORT 
                    ? parseInt(import.meta.env.VITE_WS_PORT, 10) 
                    : 3001; // Default to 3000 since that's what Cursor forwards
                wsUrl = `${protocol}//${hostname}:${backendPort}/ws`;
            } else {
                // Production: use same origin as the frontend
                const host = window.location.host;
                wsUrl = `${protocol}//${host}/ws`;
            }

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                this.isConnecting = false;
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;

                // Resubscribe to all pending subscriptions
                for (const sub of this.pendingSubscriptions) {
                    this.subscribe(sub.draftType, sub.entityId, sub.callback);
                }
                this.pendingSubscriptions = [];

                // Resubscribe to all pending topic subscriptions
                for (const sub of this.pendingTopicSubscriptions) {
                    this.subscribeTopic(sub.topic, sub.topicId, sub.callback);
                }
                this.pendingTopicSubscriptions = [];
            };

            this.ws.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (error) {
                    console.error('[WebSocket] Error parsing message:', error, 'Raw data:', event.data);
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
    private handleMessage(message: {
        type: string;
        entityType?: string;
        entityId?: number;
        state?: unknown;
        topic?: string;
        topicId?: number;
        payload?: unknown;
        message?: string;
    }): void {
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

            case 'topicUpdate':
                if (message.topic && message.topicId !== undefined) {
                    const subscriptionKey = `${message.topic}:${message.topicId}`;
                    const callbacks = this.topicSubscriptions.get(subscriptionKey);
                    if (callbacks) {
                        callbacks.forEach(callback => {
                            try {
                                callback(message.payload);
                            } catch (error) {
                                console.error('Error in topic subscription callback:', error);
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
        this.topicSubscriptions.clear();
        this.pendingSubscriptions = [];
        this.pendingTopicSubscriptions = [];
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
     * Subscribes to a topic-based projection update.
     *
     * Topics are not DraftTypes. They represent derived projections (like resolved character)
     * published by the backend when underlying drafts change.
     */
    subscribeTopic(topic: 'characterResolved', topicId: number, callback: (payload: unknown) => void): string {
        const subscriptionKey = `${topic}:${topicId}`;

        if (!this.topicSubscriptions.has(subscriptionKey)) {
            this.topicSubscriptions.set(subscriptionKey, new Set());
        }

        this.topicSubscriptions.get(subscriptionKey)!.add(callback);

        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'subscribeTopic',
                topic,
                topicId,
            }));
        } else {
            this.pendingTopicSubscriptions.push({ topic, topicId, callback });
            if (!this.isConnecting && !this.ws) {
                this.connect().catch(error => {
                    console.error('Failed to connect for topic subscription:', error);
                });
            }
        }

        return subscriptionKey;
    }

    unsubscribeTopic(subscriptionId: string): void {
        const [topic, topicIdStr] = subscriptionId.split(':');
        const topicId = parseInt(topicIdStr, 10);

        if (topic !== 'characterResolved' || Number.isNaN(topicId)) {
            console.error(`Invalid topic subscription ID: ${subscriptionId}`);
            return;
        }

        this.topicSubscriptions.delete(subscriptionId);

        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'unsubscribeTopic',
                topic,
                topicId,
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
