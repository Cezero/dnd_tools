import type { WebSocketServer } from './WebSocketServer';

let webSocketServerInstance: WebSocketServer | null = null;

/**
 * Registers the singleton `WebSocketServer` instance used by the running backend.
 *
 * This allows services (e.g. admin monitoring) to query read-only snapshots of WebSocket
 * subscription state without introducing circular imports or passing the instance through
 * many layers of constructors.
 */
export function setWebSocketServerInstance(instance: WebSocketServer): void {
    webSocketServerInstance = instance;
}

/**
 * Returns the registered `WebSocketServer` instance if the backend has initialized it.
 */
export function getWebSocketServerInstance(): WebSocketServer | null {
    return webSocketServerInstance;
}

