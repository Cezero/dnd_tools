import pool from './pool.js';

class ClassCache {
    constructor() {
        this.classes = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const [rows] = await pool.query('SELECT * FROM classes');
        for (const row of rows) {
            this.classes.set(row.class_id, {
                class_id: row.class_id,
                class_name: row.class_name,
                class_abbr: row.class_abbr
            });
        }
        this.initialized = true;
        console.log(`[ClassCache] Initialized with ${this.classes.size} classes`);
    }

    getClass(className) {
        if (!this.initialized) {
            throw new Error('ClassCache not initialized');
        }
        return Array.from(this.classes.values()).find(cls =>
            cls.class_name.toLowerCase() === className.toLowerCase() ||
            cls.class_abbr.toLowerCase() === className.toLowerCase()
        );
    }

    getClassById(classId) {
        if (!this.initialized) {
            throw new Error('ClassCache not initialized');
        }
        return this.classes.get(classId);
    }
}

const classCache = new ClassCache();
classCache.initialize();
export default classCache;
