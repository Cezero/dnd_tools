import { timedQuery, runTransactionWith } from '../../../db/queryTimer.js';
import { processRacesQuery, buildRacesQuery } from '../lib/raceQueryBuilder.js';
import { processRaceTraitsQuery, buildRaceTraitsQuery } from '../lib/raceTraitQueryBuilder.js';

/**
 * Fetches all races from the database with pagination and filtering.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const getRaces = async (req, res) => {
    const processedQuery = processRacesQuery(req.query);

    if (processedQuery.errors.length > 0) {
        return res.status(400).json({ error: processedQuery.errors.join('; ') });
    }

    const { page, limit } = processedQuery.pagination;
    try {
        const { mainQuery, queryValues } = buildRacesQuery(processedQuery);
        console.log('Final SQL Query:', mainQuery);
        console.log('Query Values:', queryValues);

        const { rows } = await timedQuery(
            mainQuery,
            queryValues,
            `Races list query`
        );

        const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

        res.json({
            page: Number(page),
            limit: Number(limit),
            total: total,
            results: rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
};

/**
 * Fetches a single race by its ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const getRaceById = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows: races } = await timedQuery(
            'SELECT r.* FROM races r WHERE race_id = ?',
            [id],
            'getRaceById'
        );
        if (races.length === 0) {
            return res.status(404).send('Race not found');
        }

        const { rows: languages } = await timedQuery(
            'SELECT language_id, automatic FROM race_language_map WHERE race_id = ?',
            [id],
            'getRaceLanguages'
        );

        const { rows: attributeAdjustments } = await timedQuery(
            'SELECT attribute_id, attribute_adjustment FROM race_attribute_adjustments WHERE race_id = ?',
            [id],
            'getRaceAttributeAdjustments'
        );

        const { rows: traits } = await timedQuery(
            'SELECT rtm.trait_slug, rt.trait_name, rt.trait_description, rtm.trait_value, rt.value_flag FROM race_trait_map rtm JOIN race_traits rt ON rtm.trait_slug = rt.trait_slug WHERE rtm.race_id = ?',
            [id],
            'getRaceTraits'
        );

        res.json({
            ...races[0],
            languages: languages,
            attribute_adjustments: attributeAdjustments,
            traits: traits
        });
    } catch (error) {
        console.error('Error fetching race by ID:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Fetches all race traits from the database.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const getRaceTraits = async (req, res) => {
    const processedQuery = processRaceTraitsQuery(req.query);

    if (processedQuery.errors.length > 0) {
        return res.status(400).json({ error: processedQuery.errors.join('; ') });
    }

    const { page, limit } = processedQuery.pagination;
    try {
        const { mainQuery, queryValues } = buildRaceTraitsQuery(processedQuery);
        console.log('Final SQL Query (Race Traits):', mainQuery);
        console.log('Query Values (Race Traits):', queryValues);

        const { rows } = await timedQuery(
            mainQuery,
            queryValues,
            `Race Traits list query`
        );

        const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

        res.json({
            page: Number(page),
            limit: Number(limit),
            total: total,
            results: rows,
        });
    } catch (error) {
        console.error('Error fetching race traits:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Fetches a single race trait by its ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const getRaceTraitById = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows: traits } = await timedQuery(
            'SELECT trait_slug, trait_name, trait_description, value_flag FROM race_traits WHERE trait_slug = ?',
            [id],
            'getRaceTraitById'
        );
        if (traits.length === 0) {
            return res.status(404).send('Race trait not found');
        }
        res.json(traits[0]);
    } catch (error) {
        console.error('Error fetching race trait by ID:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Creates a new race.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const createRace = async (req, res) => {
    const { name, race_description, size_id, race_speed, favored_class_id, edition_id, display, languages } = req.body;
    try {
        const result = await runTransactionWith(async (txTimedQuery) => {
            const { raw } = await txTimedQuery(
                'INSERT INTO races (race_name, race_description, size_id, race_speed, favored_class_id, edition_id, display) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name, race_description, size_id, race_speed, favored_class_id, edition_id, display],
                'createRace'
            );
            const newRaceId = raw.insertId;

            if (languages && languages.length > 0) {
                const languageInserts = languages.map(lang => [newRaceId, lang.language_id, lang.automatic]);
                await txTimedQuery(
                    'INSERT INTO race_language_map (race_id, language_id, automatic) VALUES ?',
                    [languageInserts],
                    'insertRaceLanguages'
                );
            }

            const { attribute_adjustments } = req.body;
            if (attribute_adjustments && attribute_adjustments.length > 0) {
                const adjustmentInserts = attribute_adjustments.map(adj => [newRaceId, adj.attribute_id, adj.attribute_adjustment]);
                await txTimedQuery(
                    'INSERT INTO race_attribute_adjustments (race_id, attribute_id, attribute_adjustment) VALUES ?',
                    [adjustmentInserts],
                    'insertRaceAttributeAdjustments'
                );
            }
            const { traits } = req.body;
            if (traits && traits.length > 0) {
                const traitInserts = traits.map(trait => [newRaceId, trait.trait_slug, trait.trait_value]);
                await txTimedQuery(
                    'INSERT INTO race_trait_map (race_id, trait_slug, trait_value) VALUES ?',
                    [traitInserts],
                    'insertRaceTraits'
                );
            }

            return newRaceId;
        });
        res.status(201).json({ id: result, message: 'Race created successfully' });
    } catch (error) {
        console.error('Error creating race:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Creates a new race trait.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const createRaceTrait = async (req, res) => {
    const { trait_slug, trait_name, trait_description, value_flag } = req.body;
    try {
        const { raw } = await timedQuery(
            'INSERT INTO race_traits (trait_slug, trait_name, trait_description, value_flag) VALUES (?, ?, ?, ?)',
            [trait_slug, trait_name, trait_description, value_flag],
            'createRaceTrait'
        );
        res.status(201).json({ id: raw.insertId, message: 'Race trait created successfully' });
    } catch (error) {
        console.error('Error creating race trait:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Updates an existing race.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const updateRace = async (req, res) => {
    const { id } = req.params;
    const { name, race_description, size_id, race_speed, favored_class_id, edition_id, display, languages } = req.body;
    try {
        await runTransactionWith(async (txTimedQuery) => {
            const { raw } = await txTimedQuery(
                'UPDATE races SET race_name = ?, race_description = ?, size_id = ?, race_speed = ?, favored_class_id = ?, edition_id = ?, display = ? WHERE race_id = ?',
                [name, race_description, size_id, race_speed, favored_class_id, edition_id, display, id],
                'updateRace'
            );
            if (raw.affectedRows === 0) {
                throw new Error('Race not found or no changes made');
            }

            // Update languages
            await txTimedQuery(
                'DELETE FROM race_language_map WHERE race_id = ?',
                [id],
                'deleteRaceLanguages'
            );
            if (languages && languages.length > 0) {
                const languageInserts = languages.map(lang => [id, lang.language_id, lang.automatic]);
                await txTimedQuery(
                    'INSERT INTO race_language_map (race_id, language_id, automatic) VALUES ?',
                    [languageInserts],
                    'insertRaceLanguages'
                );
            }

            // Update attribute adjustments
            await txTimedQuery(
                'DELETE FROM race_attribute_adjustments WHERE race_id = ?',
                [id],
                'deleteRaceAttributeAdjustments'
            );

            const { attribute_adjustments, traits } = req.body;
            if (attribute_adjustments && attribute_adjustments.length > 0) {
                const adjustmentInserts = attribute_adjustments.map(adj => [id, adj.attribute_id, adj.attribute_adjustment]);
                await txTimedQuery(
                    'INSERT INTO race_attribute_adjustments (race_id, attribute_id, attribute_adjustment) VALUES ?',
                    [adjustmentInserts],
                    'insertRaceAttributeAdjustments'
                );
            }

            // Update traits
            await txTimedQuery(
                'DELETE FROM race_trait_map WHERE race_id = ?',
                [id],
                'deleteRaceTraits'
            );
            if (traits && traits.length > 0) {
                const traitInserts = traits.map(trait => [id, trait.trait_slug, trait.trait_value]);
                await txTimedQuery(
                    'INSERT INTO race_trait_map (race_id, trait_slug, trait_value) VALUES (?, ?, ?)',
                    [traitInserts],
                    'insertRaceTraits'
                );
            }
        });
        res.status(200).json({ message: 'Race updated successfully' });
    } catch (error) {
        console.error('Error updating race:', error);
        if (error.message === 'Race not found or no changes made') {
            res.status(404).send(error.message);
        } else {
            res.status(500).send('Server error');
        }
    }
};

/**
 * Updates an existing race trait.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const updateRaceTrait = async (req, res) => {
    const { id } = req.params;
    const { trait_name, trait_description, value_flag } = req.body;
    try {
        const { raw } = await timedQuery(
            'UPDATE race_traits SET trait_name = ?, trait_description = ?, value_flag = ? WHERE trait_slug = ?',
            [trait_name, trait_description, value_flag, id],
            'updateRaceTrait'
        );
        if (raw.affectedRows === 0) {
            throw new Error('Race trait not found or no changes made');
        }
        res.status(200).json({ message: 'Race trait updated successfully' });
    } catch (error) {
        console.error('Error updating race trait:', error);
        if (error.message === 'Race trait not found or no changes made') {
            res.status(404).send(error.message);
        } else {
            res.status(500).send('Server error');
        }
    }
};

/**
 * Deletes a race by its ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const deleteRace = async (req, res) => {
    const { id } = req.params;
    try {
        await runTransactionWith(async (txTimedQuery) => {
            const { raw } = await txTimedQuery(
                'DELETE FROM races WHERE race_id = ?',
                [id],
                'deleteRace'
            );
            if (raw.affectedRows === 0) {
                throw new Error('Race not found');
            }
        });
        res.status(204).send(); // No Content
    } catch (error) {
        console.error('Error deleting race:', error);
        if (error.message === 'Race not found') {
            res.status(404).send(error.message);
        } else {
            res.status(500).send('Server error');
        }
    }
};

/**
 * Deletes a race trait by its ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const deleteRaceTrait = async (req, res) => {
    const { id } = req.params;
    try {
        const { raw } = await timedQuery(
            'DELETE FROM race_traits WHERE trait_slug = ?',
            [id],
            'deleteRaceTrait'
        );
        if (raw.affectedRows === 0) {
            throw new Error('Race trait not found');
        }
        res.status(204).send(); // No Content
    } catch (error) {
        console.error('Error deleting race trait:', error);
        if (error.message === 'Race trait not found') {
            res.status(404).send(error.message);
        } else {
            res.status(500).send('Server error');
        }
    }
}; 