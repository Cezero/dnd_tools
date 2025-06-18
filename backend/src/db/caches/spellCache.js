import { timedQuery } from "../queryTimer.js";

class SpellCache {
    constructor() {
        this.spells = new Map(); // Stores {spell_name.toLowerCase(): {spell_id, spell_name}}
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            console.log('[SpellCache] Initializing...');
            const { rows } = await timedQuery('SELECT spell_id, spell_name FROM spells', [], 'spellCache');
            rows.forEach(spell => {
                this.spells.set(spell.spell_name.toLowerCase(), { spell_id: spell.spell_id, spell_name: spell.spell_name });
            });
            this.initialized = true;
            console.log('[SpellCache] Initialized with spell data');
        } catch (error) {
            console.error('[SpellCache] Failed to initialize:', error);
        }
    }

    getById(spellId) {
        // This method is not strictly necessary for the current use case,
        // but is included for completeness if direct ID lookup is needed later.
        for (let spell of this.spells.values()) {
            if (spell.spell_id === spellId) {
                return spell;
            }
        }
        return null;
    }

    getByName(spellName) {
        return this.spells.get(spellName.toLowerCase());
    }
}

const spellCache = new SpellCache();
await spellCache.initialize();
export default spellCache; 