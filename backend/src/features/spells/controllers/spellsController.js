import { timedQuery } from '../../../db/queryTimer.js';
import { spellFilterConfig } from '../config/spellConfig.js';
import { processQuery, buildQuery } from '../../../db/queryBuilder.js';

export async function getSpells(req, res) {
    const processed = processQuery(req.query, spellFilterConfig);

    if (processed.errors.length > 0) {
        return res.status(400).json({ error: processed.errors.join('; ') });
    }

    const { page, limit } = processed.pagination;

    try {
        const { mainQuery, queryValues } = buildQuery(spellFilterConfig, processed);

        console.log('Final SQL Query:', mainQuery);
        console.log('Query Values:', queryValues);

        const { rows } = await timedQuery(
            mainQuery,
            queryValues,
            `Spells list query (${processed.useAlternateBaseTable ? 'using level map' : 'using spells table'})`
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

export async function resolve(spellNames) {
    const placeholders = spellNames.map(() => '?').join(', ');
    const { rows } = await timedQuery(
        `SELECT spell_id, spell_name FROM spells WHERE spell_name IN (${placeholders})`,
        spellNames,
        `Resolve spells: ${spellNames.join(', ')}`
    );
    const resolvedSpells = {};
    for (const row of rows) {
        resolvedSpells[row.spell_name.toLowerCase()] = row.spell_id;
    }
    return resolvedSpells;
} 