import { timedQuery } from '../../../db/queryTimer.js';
import alignmentCache from '../../../db/caches/alignmentCache.js'; // To be created
import raceCache from '../../../db/caches/raceCache.js'; // To be created

// Helper function to validate character data
function validateCharacterData(character) {
    const { character_name, user_id } = character;
    if (!character_name || character_name.trim() === '') {
        return 'Character name cannot be empty.';
    }
    if (!user_id) {
        return 'User ID is required.';
    }
    // Add more validation rules as needed
    return null; // No error
}

export async function getAllCharacters(req, res) {
    const { page = 1, limit = 20, sort = 'character_name', order = 'asc', name = '', user_id = null } = req.query;
    const offset = (page - 1) * limit;

    const allowedSorts = ['character_name', 'created_at', 'character_age'];
    const sortBy = allowedSorts.includes(sort) ? sort : 'character_name';
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

    let whereClauses = [];
    let whereValues = [];

    if (name) {
        whereClauses.push(`character_name LIKE ?`);
        whereValues.push(`%${name}%`);
    }

    if (user_id) {
        whereClauses.push(`user_id = ?`);
        whereValues.push(parseInt(user_id));
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    try {
        const query = `
            SELECT 
                uc.*,
                r.race_name,
                a.alignment_name,
                COUNT(*) OVER() as total_count
            FROM user_characters uc
            LEFT JOIN races r ON uc.race_id = r.race_id
            LEFT JOIN alignments a ON uc.alignment_id = a.alignment_id
            ${where}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?;
        `;

        const { rows } = await timedQuery(
            query,
            [...whereValues, parseInt(limit), parseInt(offset)],
            'Get all characters'
        );

        const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

        res.json({
            page: Number(page),
            limit: Number(limit),
            total: total,
            results: rows,
        });

    } catch (error) {
        console.error('Error getting all characters:', error);
        res.status(500).send('Server error');
    }
}

export async function getCharacterById(req, res) {
    const { id } = req.params;
    try {
        const query = `
            SELECT 
                uc.*,
                r.race_name,
                a.alignment_name
            FROM user_characters uc
            LEFT JOIN races r ON uc.race_id = r.race_id
            LEFT JOIN alignments a ON uc.alignment_id = a.alignment_id
            WHERE character_id = ?;
        `;
        const { rows: character } = await timedQuery(query, [id], 'Get character by ID');

        if (!character.length) {
            return res.status(404).send('Character not found');
        }
        res.json(character);
    } catch (error) {
        console.error('Error getting character by ID:', error);
        res.status(500).send('Server error');
    }
}

export async function createCharacter(req, res) {
    const newCharacter = req.body;

    const validationError = validateCharacterData(newCharacter);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        const query = `
            INSERT INTO user_characters (
                user_id, character_name, race_id, alignment_id, character_age, 
                character_height, character_weight, character_eyes, character_hair, 
                character_str, character_dex, character_con, character_int, 
                character_wis, character_cha
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        const { raw: result } = await timedQuery(
            query,
            [
                newCharacter.user_id,
                newCharacter.character_name,
                newCharacter.race_id || null,
                newCharacter.alignment_id || null,
                newCharacter.character_age || null,
                newCharacter.character_height || null,
                newCharacter.character_weight || null,
                newCharacter.character_eyes || null,
                newCharacter.character_hair || null,
                newCharacter.character_str || null,
                newCharacter.character_dex || null,
                newCharacter.character_con || null,
                newCharacter.character_int || null,
                newCharacter.character_wis || null,
                newCharacter.character_cha || null,
            ],
            'Create new character'
        );

        res.status(201).json({ id: result.insertId, message: 'Character created successfully' });
    } catch (error) {
        console.error('Error creating character:', error);
        res.status(500).send('Server error');
    }
}

export async function updateCharacter(req, res) {
    const { id } = req.params;
    const updatedCharacter = req.body;

    const validationError = validateCharacterData(updatedCharacter);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    try {
        const query = `
            UPDATE user_characters SET
                character_name = ?,
                race_id = ?,
                alignment_id = ?,
                character_age = ?,
                character_height = ?,
                character_weight = ?,
                character_eyes = ?,
                character_hair = ?,
                character_str = ?,
                character_dex = ?,
                character_con = ?,
                character_int = ?,
                character_wis = ?,
                character_cha = ?
            WHERE character_id = ?;
        `;
        const { raw: result } = await timedQuery(
            query,
            [
                updatedCharacter.character_name,
                updatedCharacter.race_id || null,
                updatedCharacter.alignment_id || null,
                updatedCharacter.character_age || null,
                updatedCharacter.character_height || null,
                updatedCharacter.character_weight || null,
                updatedCharacter.character_eyes || null,
                updatedCharacter.character_hair || null,
                updatedCharacter.character_str || null,
                updatedCharacter.character_dex || null,
                updatedCharacter.character_con || null,
                updatedCharacter.character_int || null,
                updatedCharacter.character_wis || null,
                updatedCharacter.character_cha || null,
                id,
            ],
            'Update character'
        );

        if (result.affectedRows === 0) {
            return res.status(404).send('Character not found or no changes made');
        }
        res.status(200).json({ message: 'Character updated successfully' });
    } catch (error) {
        console.error('Error updating character:', error);
        res.status(500).send('Server error');
    }
}

export async function deleteCharacter(req, res) {
    const { id } = req.params;
    try {
        const query = `DELETE FROM user_characters WHERE character_id = ?;`;
        const { raw: result } = await timedQuery(query, [id], 'Delete character');

        if (result.affectedRows === 0) {
            return res.status(404).send('Character not found');
        }
        res.status(200).json({ message: 'Character deleted successfully' });
    } catch (error) {
        console.error('Error deleting character:', error);
        res.status(500).send('Server error');
    }
}
