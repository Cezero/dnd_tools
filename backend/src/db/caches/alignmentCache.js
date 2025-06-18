import { timedQuery } from "../queryTimer.js";

class AlignmentCache {
    constructor() {
        this.alignments = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            console.log('[AlignmentCache] Initializing...');
            const { rows } = await timedQuery('SELECT * FROM alignments', [], 'AlignmentCache');
            for (const row of rows) {
                this.alignments.set(row.alignment_id, {
                    alignment_id: row.alignment_id,
                    alignment_name: row.alignment_name,
                    alignment_abbr: row.alignment_abbr
                });
            }
            this.initialized = true;
            console.log(`[AlignmentCache] Initialized with ${this.alignments.size} alignments`);
        } catch (error) {
            console.error('[AlignmentCache] Failed to initialize:', error);
        }
    }

    getByID(alignmentId) {
        if (!this.initialized) {
            throw new Error('AlignmentCache not initialized');
        }
        return this.alignments.get(alignmentId);
    }

    getByName(alignmentName) {
        if (!this.initialized) {
            throw new Error('AlignmentCache not initialized');
        }
        if (typeof alignmentName !== 'string') {
            return null;
        }
        return Array.from(this.alignments.values()).find(alignment =>
            alignment.alignment_name.toLowerCase() === alignmentName.toLowerCase()
        );
    }
}

const alignmentCache = new AlignmentCache();
await alignmentCache.initialize();
export default alignmentCache; 