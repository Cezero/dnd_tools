import { timedQuery } from "../queryTimer.js";

class RaceCache {
    constructor() {
        this.races = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            console.log('[RaceCache] Initializing...');
            const { rows } = await timedQuery('SELECT * FROM races', [], 'RaceCache');
            for (const row of rows) {
                this.races.set(row.race_id, {
                    race_id: row.race_id,
                    race_name: row.race_name,
                    race_abbr: row.race_abbr,
                    edition_id: row.edition_id,
                    display: row.display
                });
            }
            this.initialized = true;
            console.log(`[RaceCache] Initialized with ${this.races.size} races`);
        } catch (error) {
            console.error('[RaceCache] Failed to initialize:', error);
        }
    }

    getByID(raceId) {
        if (!this.initialized) {
            throw new Error('RaceCache not initialized');
        }
        return this.races.get(raceId);
    }

    getByName(raceName) {
        if (!this.initialized) {
            throw new Error('RaceCache not initialized');
        }
        if (typeof raceName !== 'string') {
            return null;
        }
        return Array.from(this.races.values()).find(race =>
            race.race_name.toLowerCase() === raceName.toLowerCase()
        );
    }
}

const raceCache = new RaceCache();
await raceCache.initialize();
export default raceCache; 