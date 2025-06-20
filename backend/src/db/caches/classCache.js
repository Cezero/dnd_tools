import { timedQuery } from "../queryTimer.js";

class ClassCache {
    constructor() {
        this.classes = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const { rows } = await timedQuery('SELECT * FROM classes', [], 'ClassCache');
        for (const row of rows) {
            this.classes.set(row.class_id, {
                class_id: row.class_id,
                class_name: row.class_name,
                class_abbr: row.class_abbr,
                caster: row.caster,
                edition_id: row.edition_id,
                display: row.display,
                is_prestige_class: row.is_prestige_class
            });
        }
        this.initialized = true;
        console.log(`[ClassCache] Initialized with ${this.classes.size} classes`);
    }

    getID(input) {
        if (!this.initialized) {
            throw new Error('ClassCache not initialized');
        }
        if (!input) return null;

        // If input is a number or numeric string, try to use it as an ID
        const numericInput = Number(input);
        if (!isNaN(numericInput)) {
            return this.classes.has(numericInput) ? numericInput : null;
        }

        // Otherwise try to find by name or abbr
        const classInfo = this.getClass(input);
        return classInfo ? classInfo.class_id : null;
    }

    getClass(className) {
        if (!this.initialized) {
            throw new Error('ClassCache not initialized');
        }
        if (typeof className !== 'string') {
            return null;
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
await classCache.initialize();
export default classCache;
