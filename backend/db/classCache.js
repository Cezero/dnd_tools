import pool from './pool.js';

let classMap = new Map();
let idMap = new Map();

async function loadClassCache() {
    const [rows] = await pool.query('SELECT * FROM classes');
    
    classMap.clear();
    idMap.clear();

    for (const row of rows) {
        classMap.set(row.class_name, row);
        idMap.set(row.class_id, row);
    }

    console.log(`[ClassCache] Loaded ${rows.length} classes`);
}

await loadClassCache();

function getClass(key) {
    if (typeof key === 'number') return idMap.get(key);
    if (typeof key === 'string') return classMap.get(key);
    return null;
}

function filterClasses({ prestige = null, filters = {} } = {}) {
    return Array.from(idMap.values()).filter(cls => {
        if (prestige === true && !cls.is_prestige_class) return false;
        if (prestige === false && cls.is_prestige_class) return false;

        for (const [key, value] of Object.entries(filters)) {
            if (Array.isArray(value)) {
                if (!value.includes(cls[key])) return false;
            } else {
                if (cls[key] !== value) return false;
            }
        }
        return true;
    });
}

function getAllBaseClasses(filters = {}) {
    return filterClasses({ prestige: false, filters });
}

function getAllPrestigeClasses(filters = {}) {
    return filterClasses({ prestige: true, filters });
}

export default {
    load: loadClassCache,
    getAll: () => Array.from(idMap.values()),
    getClass,
    getAllBaseClasses,
    getAllPrestigeClasses
};
