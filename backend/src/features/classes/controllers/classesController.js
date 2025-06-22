import { timedQuery, runTransactionWith } from '../../../db/queryTimer.js';
import { processClassesQuery, buildClassesQuery } from '../lib/classQueryBuilder.js';

/**
 * Fetches all classes from the database with pagination and filtering.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const getClasses = async (req, res) => {
    const processedQuery = processClassesQuery(req.query);

    if (processedQuery.errors.length > 0) {
        return res.status(400).json({ error: processedQuery.errors.join('; ') });
    }

    const { page, limit } = processedQuery.pagination;
    try {
        const { mainQuery, queryValues } = buildClassesQuery(processedQuery);
        console.log('Final SQL Query:', mainQuery);
        console.log('Query Values:', queryValues);

        const { rows } = await timedQuery(
            mainQuery,
            queryValues,
            `Classes list query`
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

export const getAllClasses = async (req, res) => {
    try {
        const { rows } = await timedQuery('SELECT class_id, class_name FROM classes', [], 'getAllClasses');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching all classes:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Fetches a single class by its ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const getClassById = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows: classes } = await timedQuery(
            'SELECT c.* FROM classes c WHERE class_id = ?',
            [id],
            'getClassById'
        );
        if (classes.length === 0) {
            return res.status(404).send('Class not found');
        }

        res.json({
            ...classes[0],
        });
    } catch (error) {
        console.error('Error fetching class by ID:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Creates a new class.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const createClass = async (req, res) => {
    const { class_name, class_abbr, edition_id, is_prestige_class, display, caster, hit_die } = req.body;
    try {
        const result = await runTransactionWith(async (txTimedQuery) => {
            const { rows } = await txTimedQuery(
                'INSERT INTO classes (class_name, class_abbr, edition_id, is_prestige_class, display, caster, hit_die) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [class_name, class_abbr, edition_id, is_prestige_class, display, caster, hit_die],
                'createClass'
            );
            return rows.insertId;
        });
        res.status(201).json({ id: result, message: 'Class created successfully' });
    } catch (error) {
        console.error('Error creating class:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Updates an existing class.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const updateClass = async (req, res) => {
    const { id } = req.params;
    const { class_name, class_abbr, edition_id, is_prestige_class, display, caster, hit_die } = req.body;
    try {
        await runTransactionWith(async (txTimedQuery) => {
            const { raw } = await txTimedQuery(
                'UPDATE classes SET class_name = ?, class_abbr = ?, edition_id = ?, is_prestige_class = ?, display = ?, caster = ?, hit_die = ? WHERE class_id = ?',
                [class_name, class_abbr, edition_id, is_prestige_class, display, caster, hit_die, id],
                'updateClass'
            );
            if (raw.affectedRows === 0) {
                throw new Error('Class not found or no changes made');
            }
        });
        res.status(200).json({ message: 'Class updated successfully' });
    } catch (error) {
        console.error('Error updating class:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Deletes a class by its ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const deleteClass = async (req, res) => {
    const { id } = req.params;
    try {
        const { raw } = await timedQuery(
            'DELETE FROM classes WHERE class_id = ?',
            [id],
            'deleteClass'
        );
        if (raw.affectedRows === 0) {
            return res.status(404).send('Class not found');
        }
        res.status(200).send('Class deleted successfully');
    } catch (error) {
        console.error('Error deleting class:', error);
        res.status(500).send('Server error');
    }
}; 