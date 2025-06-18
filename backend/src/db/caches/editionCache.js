import { timedQuery } from "../queryTimer.js";

class EditionCache {
    constructor() {
        this.editions = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const { rows } = await timedQuery('SELECT * FROM editions', [], 'EditionCache');
        for (const row of rows) {
            this.editions.set(row.edition_id, {
                edition_id: row.edition_id,
                edition_name: row.edition_name,
                edition_abbrev: row.edition_abbrev
            });
        }
        this.initialized = true;
        console.log(`[EditionCache] Initialized with ${this.editions.size} editions`);
    }

    getEditionById(editionId) {
        if (!this.initialized) {
            throw new Error('EditionCache not initialized');
        }
        return this.editions.get(editionId);
    }

    getEditionByAbbrev(abbrev) {
        if (!this.initialized) {
            throw new Error('EditionCache not initialized');
        }
        if (typeof abbrev !== 'string') {
            return null;
        }
        return Array.from(this.editions.values()).find(edition =>
            edition.edition_abbrev.toLowerCase() === abbrev.toLowerCase()
        );
    }
}

const editionCache = new EditionCache();
await editionCache.initialize();
export default editionCache; 