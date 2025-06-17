import api from '@/services/api';

let _isInitialized = false;
let _initializationPromise = null;

class LookupService {
    constructor() {
        this.lookups = {
            classes: new Map(),
            components: new Map(),
            descriptors: new Map(),
            ranges: new Map(),
            schools: new Map(),
            sources: new Map(),
            editions: new Map(),
            subschools: new Map(),
            spells: new Map()
        };

        this.fieldMappings = {
            classes: {
                id: 'class_id',
                name: 'class_name'
            },
            components: {
                id: 'comp_id',
                name: 'comp_name'
            },
            descriptors: {
                id: 'desc_id',
                name: 'descriptor'
            },
            ranges: {
                id: 'range_id',
                name: 'range_name'
            },
            schools: {
                id: 'school_id',
                name: 'school_name'
            },
            sources: {
                id: 'book_id',
                name: 'title' // Use full title for display
            },
            editions: {
                id: 'edition_id',
                name: 'edition_abbrev'
            },
            subschools: {
                id: 'sub_id',
                name: 'subschool'
            },
            spells: {
                id: 'spell_id',
                name: 'spell_name'
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
                data.components.forEach(comp => this.lookups.components.set(comp.comp_id, comp));
                data.descriptors.forEach(desc => this.lookups.descriptors.set(desc.desc_id, desc));
                data.ranges.forEach(range => this.lookups.ranges.set(range.range_id, range));
                data.schools.forEach(school => this.lookups.schools.set(school.school_id, school));
                data.sources.forEach(source => this.lookups.sources.set(source.book_id, source));
                data.editions.forEach(edition => this.lookups.editions.set(edition.edition_id, edition));
                data.subschools.forEach(subschool => this.lookups.subschools.set(subschool.sub_id, subschool));

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

    // Convenience methods for specific types
    getSchoolNames(ids) {
        return this.getDisplayNames('schools', ids);
    }

    getDescriptorNames(ids) {
        return this.getDisplayNames('descriptors', ids);
    }

    getComponentNames(ids) {
        return this.getDisplayNames('components', ids);
    }

    getComponentAbbreviations(ids) {
        if (!ids) return '';
        const names = ids.map(id => {
            const item = this.getById('components', id);
            return item?.comp_abbrev || '';
        });
        return names.join(', ');
    }

    getClassNames(ids) {
        // Now apply filtering for classes if needed
        return this.getDisplayNames('classes', ids);
    }

    getClassDisplay(classes, spellLevel) {
        if (!classes || classes.length === 0) return '';

        const formattedClasses = classes.map(cls => {
            const classItem = this.getById('classes', cls.class_id);
            if (classItem) {
                if (cls.level !== spellLevel) {
                    return `${classItem.class_abbr} ${cls.level}`;
                } else {
                    return classItem.class_abbr;
                }
            }
            return 'Unknown Class';
        });

        return formattedClasses.join(', ');
    }

    getSubschoolNames(ids) {
        return this.getDisplayNames('subschools', ids);
    }

    getSubschoolsBySchoolId(schoolId) {
        if (!_isInitialized) {
            throw new Error('LookupService not initialized');
        }
        return Array.from(this.lookups.subschools.values()).filter(subschool => subschool.school_id === schoolId);
    }

    getClassLevelAbbr(classLevels) {
        if (!classLevels || classLevels.length === 0) return '';

        // Use a Map to store { spell_level: { sorcererPresent: boolean, wizardPresent: boolean, otherClasses: Set<string> } }
        const organizedClassLevels = new Map();

        classLevels.forEach(cl => {
            const classItem = this.getById('classes', cl.class_id);
            if (classItem) {
                const levelData = organizedClassLevels.get(cl.spell_level) || {
                    sorcererPresent: false,
                    wizardPresent: false,
                    otherClasses: new Set()
                };

                const abbr = classItem.class_abbr;
                if (abbr === 'Sor') {
                    levelData.sorcererPresent = true;
                } else if (abbr === 'Wiz') {
                    levelData.wizardPresent = true;
                } else {
                    levelData.otherClasses.add(abbr);
                }
                organizedClassLevels.set(cl.spell_level, levelData);
            }
        });

        const formattedEntries = [];

        // Sort levels to ensure consistent order
        const sortedLevels = Array.from(organizedClassLevels.keys()).sort((a, b) => a - b);

        sortedLevels.forEach(level => {
            const levelData = organizedClassLevels.get(level);
            let currentLevelAbbrs = [];

            // Handle Sorcerer/Wizard combination first for this level
            if (levelData.sorcererPresent && levelData.wizardPresent) {
                currentLevelAbbrs.push('Sor/Wiz');
            } else {
                if (levelData.sorcererPresent) {
                    currentLevelAbbrs.push('Sor');
                }
                if (levelData.wizardPresent) {
                    currentLevelAbbrs.push('Wiz');
                }
            }

            // Add other classes, sorted alphabetically
            const sortedOtherClasses = Array.from(levelData.otherClasses).sort();
            currentLevelAbbrs.push(...sortedOtherClasses);

            // Format each abbreviation with its level
            currentLevelAbbrs.forEach(abbr => {
                formattedEntries.push(`${abbr} ${level}`);
            });
        });

        // Sort the final combined entries alphabetically
        formattedEntries.sort();

        return formattedEntries.join(', ');
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