import { useEffect, useRef, useState } from 'react';

import { WebSocketService } from '../services/WebSocketService';

/**
 * Hook for subscribing to entity state updates via WebSocket.
 * 
 * Automatically subscribes to entity state updates when the entity is provided,
 * and unsubscribes when the entity changes or the component unmounts.
 * 
 * **Subscription Lifecycle**:
 * 1. On mount or when entity changes, subscribes to entity state updates
 * 2. When state updates are received, invokes the `onUpdate` callback
 * 3. On unmount or when entity changes, unsubscribes from updates
 * 
 * **Reconnection**:
 * - Automatically handles reconnection on connection loss
 * - Resubscribes to all subscriptions after reconnection
 * 
 * **Error Handling**:
 * - Errors are logged to console
 * - Connection state is exposed via `isConnected` and `error` return values
 * 
 * @param entityType - The entity type (e.g., 'class', 'feature', 'character')
 * @param entityId - The entity ID (null to unsubscribe)
 * @param onUpdate - Callback function invoked when state is updated
 * @returns Object with connection state and manual control functions
 * 
 * @see WebSocketService - For WebSocket connection management
 * @see packages/shared/docs/application-overview/websocket-state-updates.md - Full documentation
 * 
 * @example
 * ```typescript
 * const { isConnected, error } = useEntityStateSubscription('feature', 123, (state) => {
 *   console.log('Feature 123 updated:', state);
 *   setFeatureState(state);
 * });
 * 
 * if (!isConnected) {
 *   return <div>Connecting...</div>;
 * }
 * ```
 */
export function useEntityStateSubscription(
    entityType: string,
    entityId: number | null,
    onUpdate: (state: unknown) => void
): { isConnected: boolean; error: string | null; subscribe: () => void; unsubscribe: () => void } {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const subscriptionIdRef = useRef<string | null>(null);
    const wsService = WebSocketService.getInstance();

    /**
     * Subscribes to entity state updates.
     */
    const subscribe = () => {
        if (entityId === null) {
            return;
        }

        try {
            const id = wsService.subscribe(entityType, entityId, (state) => {
                try {
                    onUpdate(state);
                } catch (err) {
                    console.error('Error in onUpdate callback:', err);
                }
            });
            subscriptionIdRef.current = id;
            setIsConnected(wsService.isConnected());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to subscribe');
            console.error('Error subscribing to entity state:', err);
        }
    };

    /**
     * Unsubscribes from entity state updates.
     */
    const unsubscribe = () => {
        if (subscriptionIdRef.current) {
            wsService.unsubscribe(subscriptionIdRef.current);
            subscriptionIdRef.current = null;
        }
    };

    // Subscribe/unsubscribe when entity changes
    useEffect(() => {
        if (entityId === null) {
            unsubscribe();
            return;
        }

        subscribe();

        return () => {
            unsubscribe();
        };
    }, [entityType, entityId]);

    // Check connection status periodically
    useEffect(() => {
        const checkConnection = () => {
            setIsConnected(wsService.isConnected());
        };

        const interval = setInterval(checkConnection, 1000); // Check every second

        return () => {
            clearInterval(interval);
        };
    }, []);

    return {
        isConnected,
        error,
        subscribe,
        unsubscribe
    };
}
