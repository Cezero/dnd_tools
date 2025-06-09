import pool from './pool.js';

class ComponentCache {
    constructor() {
        this.components = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const [rows] = await pool.query('SELECT * FROM spell_components');
        for (const row of rows) {
            this.components.set(row.comp_id, {
                comp_id: row.comp_id,
                comp_name: row.comp_name,
                comp_abbrev: row.comp_abbrev
            });
        }
        this.initialized = true;
        console.log(`[ComponentCache] Initialized with ${this.components.size} components`);
    }

    getComponent(componentName) {
        if (!this.initialized) {
            throw new Error('ComponentCache not initialized');
        }
        return Array.from(this.components.values()).find(comp =>
            comp.comp_name.toLowerCase() === componentName.toLowerCase() ||
            comp.comp_abbrev.toLowerCase() === componentName.toLowerCase()
        );
    }

    getComponentById(componentId) {
        if (!this.initialized) {
            throw new Error('ComponentCache not initialized');
        }
        return this.components.get(componentId);
    }
}

const componentCache = new ComponentCache();
componentCache.initialize();
export default componentCache; 