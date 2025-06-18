import schoolCache from '../../../db/caches/schoolCache.js';
import { timedQuery } from '../../../db/queryTimer.js';

export async function getSpells(req, res) {
    // Only allow these query params
    const allowedParams = [
        'page', 'limit', 'sort', 'order', 'name', 'classId', 'spell_level', 'school', 'descriptors', 'edition_id', 'source', 'components',
        'classId_logic', 'descriptors_logic' // Add new logic parameters
    ];
    const invalidParams = Object.keys(req.query).filter(
        key => !allowedParams.includes(key) && !key.endsWith('_logic') // Allow any _logic param if base param is allowed
    );
    if (invalidParams.length > 0) {
        return res.status(400).json({
            error: `Invalid query parameter(s): ${invalidParams.join(', ')}. Allowed: ${allowedParams.join(', ')}`
        });
    }

    const {
        page = 1,
        limit = 20,
        sort = 'spell_name',
        order = 'asc',
        name = '',
        classId: classIdParam = '', // Rename to avoid conflict with parsed array
        spell_level = '',
        school = '',
        descriptors: descriptorsParam = '', // Rename to avoid conflict with parsed array
        source = '',
        components = '',
        edition_id = null, // Default to null
        classId_logic = 'or', // Default to 'or'
        descriptors_logic = 'or', // Default to 'or'
    } = req.query;
    const offset = (page - 1) * limit;
    const allowedSorts = ['spell_name', 'spell_level', 'school', 'classId', 'spell_summary'];
    let sortBy = allowedSorts.includes(sort) ? sort : 'spell_name';
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

    // Parse classId into an array of numbers
    const classIds = classIdParam ? (Array.isArray(classIdParam) ? classIdParam : classIdParam.split(',')).map(Number).filter(id => !isNaN(id)) : [];
    // Parse descriptors into an array of numbers (assuming frontend sends IDs now)
    const descriptorIds = descriptorsParam ? (Array.isArray(descriptorsParam) ? descriptorsParam : descriptorsParam.split(',')).map(Number).filter(id => !isNaN(id)) : [];

    let whereClauses = [];
    let havingClauses = [];
    let whereValues = [];
    let havingValues = [];
    let baseQuery = '';
    let joinClause = '';

    // Determine if we should use spell_level_map as the base table (based on presence of classId filter)
    const useLevelMap = classIds.length > 0;

    if (useLevelMap) {
        baseQuery = `FROM spell_level_map slm JOIN spells sp ON slm.spell_id = sp.spell_id`;

        joinClause = `
            LEFT JOIN spell_school_map ssm ON sp.spell_id = ssm.spell_id
            LEFT JOIN spell_descriptor_map sdm ON sp.spell_id = sdm.spell_id
            LEFT JOIN spell_component_map scm ON sp.spell_id = scm.spell_id
            LEFT JOIN spell_ranges sr ON sp.spell_range_id = sr.range_id
            LEFT JOIN spell_source_map ssm_src ON sp.spell_id = ssm_src.spell_id and ssm_src.display = 1
        `;


        if (classIds.length > 0) {
            if (classId_logic === 'and') {
                // For AND logic, we need to ensure the spell has ALL selected class IDs.
                // We filter by IN initially and then use HAVING to ensure all distinct selected class IDs are present.
                whereClauses.push(`slm.class_id IN (?)`);
                whereValues.push(classIds.join(','));
                havingClauses.push(`COUNT(DISTINCT slm.class_id) = ?`);
                havingValues.push(classIds.length);
            } else { // 'or' logic (default)
                whereClauses.push(`slm.class_id IN (?)`);
                whereValues.push(classIds.join(','));
            }
        } else if (Array.isArray(classIdParam) && classIdParam.length > 0) {
            // If classId was an array but all values were invalid
            return res.status(400).json({ error: `Invalid class ID(s): ${classIdParam.join(', ')}` });
        }

        if (spell_level) {
            whereClauses.push(`slm.spell_level = ?`);
            whereValues.push(parseInt(spell_level));
        }
        if (sortBy === 'spell_level') {
            sortBy = 'slm.spell_level';
        }
    } else {
        baseQuery = `FROM spells sp`;

        joinClause = `
            LEFT JOIN spell_school_map ssm ON sp.spell_id = ssm.spell_id
            LEFT JOIN spell_descriptor_map sdm ON sp.spell_id = sdm.spell_id
            LEFT JOIN spell_component_map scm ON sp.spell_id = scm.spell_id
            LEFT JOIN spell_ranges sr ON sp.spell_range_id = sr.range_id
            LEFT JOIN spell_source_map ssm_src ON sp.spell_id = ssm_src.spell_id and ssm_src.display = 1
            LEFT JOIN spell_level_map slm ON sp.spell_id = slm.spell_id and slm.display = 1
        `;

        if (spell_level) {
            whereClauses.push(`sp.spell_level = ?`);
            whereValues.push(parseInt(spell_level));
        }
        if (sortBy === 'spell_level') {
            sortBy = 'sp.spell_level';
        }
    }

    // Edition filtering using the new spells.edition_id column
    if (edition_id !== null) {
        if (parseInt(edition_id, 10) === 4) { // 4 is the edition_id for 3E, which means combined 3E/3.5E
            whereClauses.push(`sp.edition_id IN (?, ?)`);
            whereValues.push(4, 5);
        } else {
            whereClauses.push(`sp.edition_id = ?`);
            whereValues.push(parseInt(edition_id, 10));
        }
    }

    // Add common filters (always relative to 'sp' alias which is present in all base queries)
    if (name) {
        whereClauses.push(`(sp.spell_name LIKE ?)`);
        whereValues.push(`%${name}%`);
    }

    if (school) {
        const schoolId = schoolCache.getID(school);
        if (schoolId) {
            whereClauses.push(`EXISTS (
                SELECT 1 FROM spell_school_map ssm_filter 
                WHERE ssm_filter.spell_id = sp.spell_id 
                AND ssm_filter.school_id = ?
            )`);
            whereValues.push(schoolId);
        } else {
            return res.status(404).json({
                error: `School not found: ${school}`
            });
        }
    }

    if (descriptorsParam) { // Use descriptorsParam to check if the filter was provided
        if (descriptorIds.length > 0) {
            if (descriptors_logic === 'and') {
                whereClauses.push(`EXISTS (
                    SELECT 1 FROM spell_descriptor_map sdm_filter 
                    WHERE sdm_filter.spell_id = sp.spell_id 
                    AND sdm_filter.desc_id IN (?) 
                    GROUP BY sdm_filter.spell_id 
                    HAVING COUNT(DISTINCT sdm_filter.desc_id) = ?
                )`);
                whereValues.push(descriptorIds.join(','));
                havingValues.push(descriptorIds.length);
            } else { // 'or' logic (default)
                whereClauses.push(`EXISTS (
                    SELECT 1 FROM spell_descriptor_map sdm_filter 
                    WHERE sdm_filter.spell_id = sp.spell_id 
                    AND sdm_filter.desc_id IN (?) 
                )`);
                whereValues.push(descriptorIds.join(','));
            }
        } else if (descriptorIds.length === 0 && descriptorsParam.length > 0) { // If names were provided but no valid IDs found
            return res.status(404).json({
                error: `Descriptor(s) not found: ${descriptorsParam.split(',').filter(s => s.trim().length > 0).join(', ')}` // Use original param for error message
            });
        }
    }

    if (components) {
        const componentId = parseInt(components);
        if (!isNaN(componentId)) {
            whereClauses.push(`EXISTS (
                SELECT 1 FROM spell_component_map scm_filter 
                WHERE scm_filter.spell_id = sp.spell_id 
                AND scm_filter.comp_id = ?
            )`);
            whereValues.push(componentId);
        } else {
            return res.status(400).json({
                error: `Invalid component ID: ${components}`
            });
        }
    }

    if (source) {
        whereClauses.push(`EXISTS (
            SELECT 1 FROM spell_source_map ssm_source_filter
            WHERE ssm_source_filter.spell_id = sp.spell_id
            AND ssm_source_filter.display = 1
            AND ssm_source_filter.book_id = ?
        )`);
        whereValues.push(parseInt(source));
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const having = havingClauses.length > 0 ? `HAVING ${havingClauses.join(' AND ')}` : '';

    if (sortBy === 'classId') {
        sortBy = 'slm.class_id';
    }
    if (sortBy === 'spell_name') {
        sortBy = 'sp.spell_name';
    }

    try {
        // Build the main data query
        const mainQuery = `
            SELECT 
                sp.*,
                ${useLevelMap ? 'slm.spell_level as spell_level' : 'sp.spell_level as spell_level'},
                GROUP_CONCAT(DISTINCT ssm.school_id) as school_ids,
                GROUP_CONCAT(DISTINCT sdm.desc_id) as descriptor_ids,
                GROUP_CONCAT(DISTINCT scm.comp_id) as component_ids,
                GROUP_CONCAT(DISTINCT CONCAT(ssm_src.book_id, ':', ssm_src.page_number)) as source_info,
                GROUP_CONCAT(DISTINCT CONCAT(slm.class_id, ':', slm.spell_level)) as class_info,
                COUNT(*) OVER() as total_count
            ${baseQuery}
            ${joinClause}
            ${where}
            GROUP BY sp.spell_id
            ${having}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?`;

        console.log('Final SQL Query:', mainQuery);
        console.log('Query Values:', [...whereValues, ...havingValues, parseInt(limit), parseInt(offset)]);

        const { rows } = await timedQuery(
            mainQuery,
            [...whereValues, ...havingValues, parseInt(limit), parseInt(offset)],
            `Spells list query (${useLevelMap ? 'using level map' : 'using spells table'})`
        );

        // Get total count from the first row (all rows will have the same count)
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
}

export async function getSpellById(req, res) {
    const spellId = parseInt(req.params.id);
    if (isNaN(spellId)) {
        return res.status(400).json({ error: 'Invalid spell ID' });
    }

    try {
        // Get basic spell information
        const { rows: spell } = await timedQuery(
            `SELECT * FROM spells WHERE spell_id = ?`,
            [spellId],
            'Get spell details'
        );

        if (!spell.length) {
            return res.status(404).json({ error: `Spell not found: ${spellId}` });
        }

        // Get spell schools and subschools
        const { rows: schoolMappings } = await timedQuery(
            `SELECT ssm.school_id, ssubm.sub_id
            FROM spell_school_map ssm
            LEFT JOIN spell_subschool_map ssubm ON ssm.spell_id = ssubm.spell_id
            WHERE ssm.spell_id = ?`,
            [spellId],
            'Get spell schools'
        );

        // Get spell components
        const { rows: componentIds } = await timedQuery(
            `SELECT comp_id FROM spell_component_map WHERE spell_id = ?`,
            [spellId],
            'Get spell components'
        );

        // Get spell descriptors
        const { rows: descriptorIds } = await timedQuery(
            `SELECT desc_id FROM spell_descriptor_map WHERE spell_id = ?`,
            [spellId],
            'Get spell descriptors'
        );

        // Get class levels
        const { rows: classLevels } = await timedQuery(
            `SELECT class_id, spell_level
            FROM spell_level_map
            WHERE spell_id = ? and display = 1
            ORDER BY class_id`,
            [spellId],
            'Get spell class levels'
        );

        // Get source information
        const { rows: sources } = await timedQuery(
            `SELECT ssm.book_id, ssm.page_number
            FROM spell_source_map ssm
            WHERE ssm.spell_id = ? and ssm.display = 1`,
            [spellId],
            'Get spell sources'
        );

        res.json({
            ...spell[0],
            schools: schoolMappings.map(m => m.school_id),
            subschools: schoolMappings.map(m => m.sub_id).filter(Boolean),
            components: componentIds.map(c => c.comp_id),
            descriptors: descriptorIds.map(d => d.desc_id),
            class_levels: classLevels,
            sources: sources
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function updateSpell(req, res) {
    const spellId = parseInt(req.params.id);
    const { spell_summary, spell_description, cast_time, spell_range, spell_range_id, spell_range_value, spell_area, spell_duration, spell_save, spell_resistance, spell_effect, spell_target, edition_id, schools, subschools, descriptors, components } = req.body;

    if (isNaN(spellId)) {
        return res.status(400).json({ error: 'Invalid spell ID' });
    }

    try {
        const updateFields = [];
        const updateValues = [];

        if (spell_summary !== undefined) { updateFields.push('spell_summary = ?'); updateValues.push(spell_summary); }
        if (spell_description !== undefined) { updateFields.push('spell_description = ?'); updateValues.push(spell_description); }
        if (cast_time !== undefined) { updateFields.push('cast_time = ?'); updateValues.push(cast_time); }
        if (spell_range !== undefined) { updateFields.push('spell_range = ?'); updateValues.push(spell_range); }
        if (spell_range_id !== undefined) { updateFields.push('spell_range_id = ?'); updateValues.push(spell_range_id); }
        if (spell_range_value !== undefined) { updateFields.push('spell_range_value = ?'); updateValues.push(spell_range_value); }
        if (spell_area !== undefined) { updateFields.push('spell_area = ?'); updateValues.push(spell_area); }
        if (spell_duration !== undefined) { updateFields.push('spell_duration = ?'); updateValues.push(spell_duration); }
        if (spell_save !== undefined) { updateFields.push('spell_save = ?'); updateValues.push(spell_save); }
        if (spell_resistance !== undefined) { updateFields.push('spell_resistance = ?'); updateValues.push(spell_resistance); }
        if (spell_effect !== undefined) { updateFields.push('spell_effect = ?'); updateValues.push(spell_effect); }
        if (spell_target !== undefined) { updateFields.push('spell_target = ?'); updateValues.push(spell_target); }
        if (edition_id !== undefined) { updateFields.push('edition_id = ?'); updateValues.push(edition_id); }

        if (updateFields.length > 0) {
            const updateQuery = `UPDATE spells SET ${updateFields.join(', ')} WHERE spell_id = ?`;
            const updResult = await timedQuery(updateQuery, [...updateValues, spellId], 'Update spell');
        }

        // Handle spell schools
        const del_school_result = await timedQuery('DELETE FROM spell_school_map WHERE spell_id = ?', [spellId], 'Delete existing spell schools');
        if (schools && schools.length > 0) {
            const schoolInserts = schools.map(school_id => [spellId, school_id]);
            const { raw: result } = await timedQuery('INSERT INTO spell_school_map (spell_id, school_id) VALUES ?', [schoolInserts], 'Insert new spell schools');
        }

        // Handle spell subschools
        const del_subschool_result = await timedQuery('DELETE FROM spell_subschool_map WHERE spell_id = ?', [spellId], 'Delete existing spell subschools');
        if (subschools && subschools.length > 0) {
            const subschoolInserts = subschools.map(sub_id => [spellId, sub_id]);
            const { raw: result } = await timedQuery('INSERT INTO spell_subschool_map (spell_id, sub_id) VALUES ?', [subschoolInserts], 'Insert new spell subschools');
        }

        // Handle spell descriptors
        const del_descriptor_result = await timedQuery('DELETE FROM spell_descriptor_map WHERE spell_id = ?', [spellId], 'Delete existing spell descriptors');
        if (descriptors && descriptors.length > 0) {
            const descriptorInserts = descriptors.map(desc_id => [spellId, desc_id]);
            const { raw: result } = await timedQuery('INSERT INTO spell_descriptor_map (spell_id, desc_id) VALUES ?', [descriptorInserts], 'Insert new spell descriptors');
        }

        // Handle spell components
        const del_component_result = await timedQuery('DELETE FROM spell_component_map WHERE spell_id = ?', [spellId], 'Delete existing spell components');
        if (components && components.length > 0) {
            const componentInserts = components.map(comp_id => [spellId, comp_id]);
            const ins_component_result = await timedQuery('INSERT INTO spell_component_map (spell_id, comp_id) VALUES ?', [componentInserts], 'Insert new spell components');
        }

        res.json({ message: 'Spell updated successfully' });
    } catch (err) {
        console.error('Update spell error:', err);
        res.status(500).send('Server error');
    }
} 