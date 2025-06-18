import { timedQuery } from "../queryTimer.js";

class RangeCache {
    constructor() {
        this.ranges = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const { rows }  = await timedQuery('SELECT * FROM spell_ranges', [], 'RangeCache');
        for (const row of rows) {
            this.ranges.set(row.range_id, {
                range_id: row.range_id,
                range_name: row.range_name,
                range_abbr: row.range_abbr
            });
        }
        this.initialized = true;
        console.log(`[RangeCache] Initialized with ${this.ranges.size} ranges`);
    }

    getRange(rangeId) {
        if (!this.initialized) {
            throw new Error('RangeCache not initialized');
        }
        return this.ranges.get(rangeId);
    }

    getRangeByName(rangeName) {
        if (!this.initialized) {
            throw new Error('RangeCache not initialized');
        }
        return Array.from(this.ranges.values()).find(range => range.range_name === rangeName);
    }
}

const rangeCache = new RangeCache();
await rangeCache.initialize();
export default rangeCache;
