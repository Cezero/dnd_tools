import { timedQuery } from "../queryTimer.js";

class SourceCache {
    constructor() {
        this.sources = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const { rows } = await timedQuery('SELECT * FROM source_books where display = 1', [], 'SourceCache(books)');
        const { rows: spellSourceRows } = await timedQuery('SELECT DISTINCT book_id FROM spell_source_map', [], 'SourceCache(spell_source_map)');
        const booksWithSpells = new Set(spellSourceRows.map(row => row.book_id));

        for (const row of rows) {
            this.sources.set(row.book_id, {
                book_id: row.book_id,
                title: row.title,
                abbrev_title: row.abbrev_title,
                edition_id: row.edition_id,
                has_spells: booksWithSpells.has(row.book_id),
                sort_order: row.sort_order
            });
        }
        this.initialized = true;
        console.log(`[SourceCache] Initialized with ${this.sources.size} source books`);
    }

    getSourceById(bookId) {
        if (!this.initialized) {
            throw new Error('SourceCache not initialized');
        }
        return this.sources.get(bookId);
    }

    getSourceByAbbrev(abbrev) {
        if (!this.initialized) {
            throw new Error('SourceCache not initialized');
        }
        if (typeof abbrev !== 'string') {
            return null;
        }
        return Array.from(this.sources.values()).find(source =>
            source.abbrev_title.toLowerCase() === abbrev.toLowerCase()
        );
    }
}

const sourceCache = new SourceCache();
await sourceCache.initialize();
export default sourceCache; 