import { timedQuery, runTransactionWith } from '../../../db/queryTimer.js';
import { buildQuery, processQuery } from '../../../db/queryBuilder.js';
import { skillFilterConfig } from '../config/skillConfig.js';

/**
 * Fetches all skills from the database with pagination and filtering.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const getSkills = async (req, res) => {
    const processedQuery = processQuery(req.query, skillFilterConfig);

    if (processedQuery.errors.length > 0) {
        return res.status(400).json({ error: processedQuery.errors.join('; ') });
    }

    const { page, limit } = processedQuery.pagination;
    try {
        const { mainQuery, queryValues } = buildQuery(skillFilterConfig, processedQuery);
        console.log('Final SQL Query:', mainQuery);
        console.log('Query Values:', queryValues);

        const { rows } = await timedQuery(
            mainQuery,
            queryValues,
            `Skills list query`
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

export const getAllSkills = async (req, res) => {
    try {
        const { rows } = await timedQuery('SELECT skill_id, skill_name FROM skills', [], 'getAllSkills');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching all skills:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Fetches a single skill by its ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const getSkillById = async (req, res) => {
    const { id } = req.params;
    try {
        const { rows: skills } = await timedQuery(
            'SELECT s.* FROM skills s WHERE skill_id = ?',
            [id],
            'getSkillById'
        );
        if (skills.length === 0) {
            return res.status(404).send('Skill not found');
        }

        res.json({
            ...skills[0],
        });
    } catch (error) {
        console.error('Error fetching skill by ID:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Creates a new skill.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const createSkill = async (req, res) => {
    const { skill_name, ability_id, trained_only, skill_armor_check_penalty, skill_description, skill_abbr, skill_check, skill_action, skill_try_again, skill_try_again_desc, skill_special, skill_synergy_desc, untrained_desc } = req.body;
    try {
        const result = await runTransactionWith(async (txTimedQuery) => {
            const { rows } = await txTimedQuery(
                'INSERT INTO skills (skill_name, ability_id, trained_only, skill_armor_check_penalty, skill_description, skill_abbr, skill_check, skill_action, skill_try_again, skill_try_again_desc, skill_special, skill_synergy_desc, untrained_desc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [skill_name, ability_id, trained_only, skill_armor_check_penalty, skill_description, skill_abbr, skill_check, skill_action, skill_try_again, skill_try_again_desc, skill_special, skill_synergy_desc, untrained_desc],
                'createSkill'
            );
            return rows.insertId;
        });
        res.status(201).json({ id: result, message: 'Skill created successfully' });
    } catch (error) {
        console.error('Error creating skill:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Updates an existing skill.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const updateSkill = async (req, res) => {
    const { id } = req.params;
    const { skill_name, ability_id, trained_only, skill_armor_check_penalty, skill_description, skill_abbr, skill_check, skill_action, skill_try_again, skill_try_again_desc, skill_special, skill_synergy_desc, untrained_desc } = req.body;
    try {
        await runTransactionWith(async (txTimedQuery) => {
            const { raw } = await txTimedQuery(
                'UPDATE skills SET skill_name = ?, ability_id = ?, trained_only = ?, skill_armor_check_penalty = ?, skill_description = ?, skill_abbr = ?, skill_check = ?, skill_action = ?, skill_try_again = ?, skill_try_again_desc = ?, skill_special = ?, skill_synergy_desc = ?, untrained_desc = ? WHERE skill_id = ?',
                [skill_name, ability_id, trained_only, skill_armor_check_penalty, skill_description, skill_abbr, skill_check, skill_action, skill_try_again, skill_try_again_desc, skill_special, skill_synergy_desc, untrained_desc, id],
                'updateSkill'
            );
            if (raw.affectedRows === 0) {
                throw new Error('Skill not found or no changes made');
            }
        });
        res.status(200).json({ message: 'Skill updated successfully' });
    } catch (error) {
        console.error('Error updating skill:', error);
        res.status(500).send('Server error');
    }
};

/**
 * Deletes a skill by its ID.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 */
export const deleteSkill = async (req, res) => {
    const { id } = req.params;
    try {
        const { raw } = await timedQuery(
            'DELETE FROM skills WHERE skill_id = ?',
            [id],
            'deleteSkill'
        );
        if (raw.affectedRows === 0) {
            return res.status(404).send('Skill not found');
        }
        res.status(200).send('Skill deleted successfully');
    } catch (error) {
        console.error('Error deleting skill:', error);
        res.status(500).send('Server error');
    }
}; 