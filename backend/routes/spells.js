import express from 'express';
import classCache from '../db/classCache.js';
import componentCache from '../db/componentCache.js';
import descriptorCache from '../db/descriptorCache.js';
import rangeCache from '../db/rangeCache.js';
import schoolCache from '../db/schoolCache.js';
import { timedQuery } from '../db/queryTimer.js';

const router = express.Router();

router.get('/', async (req, res) => {
    // Only allow these query params
    const allowedParams = [
        'page', 'limit', 'sort', 'order', 'name', 'class', 'level', 'school', 'descriptor'
    ];
    const invalidParams = Object.keys(req.query).filter(
        key => !allowedParams.includes(key)
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
        class: className = '',
        level = '',
        school = '',
        descriptor = '',
    } = req.query;
    const offset = (page - 1) * limit;
    const allowedSorts = ['spell_name', 'spell_level', 'school'];
    const sortBy = allowedSorts.includes(sort) ? sort : 'spell_name';
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

    let whereClauses = [];
    let havingClauses = [];
    let values = [];
    let baseQuery = '';
    let joinClause = '';

    // Check if we should use spell_level_map as the base table
    const useLevelMap = className || level;

    if (useLevelMap) {
        baseQuery = `FROM spell_level_map slm`;
        joinClause = `JOIN spells sp ON slm.spell_id = sp.spell_id`;

        if (className) {
            const classInfo = classCache.getClass(className);
            if (classInfo) {
                whereClauses.push(`slm.class_id = ?`);
                values.push(classInfo.class_id);
            } else {
                return res.json({
                    page,
                    limit,
                    total: 0,
                    results: []
                });
            }
        }

        if (level) {
            whereClauses.push(`slm.spell_level = ?`);
            values.push(parseInt(level));
        }
    } else {
        baseQuery = `FROM spells sp`;
    }

    // Add common filters
    if (name) {
        whereClauses.push(`spell_name LIKE ?`);
        values.push(`%${name}%`);
    }

    if (school) {
        const schoolInfo = schoolCache.getSchool(school);
        if (schoolInfo) {
            whereClauses.push(`EXISTS (
                SELECT 1 FROM spell_school_map ssm 
                WHERE ssm.spell_id = sp.spell_id 
                AND ssm.school_id = ?
            )`);
            values.push(schoolInfo.school_id);
        } else {
            return res.json({
                page,
                limit,
                total: 0,
                results: []
            });
        }
    }

    if (descriptor) {
        const descriptorInfo = descriptorCache.getDescriptor(descriptor);
        if (descriptorInfo) {
            whereClauses.push(`EXISTS (
                SELECT 1 FROM spell_descriptor_map sdm 
                WHERE sdm.spell_id = sp.spell_id 
                AND sdm.desc_id = ?
            )`);
            values.push(descriptorInfo.desc_id);
        } else {
            return res.json({
                page,
                limit,
                total: 0,
                results: []
            });
        }
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const having = havingClauses.length > 0 ? `HAVING ${havingClauses.join(' AND ')}` : '';

    try {
        const mainQuery = `
            SELECT 
                sp.*,
                ${useLevelMap ? 'slm.spell_level as spell_level' : 'MIN(sl.spell_level) as spell_level'},
                GROUP_CONCAT(DISTINCT ssm.school_id) as school_ids,
                GROUP_CONCAT(DISTINCT sdm.desc_id) as descriptor_ids,
                COUNT(*) OVER() as total_count
            ${baseQuery}
            ${joinClause}
            LEFT JOIN spell_level_map sl ON sp.spell_id = sl.spell_id
            LEFT JOIN spell_school_map ssm ON sp.spell_id = ssm.spell_id
            LEFT JOIN spell_descriptor_map sdm ON sp.spell_id = sdm.spell_id
            LEFT JOIN spell_ranges sr ON sp.spell_range_id = sr.range_id
            ${where}
            GROUP BY sp.spell_id
            ${having}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?`;

        console.log('Final SQL Query:', mainQuery);
        console.log('Query Values:', [...values, parseInt(limit), parseInt(offset)]);

        const [[rows], mainQueryTime] = await timedQuery(
            mainQuery,
            [...values, parseInt(limit), parseInt(offset)],
            `Spells list query (${useLevelMap ? 'using level map' : 'using spells table'})`
        );

        // Get total count from the first row (all rows will have the same count)
        const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

        // Map IDs to names using caches
        const cacheStart = performance.now();
        const results = rows.map(row => ({
            ...row,
            schools: row.school_ids ? row.school_ids.split(',').map(id => {
                const school = schoolCache.getSchool(parseInt(id));
                return school ? school.school_name : null;
            }).filter(Boolean) : [],
            descriptors: row.descriptor_ids ? row.descriptor_ids.split(',').map(id => {
                const descriptor = descriptorCache.getDescriptor(parseInt(id));
                return descriptor ? descriptor.descriptor : null;
            }).filter(Boolean) : [],
            range: row.spell_range_id ? rangeCache.getRange(row.spell_range_id) : null
        }));
        const cacheTime = performance.now() - cacheStart;
        console.log(`[QueryTimer] Cache mapping took ${cacheTime.toFixed(2)}ms`);

        res.json({
            page: Number(page),
            limit: Number(limit),
            total: total,
            results,
            _debug: {
                mainQueryTime,
                cacheTime,
                totalTime: mainQueryTime + cacheTime
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

router.get('/:id', async (req, res) => {
    const spellId = parseInt(req.params.id);
    if (isNaN(spellId)) {
        return res.status(400).json({ error: 'Invalid spell ID' });
    }

    try {
        // Get basic spell information
        const [[spell], spellQueryTime] = await timedQuery(
            pool,
            `SELECT * FROM spells WHERE spell_id = ?`,
            [spellId],
            'Get spell details'
        );

        if (!spell) {
            return res.status(404).json({ error: 'Spell not found' });
        }

        // Get spell schools and subschools
        const [schoolMappings, schoolQueryTime] = await timedQuery(
            pool,
            `SELECT ssm.school_id, ssubm.sub_id
            FROM spell_school_map ssm
            LEFT JOIN spell_subschool_map ssubm ON ssm.spell_id = ssubm.spell_id
            WHERE ssm.spell_id = ?`,
            [spellId],
            'Get spell schools'
        );

        // Get spell components
        const [componentIds, componentQueryTime] = await timedQuery(
            pool,
            `SELECT comp_id FROM spell_component_map WHERE spell_id = ?`,
            [spellId],
            'Get spell components'
        );

        // Get spell descriptors
        const [descriptorIds, descriptorQueryTime] = await timedQuery(
            pool,
            `SELECT desc_id FROM spell_descriptor_map WHERE spell_id = ?`,
            [spellId],
            'Get spell descriptors'
        );

        // Get class levels using classCache
        const [classLevels, classQueryTime] = await timedQuery(
            pool,
            `SELECT class_id, spell_level
            FROM spell_level_map
            WHERE spell_id = ?
            ORDER BY class_id`,
            [spellId],
            'Get spell class levels'
        );

        // Get source information
        const [sources, sourceQueryTime] = await timedQuery(
            pool,
            `SELECT sb.title, ssm.page_number
            FROM spell_source_map ssm
            JOIN source_books sb ON ssm.book_id = sb.book_id
            WHERE ssm.spell_id = ?`,
            [spellId],
            'Get spell sources'
        );

        // Map data using caches
        const cacheStart = performance.now();

        // Map schools and subschools using cache
        const schools = schoolMappings.map(mapping => {
            const school = schoolCache.getSchool(mapping.school_id);
            const subschool = mapping.sub_id ? schoolCache.getSubschool(mapping.school_id, mapping.sub_id) : null;
            return {
                name: school ? school.school_name : 'Unknown School',
                subschool: subschool ? subschool.subschool : null
            };
        });

        // Map components using cache
        const components = componentIds.map(c => {
            const component = componentCache.getComponent(c.comp_id);
            return component ? component.comp_name : null;
        }).filter(Boolean);

        // Map descriptors using cache
        const descriptors = descriptorIds.map(d => {
            const descriptor = descriptorCache.getDescriptor(d.desc_id);
            return descriptor ? descriptor.descriptor : null;
        }).filter(Boolean);

        // Map class IDs to class names using classCache
        const mappedClassLevels = classLevels.map(cl => {
            const classInfo = classCache.getClass(cl.class_id);
            return {
                class_name: classInfo ? classInfo.class_name : 'Unknown Class',
                spell_level: cl.spell_level
            };
        });

        const cacheTime = performance.now() - cacheStart;
        console.log(`[QueryTimer] Cache mapping took ${cacheTime.toFixed(2)}ms`);

        res.json({
            ...spell,
            schools,
            components,
            descriptors,
            class_levels: mappedClassLevels,
            sources,
            _debug: {
                spellQueryTime,
                schoolQueryTime,
                componentQueryTime,
                descriptorQueryTime,
                classQueryTime,
                sourceQueryTime,
                cacheTime,
                totalTime: spellQueryTime + schoolQueryTime + componentQueryTime +
                    descriptorQueryTime + classQueryTime + sourceQueryTime + cacheTime
            }
        });
    } catch (err) {
        console.error('Error fetching spell by ID:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

export default router;
