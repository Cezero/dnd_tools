import { timedQuery } from "../queryTimer.js";

class DescriptorCache {
    constructor() {
        this.descriptors = new Map();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        const rows = await timedQuery('SELECT * FROM spell_descriptors', [], 'DescriptorCache');
        for (const row of rows) {
            this.descriptors.set(row.desc_id, {
                desc_id: row.desc_id,
                descriptor: row.descriptor
            });
        }
        this.initialized = true;
        console.log(`[DescriptorCache] Initialized with ${this.descriptors.size} descriptors`);
    }

    getID(input) {
        if (!this.initialized) {
            throw new Error('DescriptorCache not initialized');
        }
        if (!input) return null;

        // If input is a number or numeric string, try to use it as an ID
        const numericInput = Number(input);
        if (!isNaN(numericInput)) {
            return this.descriptors.has(numericInput) ? numericInput : null;
        }

        // Otherwise try to find by name
        const descriptorInfo = this.getDescriptor(input);
        return descriptorInfo ? descriptorInfo.desc_id : null;
    }

    getDescriptor(descriptorName) {
        if (!this.initialized) {
            throw new Error('DescriptorCache not initialized');
        }
        if (typeof descriptorName !== 'string') {
            return null;
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

    getIDs(descriptorNames) {
        if (!this.initialized) {
            throw new Error('DescriptorCache not initialized');
        }
        if (!Array.isArray(descriptorNames) || descriptorNames.length === 0) {
            return [];
        }
        const ids = [];
        for (const name of descriptorNames) {
            const descriptorInfo = this.getDescriptor(name);
            if (descriptorInfo) {
                ids.push(descriptorInfo.desc_id);
            }
        }
        return ids;
    }
}

const descriptorCache = new DescriptorCache();
await descriptorCache.initialize();
export default descriptorCache; 