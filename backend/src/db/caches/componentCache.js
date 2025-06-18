import { timedQuery } from "../queryTimer.js";

class ComponentCache {
    constructor() {
        this.components = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const { rows } = await timedQuery('SELECT * FROM spell_components', [], 'ComponentCache');
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

    getID(input) {
        if (!this.initialized) {
            throw new Error('ComponentCache not initialized');
        }
        if (!input) return null;

        // If input is a number or numeric string, try to use it as an ID
        const numericInput = Number(input);
        if (!isNaN(numericInput)) {
            return this.components.has(numericInput) ? numericInput : null;
        }

        // Otherwise try to find by name or abbreviation
        const componentInfo = this.getComponent(input);
        return componentInfo ? componentInfo.comp_id : null;
    }

    getComponent(componentName) {
        if (!this.initialized) {
            throw new Error('ComponentCache not initialized');
        }
        if (typeof componentName !== 'string') {
            return null;
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
await componentCache.initialize();
export default componentCache; 