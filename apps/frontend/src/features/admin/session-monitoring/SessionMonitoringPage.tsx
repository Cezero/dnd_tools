import { useEffect, useState } from 'react';

import { SessionMonitoringApi } from './SessionMonitoringApi';
import type {
    AdminSessionInfo,
    EntityStateInfo,
    EntityLockInfo,
    WebSocketSubscriptionInfo
} from './types';

/**
 * Admin session monitoring page component.
 * 
 * Displays comprehensive monitoring information including:
 * - All active user sessions and their viewing/editing entities
 * - All entity states in Redis
 * - All active entity locks
 * - All WebSocket subscriptions
 * 
 * Provides admin actions like force-releasing locks.
 * 
 * @see SessionMonitoringApi - For API calls
 * @see packages/shared/docs/application-overview/admin-session-monitoring.md - Full documentation
 */
export function SessionMonitoringPage(): React.JSX.Element {
    const [sessions, setSessions] = useState<AdminSessionInfo[]>([]);
    const [entityStates, setEntityStates] = useState<EntityStateInfo[]>([]);
    const [locks, setLocks] = useState<EntityLockInfo[]>([]);
    const [subscriptions, setSubscriptions] = useState<WebSocketSubscriptionInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Loads all monitoring data.
     */
    const loadData = async (): Promise<void> => {
        setIsLoading(true);
        setError(null);

        try {
            const [sessionsData, statesData, locksData, subscriptionsData] = await Promise.all([
                SessionMonitoringApi.getAllSessions(),
                SessionMonitoringApi.getAllEntityStates(),
                SessionMonitoringApi.getAllLocks(),
                SessionMonitoringApi.getAllWebSocketSubscriptions()
            ]);

            setSessions(sessionsData);
            setEntityStates(statesData);
            setLocks(locksData);
            setSubscriptions(subscriptionsData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load monitoring data');
            console.error('Error loading monitoring data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Force releases a lock on an entity.
     */
    const handleForceReleaseLock = async (entityType: string, entityId: number): Promise<void> => {
        if (!window.confirm(`Are you sure you want to force release the lock on ${entityType}:${entityId}?`)) {
            return;
        }

        try {
            await SessionMonitoringApi.forceReleaseLock(entityType, entityId);
            // Reload data to reflect the change
            await loadData();
        } catch (err) {
            console.error('Error force releasing lock:', err);
            alert(`Failed to force release lock: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
    };

    // Load data on mount
    useEffect(() => {
        loadData();
    }, []);

    if (isLoading) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Session Monitoring</h1>
                <div>Loading...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">Session Monitoring</h1>
                <div className="text-red-600">Error: {error}</div>
                <button
                    onClick={loadData}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Session Monitoring</h1>
                <button
                    onClick={loadData}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Refresh
                </button>
            </div>

            {/* User Sessions */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">User Sessions ({sessions.length})</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 border-b">User ID</th>
                                <th className="px-4 py-2 border-b">User Name</th>
                                <th className="px-4 py-2 border-b">Viewing</th>
                                <th className="px-4 py-2 border-b">Editing</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map((session) => (
                                <tr key={session.sessionKey}>
                                    <td className="px-4 py-2 border-b">{session.userId}</td>
                                    <td className="px-4 py-2 border-b">{session.userName}</td>
                                    <td className="px-4 py-2 border-b">
                                        {session.viewing.length > 0 ? (
                                            <ul className="list-disc list-inside">
                                                {session.viewing.map((ref, idx) => (
                                                    <li key={idx}>
                                                        {ref.entityType}:{ref.entityId}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-gray-400">None</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 border-b">
                                        {session.editing.length > 0 ? (
                                            <ul className="list-disc list-inside">
                                                {session.editing.map((ref, idx) => (
                                                    <li key={idx}>
                                                        {ref.entityType}:{ref.entityId}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-gray-400">None</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Entity States */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Entity States ({entityStates.length})</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 border-b">Entity Type</th>
                                <th className="px-4 py-2 border-b">Entity ID</th>
                                <th className="px-4 py-2 border-b">Has State</th>
                                <th className="px-4 py-2 border-b">Last Updated</th>
                            </tr>
                        </thead>
                        <tbody>
                            {entityStates.map((state) => (
                                <tr key={`${state.entityType}:${state.entityId}`}>
                                    <td className="px-4 py-2 border-b">{state.entityType}</td>
                                    <td className="px-4 py-2 border-b">{state.entityId}</td>
                                    <td className="px-4 py-2 border-b">
                                        {state.hasState ? (
                                            <span className="text-green-600">Yes</span>
                                        ) : (
                                            <span className="text-red-600">No</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-2 border-b">
                                        {state.lastUpdated ? state.lastUpdated.toLocaleString() : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Entity Locks */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Entity Locks ({locks.length})</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 border-b">Entity Type</th>
                                <th className="px-4 py-2 border-b">Entity ID</th>
                                <th className="px-4 py-2 border-b">Locked By</th>
                                <th className="px-4 py-2 border-b">Locked At</th>
                                <th className="px-4 py-2 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {locks.map((lock) => (
                                <tr key={`${lock.entityType}:${lock.entityId}`}>
                                    <td className="px-4 py-2 border-b">{lock.entityType}</td>
                                    <td className="px-4 py-2 border-b">{lock.entityId}</td>
                                    <td className="px-4 py-2 border-b">
                                        {lock.lockedByUserName || `User ${lock.lockedBy}`}
                                    </td>
                                    <td className="px-4 py-2 border-b">
                                        {lock.lockedAt ? lock.lockedAt.toLocaleString() : 'N/A'}
                                    </td>
                                    <td className="px-4 py-2 border-b">
                                        <button
                                            onClick={() => handleForceReleaseLock(lock.entityType, lock.entityId)}
                                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                        >
                                            Force Release
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* WebSocket Subscriptions */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">WebSocket Subscriptions ({subscriptions.length})</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
                        <thead>
                            <tr>
                                <th className="px-4 py-2 border-b">Client ID</th>
                                <th className="px-4 py-2 border-b">User ID</th>
                                <th className="px-4 py-2 border-b">User Name</th>
                                <th className="px-4 py-2 border-b">Subscriptions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subscriptions.map((sub) => (
                                <tr key={sub.clientId}>
                                    <td className="px-4 py-2 border-b">{sub.clientId}</td>
                                    <td className="px-4 py-2 border-b">{sub.userId || 'Anonymous'}</td>
                                    <td className="px-4 py-2 border-b">{sub.userName || 'N/A'}</td>
                                    <td className="px-4 py-2 border-b">
                                        {sub.subscriptions.length > 0 ? (
                                            <ul className="list-disc list-inside">
                                                {sub.subscriptions.map((ref, idx) => (
                                                    <li key={idx}>
                                                        {ref.entityType}:{ref.entityId}
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-gray-400">None</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
