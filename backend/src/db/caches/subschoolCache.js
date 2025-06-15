import { timedQuery } from "../queryTimer.js";

class SubschoolCache {
    constructor() {
        this.subschools = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const rows = await timedQuery('SELECT * FROM spell_subschools', [], 'SubschoolCache');
        for (const row of rows) {
            this.subschools.set(row.sub_id, {
                sub_id: row.sub_id,
                subschool: row.subschool,
                school_id: row.school_id
            });
        }
        this.initialized = true;
        console.log(`[SubschoolCache] Initialized with ${this.subschools.size} subschools`);
    }

    getID(input) {
        if (!this.initialized) {
            throw new Error('SubschoolCache not initialized');
        }
        if (!input) return null;

        // If input is a number or numeric string, try to use it as an ID
        const numericInput = Number(input);
        if (!isNaN(numericInput)) {
            return this.subschools.has(numericInput) ? numericInput : null;
        }

        // Otherwise try to find by name
        const subschoolInfo = this.getSubschool(input);
        return subschoolInfo ? subschoolInfo.sub_id : null;
    }

    getSubschool(subschoolName) {
        if (!this.initialized) {
            throw new Error('SubschoolCache not initialized');
        }
        if (typeof subschoolName !== 'string') {
            return null;
        }
        return Array.from(this.subschools.values()).find(subschool =>
            subschool.subschool.toLowerCase() === subschoolName.toLowerCase()
        );
    }

    getSubschoolById(subschoolId) {
        if (!this.initialized) {
            throw new Error('SubschoolCache not initialized');
        }
        return this.subschools.get(subschoolId);
    }

    getBySchoolId(schoolId) {
        if (!this.initialized) {
            throw new Error('SubschoolCache not initialized');
        }
        return Array.from(this.subschools.values()).filter(subschool =>
            subschool.school_id === schoolId
        );
    }
}

const subschoolCache = new SubschoolCache();
await subschoolCache.initialize();
export default subschoolCache; 