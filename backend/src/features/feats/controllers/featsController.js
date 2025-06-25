import { timedQuery, runTransactionWith } from '../../../db/queryTimer.js';
import { buildQuery, processQuery } from '../../../db/queryBuilder.js';
import { featFilterConfig } from '../config/featConfig.js';

/**
 * Fetches all feats from the database with pagination and filtering.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const getFeats = async (req, res) => {
    const processedQuery = processQuery(req.query, featFilterConfig);

    if (processedQuery.errors.length > 0) {
        return res.status(400).json({ error: processedQuery.errors.join('; ') });
    }

    const { page, limit } = processedQuery.pagination;
    try {
        const { mainQuery, queryValues } = buildQuery(featFilterConfig, processedQuery);
        console.log('Final SQL Query:', mainQuery);
        console.log('Query Values:', queryValues);

        const { rows } = await timedQuery(
            mainQuery,
            queryValues,
            `Feats list query`
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

export const getAllFeats = async (req, res) => {
    try {
        const { rows } = await timedQuery('SELECT feat_id, feat_name FROM feats', [], 'getAllFeats');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching all feats:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Fetches a single feat by its ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const getFeatById = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows: feats } = await timedQuery(
            'SELECT f.* FROM feats f WHERE feat_id = ?',
            [id],
            'getFeatById'
        );
        if (feats.length === 0) {
            return res.status(404).send('Feat not found');
        }

        const { rows: benefits } = await timedQuery(
            'SELECT benefit_index, benefit_type, benefit_type_id, benefit_amount FROM feat_benefit_map WHERE feat_id = ?',
            [id],
            'getFeatBenefits'
        );

        const { rows: prereqs } = await timedQuery(
            'SELECT prereq_index, prereq_type, prereq_amount, prereq_type_id FROM feat_prereq_map WHERE feat_id = ?',
            [id],
            'getFeatPrereqs'
        );

        res.json({
            ...feats[0],
            benefits: benefits,
            prereqs: prereqs
        });
    } catch (error) {
        console.error('Error fetching feat by ID:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Creates a new feat.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const createFeat = async (req, res) => {
    const { feat_name, feat_type, feat_description, feat_benefit, feat_normal, feat_special, feat_prereq, feat_multi_times, benefits, prereqs } = req.body;
    try {
        const result = await runTransactionWith(async (txTimedQuery) => {
            const { rows } = await txTimedQuery(
                'INSERT INTO feats (feat_name, feat_type, feat_description, feat_benefit, feat_normal, feat_special, feat_prereq, feat_multi_times) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [feat_name, feat_type, feat_description, feat_benefit, feat_normal, feat_special, feat_prereq, feat_multi_times],
                'createFeat'
            );
            const newFeatId = rows.insertId;

            if (benefits && benefits.length > 0) {
                const benefitInserts = benefits.map(benefit => [newFeatId, benefit.benefit_index, benefit.benefit_type, benefit.benefit_type_id, benefit.benefit_amount]);
                await txTimedQuery(
                    'INSERT INTO feat_benefit_map (feat_id, benefit_index, benefit_type, benefit_type_id, benefit_amount) VALUES ?',
                    [benefitInserts],
                    'insertFeatBenefits'
                );
            }

            if (prereqs && prereqs.length > 0) {
                const prereqInserts = prereqs.map(prereq => [newFeatId, prereq.prereq_index, prereq.prereq_type, prereq.prereq_amount, prereq.prereq_type_id]);
                await txTimedQuery(
                    'INSERT INTO feat_prereq_map (feat_id, prereq_index, rereq_type, prereq_amount, prereq_type_id) VALUES ?',
                    [prereqInserts],
                    'insertFeatPrereqs'
                );
            }

            return newFeatId;
        });
        res.status(201).json({ id: result, message: 'Feat created successfully' });
    } catch (error) {
        console.error('Error creating feat:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Updates an existing feat.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const updateFeat = async (req, res) => {
    const { id } = req.params;
    const { feat_name, feat_type, feat_description, feat_benefit, feat_normal, feat_special, feat_prereq, feat_multi_times, benefits, prereqs } = req.body;
    try {
        await runTransactionWith(async (txTimedQuery) => {
            const { raw } = await txTimedQuery(
                'UPDATE feats SET feat_name = ?, feat_type = ?, feat_description = ?, feat_benefit = ?, feat_normal = ?, feat_special = ?, feat_prereq = ?, feat_multi_times = ? WHERE feat_id = ?',
                [feat_name, feat_type, feat_description, feat_benefit, feat_normal, feat_special, feat_prereq, feat_multi_times, id],
                'updateFeat'
            );
            if (raw.affectedRows === 0) {
                throw new Error('Feat not found or no changes made');
            }

            // Update benefits
            await txTimedQuery(
                'DELETE FROM feat_benefit_map WHERE feat_id = ?',
                [id],
                'deleteFeatBenefits'
            );
            if (benefits && benefits.length > 0) {
                const benefitInserts = benefits.map(benefit => [id, benefit.benefit_index, benefit.benefit_type, benefit.benefit_type_id, benefit.benefit_amount]);
                await txTimedQuery(
                    'INSERT INTO feat_benefit_map (feat_id, benefit_index, benefit_type, benefit_type_id, benefit_amount) VALUES ?',
                    [benefitInserts],
                    'insertFeatBenefits'
                );
            }

            // Update prerequisites
            await txTimedQuery(
                'DELETE FROM feat_prereq_map WHERE feat_id = ?',
                [id],
                'deleteFeatPrereqs'
            );
            if (prereqs && prereqs.length > 0) {
                const prereqInserts = prereqs.map(prereq => [id, prereq.prereq_index, prereq.prereq_type, prereq.prereq_amount, prereq.prereq_type_id]);
                await txTimedQuery(
                    'INSERT INTO feat_prereq_map (feat_id, prereq_index, prereq_type, prereq_amount, prereq_type_id) VALUES ?',
                    [prereqInserts],
                    'insertFeatPrereqs'
                );
            }
        });
        res.status(200).json({ message: 'Feat updated successfully' });
    } catch (error) {
        console.error('Error updating feat:', error);
        if (error.message === 'Feat not found or no changes made') {
            res.status(404).send(error.message);
        } else {
            res.status(500).send('Server error');
        }
    }
};

/**
 * Deletes a feat by its ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const deleteFeat = async (req, res) => {
    const { id } = req.params;
    try {
        await runTransactionWith(async (txTimedQuery) => {
            const { raw } = await txTimedQuery(
                'DELETE FROM feats WHERE feat_id = ?',
                [id],
                'deleteFeat'
            );
            if (raw.affectedRows === 0) {
                throw new Error('Feat not found');
            }
        });
        res.status(204).send(); // No Content
    } catch (error) {
        console.error('Error deleting feat:', error);
        if (error.message === 'Feat not found') {
            res.status(404).send(error.message);
        } else {
            res.status(500).send('Server error');
        }
    }
};
