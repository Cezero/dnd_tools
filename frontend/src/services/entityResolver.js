import api from './api';

const unresolvedEntities = new Set();
const resolvedCache = new Map();
let timeout = null;
let resolveTimeoutPromise = null;

let pendingResolvers = [];
let allRequestedKeysInCurrentFlush = new Set();

export function queueEntityResolution(type, identifier) {
    const key = `${type}:${identifier}`;

    allRequestedKeysInCurrentFlush.add(key);

    return new Promise((resolve) => {
        if (resolvedCache.has(key)) {
            return resolve(resolvedCache.get(key));
        }

        pendingResolvers.push({ key, resolve });
        unresolvedEntities.add(key);

        if (!timeout) {
            timeout = setTimeout(async () => {
                const payload = Array.from(unresolvedEntities).map(k => {
                    const [type, identifier] = k.split(':');
                    return { type, name: identifier }; // Backend expects 'name'
                });

                const result = await api('/entities/resolve', {
                    method: 'POST',
                    body: JSON.stringify({ queries: payload }),
                });

                for (const [type, entitiesOrTables] of Object.entries(result)) {
                    for (const [identifier, resolvedData] of Object.entries(entitiesOrTables)) {
                        if (resolvedData === null) {
                            console.log('no data found for', type, identifier);
                            continue;
                        }
                        const cache_key = `${type}:${identifier}`;
                        resolvedCache.set(cache_key, resolvedData);
                    }
                }

                for (const { key, resolve } of pendingResolvers) {
                    resolve(resolvedCache.get(key));
                }

                pendingResolvers = [];
                unresolvedEntities.clear();
                timeout = null;
                if (resolveTimeoutPromise) {
                    resolveTimeoutPromise();
                    resolveTimeoutPromise = null;
                }
            }, 150);
        }
    });
}

export async function flushEntityResolutionQueue() {
    if (timeout) {
        await new Promise(resolve => {
            resolveTimeoutPromise = resolve;
        });
    }

    const grouped = {};
    const keysToReturn = Array.from(allRequestedKeysInCurrentFlush);
    allRequestedKeysInCurrentFlush.clear();

    for (const key of keysToReturn) {
        const [type, name] = key.split(':');
        if (!grouped[type]) grouped[type] = {};
        grouped[type][name] = resolvedCache.get(key);
    }

    return grouped;
}
