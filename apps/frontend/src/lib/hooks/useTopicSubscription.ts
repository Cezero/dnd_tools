import { useEffect, useRef, useState } from 'react';

import { WebSocketService } from '../services/WebSocketService';

/**
 * Hook for subscribing to topic-based projection updates over WebSocket.
 *
 * Topics represent derived projections (not DraftTypes). For example, `characterResolved`
 * publishes resolved character snapshots when the backend detects a meaningful change.
 */
export function useTopicSubscription<TPayload>(
    topic: 'characterResolved',
    topicId: number | null,
    onUpdate: (payload: TPayload) => void
): { isConnected: boolean; error: string | null; subscribe: () => void; unsubscribe: () => void } {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const subscriptionIdRef = useRef<string | null>(null);
    const wsService = WebSocketService.getInstance();

    const subscribe = () => {
        if (topicId === null) {
            return;
        }

        try {
            const id = wsService.subscribeTopic(topic, topicId, (payload) => {
                try {
                    onUpdate(payload as TPayload);
                } catch (err) {
                    console.error('Error in onUpdate callback:', err);
                }
            });
            subscriptionIdRef.current = id;
            setIsConnected(wsService.isConnected());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to subscribe');
            console.error('Error subscribing to topic:', err);
        }
    };

    const unsubscribe = () => {
        if (subscriptionIdRef.current) {
            wsService.unsubscribeTopic(subscriptionIdRef.current);
            subscriptionIdRef.current = null;
        }
    };

    useEffect(() => {
        if (topicId === null) {
            unsubscribe();
            return;
        }

        subscribe();
        return () => {
            unsubscribe();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [topic, topicId]);

    useEffect(() => {
        const checkConnection = () => {
            setIsConnected(wsService.isConnected());
        };

        const interval = setInterval(checkConnection, 1000);

        return () => {
            clearInterval(interval);
        };
    }, [wsService]);

    return {
        isConnected,
        error,
        subscribe,
        unsubscribe,
    };
}

