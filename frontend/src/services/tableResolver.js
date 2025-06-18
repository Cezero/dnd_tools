const tableQueue = new Set();
const tableCache = new Map();

export function queueTableResolution(slug) {
  if (tableCache.has(slug)) return tableCache.get(slug);
  tableQueue.add(slug);
  return undefined;
}

export async function flushTableResolutionQueue() {
  if (tableQueue.size === 0) return {};

  const payload = Array.from(tableQueue);
  const res = await fetch('/api/tables/resolve', {
    method: 'POST',
    body: JSON.stringify({ slugs: payload }),
    headers: { 'Content-Type': 'application/json' },
  });
  const result = await res.json();

  for (const slug of payload) {
    tableCache.set(slug, result[slug]);
  }

  tableQueue.clear();
  return result;
}
