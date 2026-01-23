import { createClient, createCluster, type RedisClientType, type RedisClusterType } from 'redis';

import { DraftType } from '@shared/static-data';


import { getRedisClient } from '../session/redisClient';

/**
 * Service for managing Redis pub/sub operations for draft state updates.
 * 
 * This service extends the Redis client to support pub/sub operations for
 * real-time draft propagation. When a draft state is updated, it publishes
 * the update to a channel, and all subscribed clients receive the update.
 * 
 * **Channel Pattern**: `channel:state:{draftType}:{id}`
 * 
 * Examples:
 * - `channel:state:1:1` - Channel for class (DraftType.Class=1) 1 draft updates
 * - `channel:state:3:5` - Channel for feature (DraftType.Feature=3) 5 draft updates
 * - `channel:state:4:10` - Channel for character (DraftType.Character=4) 10 draft updates
 * 
 * **Pub/Sub Flow**:
 * 1. Backend service updates draft state and calls `publish`
 * 2. Update is published to the draft's channel
 * 3. All subscribed clients (WebSocket server, other services) receive the update
 * 4. WebSocket server forwards update to connected frontend clients
 * 
 * **Subscription Lifecycle**:
 * - Subscriptions are managed per draft (objectName + id)
 * - Multiple callbacks can be registered for the same draft
 * - Unsubscribe removes all callbacks for a draft
 * 
 * @see DraftStateService - For draft storage
 * @see packages/shared/docs/application-overview/websocket-state-updates.md - Full documentation
 * 
 * @example
 * ```typescript
 * const pubSub = new DraftStatePubSub();
 * 
 * // Subscribe to draft state updates
 * await pubSub.subscribe(DraftType.Class, 1, (state) => {
 *   console.log('Class 1 draft updated:', state);
 * });
 * 
 * // Publish draft update
 * await pubSub.publish(DraftType.Class, 1, updatedState);
 * 
 * // Unsubscribe
 * await pubSub.unsubscribe(DraftType.Class, 1);
 * ```
 */
export class DraftStatePubSub {
    private publisher: RedisClientType | RedisClusterType;
    private subscriber: RedisClientType | RedisClusterType;
    private subscriptions: Map<string, Set<(state: unknown) => void>>;
    private isInitialized: boolean;

    constructor() {
        this.subscriptions = new Map();
        this.isInitialized = false;

        // Create publisher and subscriber clients
        // We need separate clients because a Redis client cannot be both publisher and subscriber
        this.publisher = this.createRedisClient();
        this.subscriber = this.createRedisClient();
    }

    /**
     * Creates a Redis client (standalone or cluster) based on configuration.
     * 
     * @returns Redis client instance
     */
    private createRedisClient(): RedisClientType | RedisClusterType {
        const isClusterMode = process.env.REDIS_CLUSTER_MODE === 'true';
        const password = process.env.REDIS_PASSWORD;

        if (isClusterMode) {
            const clusterNodes = process.env.REDIS_CLUSTER_NODES;
            if (!clusterNodes) {
                throw new Error('REDIS_CLUSTER_NODES must be set when REDIS_CLUSTER_MODE=true');
            }

            const rootNodes = clusterNodes.split(',').map(node => {
                const [host, port] = node.trim().split(':');
                return {
                    socket: {
                        host: host || 'localhost',
                        port: parseInt(port || '6379', 10)
                    }
                };
            });

            return createCluster({
                rootNodes,
                defaults: {
                    password,
                    socket: {
                        reconnectStrategy: (retries) => {
                            if (retries > 10) {
                                return new Error('Too many reconnection attempts');
                            }
                            return Math.min(retries * 50, 500);
                        }
                    }
                }
            });
        } else {
            const host = process.env.REDIS_HOST || 'localhost';
            const port = parseInt(process.env.REDIS_PORT || '6379', 10);

            return createClient({
                socket: {
                    host,
                    port,
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            return new Error('Too many reconnection attempts');
                        }
                        return Math.min(retries * 50, 500);
                    }
                },
                password
            });
        }
    }

    /**
     * Initializes the pub/sub service by connecting the Redis clients.
     * 
     * Must be called before using subscribe/publish operations.
     * 
     * @throws Error if connection fails
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        try {
            // Check if clients are already connected before attempting to connect
            // This handles cases where clients might have been connected elsewhere
            // Use isOpen property to check if socket is already open
            if (!this.publisher.isOpen) {
                await this.publisher.connect();
            }
            if (!this.subscriber.isOpen) {
                await this.subscriber.connect();
            }

            // Set up message handler for subscriber (only if not already set up)
            // In Redis v4, the 'message' event provides (message, channel) arguments
            if (!this.subscriber.listenerCount('message')) {
                this.subscriber.on('message', (message: string, channel: string) => {
                    this.handleMessage(channel, message);
                });
            }

            this.isInitialized = true;
        } catch (error) {
            // Handle "Socket already opened" error gracefully
            // This can happen if the client was already connected
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('Socket already opened') || errorMessage.includes('already open')) {
                // If socket is already open, we can consider it initialized
                this.isInitialized = true;
                return;
            }
            console.error('Error initializing DraftStatePubSub:', error);
            throw new Error(`Failed to initialize pub/sub: ${errorMessage}`);
        }
    }

    /**
     * Handles incoming pub/sub messages.
     * 
     * @param channel - The channel the message was received on
     * @param message - The message content (JSON string)
     */
    private handleMessage(channel: string, message: string): void {
        const callbacks = this.subscriptions.get(channel);

        if (!callbacks || callbacks.size === 0) {
            return;
        }

        try {
            const state = JSON.parse(message);

            // Call all registered callbacks
            callbacks.forEach(callback => {
                try {
                    callback(state);
                } catch (error) {
                    console.error(`Error in pub/sub callback for channel ${channel}:`, error);
                }
            });
        } catch (error) {
            console.error(`Error parsing pub/sub message for channel ${channel}:`, error);
        }
    }

    /**
     * Builds Redis channel name for entity state updates.
     * 
     * @param draftType - The draft type (numeric enum value)
     * @param id - The draft ID
     * @returns Channel name string
     */
    private buildChannelName(draftType: DraftType, id: number): string {
        return `channel:state:${draftType}:${id}`;
    }

    /**
     * Subscribes to entity state updates.
     * 
     * When the entity state is updated and published, the callback will be invoked
     * with the new state.
     * 
     * @param draftType - The draft type (numeric enum value)
     * @param id - The draft ID
     * @param callback - Callback function to invoke when state is updated
     * @throws Error if subscription fails
     * 
     * @example
     * ```typescript
     * await pubSub.subscribe(DraftType.Class, 1, (state) => {
     *   console.log('Class 1 updated:', state);
     * });
     * ```
     */
    async subscribe(draftType: DraftType, id: number, callback: (state: unknown) => void): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const channel = this.buildChannelName(draftType, id);

        try {
            // Add callback to subscriptions map
            if (!this.subscriptions.has(channel)) {
                this.subscriptions.set(channel, new Set());

                // Subscribe to channel if this is the first callback
                // Redis v4 subscribe requires channel and listener callback
                // The listener receives (message, channel) arguments
                await this.subscriber.subscribe(channel, (message: string, channelName: string) => {
                    // Message handling is done via 'message' event listener
                    // This callback is required by the API but we use the event-based approach
                });
            }

            this.subscriptions.get(channel)!.add(callback);
        } catch (error) {
            console.error(`Error subscribing to ${channel}:`, error);
            throw new Error(`Failed to subscribe: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Unsubscribes from entity state updates.
     * 
     * Removes all callbacks for the entity. If no callbacks remain, unsubscribes
     * from the Redis channel.
     * 
     * @param draftType - The draft type (numeric enum value)
     * @param id - The draft ID
     * @throws Error if unsubscription fails
     * 
     * @example
     * ```typescript
     * await pubSub.unsubscribe(DraftType.Class, 1);
     * ```
     */
    async unsubscribe(draftType: DraftType, id: number): Promise<void> {
        const channel = this.buildChannelName(draftType, id);

        try {
            const callbacks = this.subscriptions.get(channel);

            if (callbacks) {
                // Remove all callbacks
                callbacks.clear();
                this.subscriptions.delete(channel);

                // Unsubscribe from Redis channel
                await this.subscriber.unsubscribe(channel);
            }
        } catch (error) {
            console.error(`Error unsubscribing from ${channel}:`, error);
            throw new Error(`Failed to unsubscribe: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Publishes state update to Redis pub/sub channel.
     * 
     * All subscribers to the entity's channel will receive the update.
     * 
     * @param draftType - The draft type (numeric enum value)
     * @param id - The draft ID
     * @param state - The state to publish (must be JSON-serializable)
     * @throws Error if publish operation fails
     * 
     * @example
     * ```typescript
     * await pubSub.publish(DraftType.Class, 1, updatedState);
     * ```
     */
    async publish<T>(draftType: DraftType, id: number, state: T): Promise<void> {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const channel = this.buildChannelName(draftType, id);

        try {
            const message = JSON.stringify(state);
            await this.publisher.publish(channel, message);
        } catch (error) {
            console.error(`Error publishing to ${channel}:`, error);
            throw new Error(`Failed to publish: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Closes the pub/sub service and disconnects Redis clients.
     * 
     * Should be called on application shutdown.
     */
    async close(): Promise<void> {
        try {
            if (this.publisher) {
                await this.publisher.quit();
            }
            if (this.subscriber) {
                await this.subscriber.quit();
            }
            this.subscriptions.clear();
            this.isInitialized = false;
        } catch (error) {
            console.error('Error closing DraftStatePubSub:', error);
        }
    }
}
