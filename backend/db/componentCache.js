import pool from './pool.js';

let componentMap = new Map();
let idMap = new Map();

async function loadComponentCache() {
    const [rows] = await pool.query('SELECT * FROM spell_components');

    componentMap.clear();
    idMap.clear();

    for (const row of rows) {
        componentMap.set(row.comp_name, row);
        idMap.set(row.comp_id, row);
    }

    console.log(`[ComponentCache] Loaded ${rows.length} components`);
}

await loadComponentCache();

function getComponent(key) {
    if (typeof key === 'number') return idMap.get(key);
    if (typeof key === 'string') return componentMap.get(key);
    return null;
}

export default {
    load: loadComponentCache,
    getAll: () => Array.from(idMap.values()),
    getComponent
}; 