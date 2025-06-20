import api from '@/services/api';

let _isInitialized = false;
let _initializationPromise = null;

class LookupService {
    constructor() {
        this.lookups = {
            classes: new Map(),
            spells: new Map(),
            races: new Map(),
            sources: new Map(),
            editions: new Map(),
        };

        this.fieldMappings = {
            classes: {
                id: 'class_id',
                name: 'class_name'
            },
            spells: {
                id: 'spell_id',
                name: 'spell_name'
            },
            races: {
                id: 'race_id',
                name: 'race_name'
            },
            sources: {
                id: 'book_id',
                name: 'title' // Use full title for display
            },
            editions: {
                id: 'edition_id',
                name: 'edition_abbrev'
            }
        };
    }

    async initialize() {
        if (_initializationPromise) {
            return _initializationPromise;
        }

        _initializationPromise = new Promise(async (resolve, reject) => {
            try {
                console.log('[LookupService] Initializing...');
                const data = await api('/lookups');

                data.classes.forEach(cls => this.lookups.classes.set(cls.class_id, cls));
                data.spells.forEach(spell => this.lookups.spells.set(spell.spell_id, spell));
                data.races.forEach(race => this.lookups.races.set(race.race_id, race));
                data.sources.forEach(source => this.lookups.sources.set(source.book_id, source));
                data.editions.forEach(edition => this.lookups.editions.set(edition.edition_id, edition));

                // Populate spells from lookup data
                data.spells.forEach(spell => this.lookups.spells.set(spell.spell_name.toLowerCase(), spell));

                _isInitialized = true;
                console.log('[LookupService] Initialized with lookup data');
                resolve();
            } catch (error) {
                console.error('[LookupService] Failed to initialize:', error);
                _initializationPromise = null; // Reset on failure so it can be retried
                reject(error);
            }
        });

        return _initializationPromise;
    }

    #validateType(type) {
        if (!_isInitialized) {
            throw new Error('LookupService not initialized');
        }
        if (!this.fieldMappings[type]) {
            throw new Error(`Unknown lookup type: ${type}`);
        }
        return this.fieldMappings[type];
    }

    // Get all items of a type, with optional edition filtering
    getAll(type) {
        this.#validateType(type);
        return Array.from(this.lookups[type].values());
    }

    // Get a single item by ID
    getById(type, id) {
        this.#validateType(type);
        const item = this.lookups[type].get(id);
        return item;
    }

    // Get a single item by name
    getByName(type, name) {
        // For spells, we use the pre-built spell map for efficient lookup
        if (type === 'spells') {
            return this.lookups.spells.get(name.toLowerCase());
        }
        const fields = this.#validateType(type);
        return Array.from(this.lookups[type].values()).find(item =>
            item[fields.name].toLowerCase() === name.toLowerCase()
        );
    }

    // Get options for select/dropdown components (now uses getAll for filtering)
    getOptions(type) {
        const fields = this.#validateType(type);
        const items = this.getAll(type);
        return items.map(item => ({
            value: item[fields.id],
            label: item[fields.name]
        }));
    }

    // Get display names for arrays of IDs
    getDisplayNames(type, ids) {
        if (!ids) return '';
        const fields = this.#validateType(type);
        const names = ids.map(id => {
            const item = this.getById(type, id);
            return item?.[fields.name] || 'Unknown';
        });
        return names.join(', ');
    }

    getClassNames(ids) {
        // Now apply filtering for classes if needed
        return this.getDisplayNames('classes', ids);
    }

    getSourceNames(ids) {
        return this.getDisplayNames('sources', ids);
    }

    getSourceDisplay(sources, useAbbrev = false) {
        if (!sources || sources.length === 0) return '';

        return sources.map(source => {
            const book = this.getById('sources', source.book_id);
            if (book) {
                const displayTitle = useAbbrev ? book.abbrev_title : book.title;
                return source.page_number ? `${displayTitle} (pg ${source.page_number})` : displayTitle;
            }
            return 'Unknown Source';
        }).join(', ');
    }
}

const lookupService = new LookupService();
export default lookupService; 