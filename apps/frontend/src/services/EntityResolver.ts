import { Api } from '@/services/Api';

interface EntityQuery {
    type: string;
    name: string;
}

interface EntityResolutionRequest {
    queries: EntityQuery[];
}

interface EntityResolutionResponse {
    [type: string]: {
        [identifier: string]: any;
    };
}

interface PendingResolver {
    key: string;
    resolve: (value: any) => void;
}

const unresolvedEntities = new Set<string>();
const resolvedCache = new Map<string, any>();
let timeout: NodeJS.Timeout | null = null;
let resolveTimeoutPromise: (() => void) | null = null;

let pendingResolvers: PendingResolver[] = [];
let allRequestedKeysInCurrentFlush = new Set<string>();

export function QueueEntityResolution(type: string, identifier: string): Promise<any> {
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
                const payload: EntityQuery[] = Array.from(unresolvedEntities).map(k => {
                    const [type, identifier] = k.split(':');
                    return { type, name: identifier }; // Backend expects 'name'
                });

                const result: EntityResolutionResponse = await Api('/entities/resolve', {
                    method: 'POST',
                    body: JSON.stringify({ queries: payload } as EntityResolutionRequest),
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

export async function FlushEntityResolutionQueue(): Promise<Record<string, Record<string, any>>> {
    if (timeout) {
        await new Promise<void>(resolve => {
            resolveTimeoutPromise = resolve;
        });
    }

    const grouped: Record<string, Record<string, any>> = {};
    const keysToReturn = Array.from(allRequestedKeysInCurrentFlush);
    allRequestedKeysInCurrentFlush.clear();

    for (const key of keysToReturn) {
        const [type, name] = key.split(':');
        if (!grouped[type]) grouped[type] = {};
        grouped[type][name] = resolvedCache.get(key);
    }

    return grouped;
} 