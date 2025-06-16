import express from 'express';
import classCache from '../db/caches/classCache.js';
import componentCache from '../db/caches/componentCache.js';
import descriptorCache from '../db/caches/descriptorCache.js';
import rangeCache from '../db/caches/rangeCache.js';
import schoolCache from '../db/caches/schoolCache.js';
import sourceCache from '../db/caches/sourceCache.js';
import editionCache from '../db/caches/editionCache.js';
import subschoolCache from '../db/caches/subschoolCache.js';
import spellCache from '../db/caches/spellCache.js';
import alignmentCache from '../db/caches/alignmentCache.js';
import raceCache from '../db/caches/raceCache.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // Ensure all caches are initialized
        await Promise.all([
            classCache.initialize(),
            componentCache.initialize(),
            descriptorCache.initialize(),
            rangeCache.initialize(),
            schoolCache.initialize(),
            sourceCache.initialize(),
            editionCache.initialize(),
            subschoolCache.initialize(),
            spellCache.initialize(),
            alignmentCache.initialize(),
            raceCache.initialize()
        ]);

        // Get all data from caches
        const lookups = {
            classes: Array.from(classCache.classes.values()),
            components: Array.from(componentCache.components.values()),
            descriptors: Array.from(descriptorCache.descriptors.values()),
            ranges: Array.from(rangeCache.ranges.values()),
            schools: Array.from(schoolCache.schools.values()),
            sources: Array.from(sourceCache.sources.values()),
            editions: Array.from(editionCache.editions.values()),
            subschools: Array.from(subschoolCache.subschools.values()),
            spells: Array.from(spellCache.spells.values()),
            alignments: Array.from(alignmentCache.alignments.values()),
            races: Array.from(raceCache.races.values())
        };

        res.json(lookups);
    } catch (err) {
        console.error('Error fetching lookup data:', err);
        res.status(500).json({ error: 'Failed to fetch lookup data' });
    }
});

export default router; 