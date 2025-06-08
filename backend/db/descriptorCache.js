import pool from './pool.js';

let descriptorMap = new Map();
let idMap = new Map();

async function loadDescriptorCache() {
    const [rows] = await pool.query('SELECT * FROM spell_descriptors');

    descriptorMap.clear();
    idMap.clear();

    for (const row of rows) {
        descriptorMap.set(row.descriptor, row);
        idMap.set(row.desc_id, row);
    }

    console.log(`[DescriptorCache] Loaded ${rows.length} descriptors`);
}

await loadDescriptorCache();

function getDescriptor(key) {
    if (typeof key === 'number') return idMap.get(key);
    if (typeof key === 'string') return descriptorMap.get(key);
    return null;
}

export default {
    load: loadDescriptorCache,
    getAll: () => Array.from(idMap.values()),
    getDescriptor
}; 