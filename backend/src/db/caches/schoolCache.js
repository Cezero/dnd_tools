import { timedQuery } from "../queryTimer.js";

class SchoolCache {
    constructor() {
        this.schools = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const rows = await timedQuery('SELECT * FROM spell_schools', [], 'SchoolCache');
        for (const row of rows) {
            this.schools.set(row.school_id, {
                school_id: row.school_id,
                school_name: row.school_name
            });
        }
        this.initialized = true;
        console.log(`[SchoolCache] Initialized with ${this.schools.size} schools`);
    }

    getID(input) {
        if (!this.initialized) {
            throw new Error('SchoolCache not initialized');
        }
        if (!input) return null;

        // If input is a number or numeric string, try to use it as an ID
        const numericInput = Number(input);
        if (!isNaN(numericInput)) {
            return this.schools.has(numericInput) ? numericInput : null;
        }

        // Otherwise try to find by name
        const schoolInfo = this.getSchool(input);
        return schoolInfo ? schoolInfo.school_id : null;
    }

    getSchool(schoolName) {
        if (!this.initialized) {
            throw new Error('SchoolCache not initialized');
        }
        if (typeof schoolName !== 'string') {
            return null;
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
await schoolCache.initialize();
export default schoolCache; 