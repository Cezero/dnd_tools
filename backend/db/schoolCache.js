import pool from './pool.js';

class SchoolCache {
    constructor() {
        this.schools = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const [rows] = await pool.query('SELECT * FROM spell_schools');
        for (const row of rows) {
            this.schools.set(row.school_id, {
                school_id: row.school_id,
                school_name: row.school_name
            });
        }
        this.initialized = true;
        console.log(`[SchoolCache] Initialized with ${this.schools.size} schools`);
    }

    getSchool(schoolName) {
        if (!this.initialized) {
            throw new Error('SchoolCache not initialized');
        }
        return Array.from(this.schools.values()).find(school =>
            school.school_name.toLowerCase() === schoolName.toLowerCase()
        );
    }

    getSchoolById(schoolId) {
        if (!this.initialized) {
            throw new Error('SchoolCache not initialized');
        }
        return this.schools.get(schoolId);
    }
}

const schoolCache = new SchoolCache();
schoolCache.initialize();
export default schoolCache; 