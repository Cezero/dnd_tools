import { timedQuery, runTransactionWith } from '../../../db/queryTimer.js';
import { processRacesQuery, buildRacesQuery } from '../lib/raceQueryBuilder.js';

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

        res.json({
            ...races[0],
            languages: languages
        });
    } catch (error) {
        console.error('Error fetching race by ID:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Creates a new race.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const createRace = async (req, res) => {
    const { name, raceDescription, sizeId, raceSpeed, favoredClassId, editionId, display, languages } = req.body;
    try {
        const result = await runTransactionWith(async (txTimedQuery) => {
            const { raw } = await txTimedQuery(
                'INSERT INTO races (race_name, race_description, size_id, race_speed, favored_class_id, edition_id, display) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name, raceDescription, sizeId, raceSpeed, favoredClassId, editionId, display],
                'createRace'
            );
            const newRaceId = raw.insertId;

            if (languages && languages.length > 0) {
                const languageInserts = languages.map(langId => [newRaceId, langId]);
                await txTimedQuery(
                    'INSERT INTO race_language_map (race_id, language_id) VALUES ?',
                    [languageInserts],
                    'insertRaceLanguages'
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