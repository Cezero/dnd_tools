import { createClient, createCluster, type RedisClientType, type RedisClusterType } from 'redis';

import type { RedisSessionClient } from './types';

/**
 * Internal Redis client type (not exported - use RedisSessionClient instead).
 */
type InternalRedisClient = RedisClientType | RedisClusterType;

/**
 * Creates an adapter that wraps a Redis client and implements RedisSessionClient.
 * This eliminates the need for type assertions and unions in consuming code.
 * 
 * @param client - The underlying Redis client (standalone or cluster)
 * @returns A RedisSessionClient adapter
 */
function createSessionRedisClient(client: InternalRedisClient): RedisSessionClient {
    return {
        async get(key: string): Promise<string | null> {
            try {
                return await client.get(key);
            } catch (error) {
                console.error(`Redis GET error for key ${key}:`, error);
                if (error instanceof Error) {
                    console.error(`Redis GET error details: ${error.message}`, error.stack);
                }
                throw error;
            }
        },

        async setEx(key: string, seconds: number, value: string): Promise<string> {
            try {
                return await client.setEx(key, seconds, value);
            } catch (error) {
                console.error(`Redis SETEX error for key ${key}:`, error);
                if (error instanceof Error) {
                    console.error(`Redis SETEX error details: ${error.message}`, error.stack);
                }
                throw error;
            }
        },

        async del(keys: string | string[]): Promise<number> {
            try {
                return await client.del(keys);
            } catch (error) {
                console.error(`Redis DEL error for keys ${Array.isArray(keys) ? keys.join(',') : keys}:`, error);
                if (error instanceof Error) {
                    console.error(`Redis DEL error details: ${error.message}`, error.stack);
                }
                throw error;
            }
        },

        async keys(pattern: string): Promise<string[]> {
            try {
                // Both client types implement keys, but TypeScript can't infer from union
                return await (client as { keys: (pattern: string) => Promise<string[]> }).keys(pattern);
            } catch (error) {
                console.error(`Redis KEYS error for pattern ${pattern}:`, error);
                if (error instanceof Error) {
                    console.error(`Redis KEYS error details: ${error.message}`, error.stack);
                }
                throw error;
            }
        },

        async flushAll(): Promise<string> {
            try {
                // Both client types implement flushAll, but TypeScript can't infer from union
                return await (client as { flushAll: () => Promise<string> }).flushAll();
            } catch (error) {
                console.error('Redis FLUSHALL error:', error);
                if (error instanceof Error) {
                    console.error(`Redis FLUSHALL error details: ${error.message}`, error.stack);
                }
                throw error;
            }
        },

        async quit(): Promise<void> {
            try {
                await client.quit();
            } catch (error) {
                console.error('Redis QUIT error:', error);
                throw error;
            }
        }
    };
}

/**
 * Redis client singleton for session storage.
 * 
 * Provides a shared Redis client instance for all session services.
 * Handles connection, reconnection, and graceful shutdown.
 * Supports both standalone and cluster modes.
 * 
 * **Configuration**:
 * 
 * **Standalone Mode (Default - for local development)**:
 * - `REDIS_HOST` (default: localhost) - Redis server hostname
 * - `REDIS_PORT` (default: 6379) - Redis server port
 * - `REDIS_PASSWORD` (optional) - Redis password if required
 * 
 * **Cluster Mode (for production/K8s)**:
 * - `REDIS_CLUSTER_MODE=true` - Enable cluster mode
 * - `REDIS_CLUSTER_NODES` - Comma-separated list of cluster nodes
 *   Example: "redis-node-1:6379,redis-node-2:6379,redis-node-3:6379"
 * - `REDIS_PASSWORD` (optional) - Redis password if required
 * 
 * **Usage Examples**:
 * 
 * Local development (standalone):
 * ```bash
 * # Uses defaults: localhost:6379
 * # Or explicitly set:
 * REDIS_HOST=localhost
 * REDIS_PORT=6379
 * ```
 * 
 * Production/K8s (cluster):
 * ```bash
 * REDIS_CLUSTER_MODE=true
 * REDIS_CLUSTER_NODES=redis-0.redis-service:6379,redis-1.redis-service:6379,redis-2.redis-service:6379
 * REDIS_PASSWORD=your-password
 * ```
 * 
 * **Connection Management**:
 * - Singleton pattern ensures single connection pool
 * - Automatic reconnection on connection loss
 * - Graceful shutdown on application exit
 * - Cluster mode automatically handles MOVED/ASK redirects
 */
let redisClientInstance: InternalRedisClient | null = null;
let redisSessionClientInstance: RedisSessionClient | null = null;
let connectionPromise: Promise<void> | null = null;

/**
 * Get or create the Redis session client singleton instance.
 * 
 * Creates a new Redis client on first call, reuses existing instance on subsequent calls.
 * The client is automatically connected and ready to use.
 * Supports both standalone and cluster modes based on configuration.
 * 
 * Returns a RedisSessionClient adapter that provides a clean, type-safe interface.
 * 
 * **Note**: On first call, this function initiates the connection but does not wait for it.
 * The connection happens asynchronously. If you need to ensure the client is ready,
 * await the connection promise or check the client's ready state.
 * 
 * @returns RedisSessionClient adapter instance
 * @throws Error if Redis connection fails
 */
export function getRedisClient(): RedisSessionClient {
    if (!redisSessionClientInstance) {
        const isClusterMode = process.env.REDIS_CLUSTER_MODE === 'true';
        const password = process.env.REDIS_PASSWORD;

        if (isClusterMode) {
            // Cluster mode
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

            const client = createCluster({
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

            // Handle connection errors
            client.on('error', (err) => {
                console.error('Redis Cluster Error:', err);
            });

            // Handle connection events
            client.on('connect', () => {
                console.log('Redis Cluster: Connecting...');
            });

            client.on('ready', () => {
                console.log('Redis Cluster: Ready');
            });

            client.on('reconnecting', () => {
                console.log('Redis Cluster: Reconnecting...');
            });

            // Connect the client and wait for it to be ready
            connectionPromise = client.connect().then(() => {
                console.log('Redis Cluster: Connected and ready');
            }).catch((err) => {
                console.error('Failed to connect to Redis Cluster:', err);
                throw err;
            });

            redisClientInstance = client as InternalRedisClient;
        } else {
            // Standalone mode
            const host = process.env.REDIS_HOST || 'localhost';
            const port = parseInt(process.env.REDIS_PORT || '6379', 10);

            const client = createClient({
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

            // Handle connection errors
            client.on('error', (err) => {
                console.error('Redis Client Error:', err);
            });

            // Handle connection events
            client.on('connect', () => {
                console.log('Redis Client: Connecting...');
            });

            client.on('ready', () => {
                console.log('Redis Client: Ready');
            });

            client.on('reconnecting', () => {
                console.log('Redis Client: Reconnecting...');
            });

            // Connect the client and wait for it to be ready
            connectionPromise = client.connect().then(() => {
                console.log('Redis Client: Connected and ready');
            }).catch((err) => {
                console.error('Failed to connect to Redis:', err);
                throw err;
            });

            redisClientInstance = client as InternalRedisClient;
        }

        // Create the adapter
        redisSessionClientInstance = createSessionRedisClient(redisClientInstance!);
    }

    // Wait for connection to be ready if it's still connecting
    if (connectionPromise) {
        // Don't block, but log if connection isn't ready
        connectionPromise.catch((err) => {
            console.error('Redis connection error:', err);
        });
    }

    return redisSessionClientInstance;
}

/**
 * Close the Redis client connection.
 * 
 * Should be called on application shutdown to gracefully close the connection.
 * After calling this, getRedisClient() will create a new instance on next call.
 * Works for both standalone and cluster clients.
 * 
 * @returns Promise that resolves when connection is closed
 */
export async function closeRedisClient(): Promise<void> {
    if (redisSessionClientInstance) {
        await redisSessionClientInstance.quit();
        redisSessionClientInstance = null;
        redisClientInstance = null;
        console.log('Redis Client: Connection closed');
    }
}
