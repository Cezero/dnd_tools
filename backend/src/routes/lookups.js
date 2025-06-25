import express from 'express';
import classCache from '../db/caches/classCache.js';
import sourceCache from '../db/caches/sourceCache.js';
import editionCache from '../db/caches/editionCache.js';
import spellCache from '../db/caches/spellCache.js';
import raceCache from '../db/caches/raceCache.js';
import skillCache from '../db/caches/skillCache.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        // Ensure all caches are initialized
        await Promise.all([
            classCache.initialize(),
            spellCache.initialize(),
            sourceCache.initialize(),
            editionCache.initialize(),
            raceCache.initialize(),
            skillCache.initialize()
        ]);

        // Get all data from caches
        const lookups = {
            classes: Array.from(classCache.classes.values()),
            sources: Array.from(sourceCache.sources.values()),
            editions: Array.from(editionCache.editions.values()),
            spells: Array.from(spellCache.spells.values()),
            races: Array.from(raceCache.races.values()),
            skills: Array.from(skillCache.skills.values())
        };

        res.json(lookups);
    } catch (err) {
        console.error('Error fetching lookup data:', err);
        res.status(500).json({ error: 'Failed to fetch lookup data' });
    }
});

export default router; 