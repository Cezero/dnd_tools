import api from './api';
const tableQueue = new Set();
const tableCache = new Map();

export function queueTableResolution(slug) {
    tableQueue.add(slug);
    return undefined;
}

export async function flushTableResolutionQueue() {
    const slugsToFetch = new Set();
    const cachedResults = {};

    for (const slug of tableQueue) {
        if (tableCache.has(slug)) {
            cachedResults[slug] = tableCache.get(slug);
        } else {
            slugsToFetch.add(slug);
        }
    }

    tableQueue.clear();

    let fetchedResults = {};
    if (slugsToFetch.size > 0) {
        const payload = Array.from(slugsToFetch);
        const res = await api('/reference-tables/resolve', {
            method: 'POST',
            body: JSON.stringify({ identifiers: payload }),
        });
        fetchedResults = await res;

        for (const slug of payload) {
            tableCache.set(slug, fetchedResults[slug]);
        }
    }

    // Combine all results: existing cache, newly found in cache, and newly fetched.
    const allAvailableTables = { ...Object.fromEntries(tableCache.entries()), ...cachedResults, ...fetchedResults };
    return allAvailableTables;
}
