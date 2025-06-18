import api from './api';

const unresolvedEntities = new Set();
const resolvedCache = new Map();
let timeout = null;
let resolveTimeoutPromise = null;

let pendingResolvers = [];
let allRequestedKeysInCurrentFlush = new Set();

export function queueEntityResolution(type, name) {
    const key = `${type}:${name}`;

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
                    const [type, name] = k.split(':');
                    return { type, name };
                });

                const result = await api('/entities/resolve', {
                    method: 'POST',
                    body: JSON.stringify({ queries: payload }),
                });

                for (const [type, entities] of Object.entries(result)) {
                    for (const [name, id] of Object.entries(entities)) {
                        if (id === null) {
                            console.log('no id found for', type, name);
                            continue;
                        }
                        const cache_key = `${type}:${name}`;
                        resolvedCache.set(cache_key, id);
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
