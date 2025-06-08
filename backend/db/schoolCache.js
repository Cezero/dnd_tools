import pool from './pool.js';

let schoolMap = new Map();
let idMap = new Map();
let subschoolMap = new Map();

async function loadSchoolCache() {
    const [schools] = await pool.query('SELECT * FROM spell_schools');
    const [subschools] = await pool.query('SELECT * FROM spell_subschools');

    schoolMap.clear();
    idMap.clear();
    subschoolMap.clear();

    for (const row of schools) {
        schoolMap.set(row.school_name, row);
        idMap.set(row.school_id, row);
    }

    for (const row of subschools) {
        if (!subschoolMap.has(row.school_id)) {
            subschoolMap.set(row.school_id, new Map());
        }
        subschoolMap.get(row.school_id).set(row.subschool, row);
    }

    console.log(`[SchoolCache] Loaded ${schools.length} schools and ${subschools.length} subschools`);
}

await loadSchoolCache();

function getSchool(key) {
    if (typeof key === 'number') return idMap.get(key);
    if (typeof key === 'string') return schoolMap.get(key);
    return null;
}

function getSubschool(schoolId, subschoolName) {
    return subschoolMap.get(schoolId)?.get(subschoolName) || null;
}

function getSubschools(schoolId) {
    return Array.from(subschoolMap.get(schoolId)?.values() || []);
}

export default {
    load: loadSchoolCache,
    getAll: () => Array.from(idMap.values()),
    getSchool,
    getSubschool,
    getSubschools
}; 