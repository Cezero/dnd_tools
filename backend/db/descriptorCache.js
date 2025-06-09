import pool from './pool.js';

class DescriptorCache {
    constructor() {
        this.descriptors = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const [rows] = await pool.query('SELECT * FROM spell_descriptors');
        for (const row of rows) {
            this.descriptors.set(row.desc_id, {
                desc_id: row.desc_id,
                descriptor: row.descriptor
            });
        }
        this.initialized = true;
        console.log(`[DescriptorCache] Initialized with ${this.descriptors.size} descriptors`);
    }

    getDescriptor(descriptorName) {
        if (!this.initialized) {
            throw new Error('DescriptorCache not initialized');
        }
        return Array.from(this.descriptors.values()).find(desc =>
            desc.descriptor.toLowerCase() === descriptorName.toLowerCase()
        );
    }

    getDescriptorById(descriptorId) {
        if (!this.initialized) {
            throw new Error('DescriptorCache not initialized');
        }
        return this.descriptors.get(descriptorId);
    }
}

const descriptorCache = new DescriptorCache();
descriptorCache.initialize();
export default descriptorCache; 