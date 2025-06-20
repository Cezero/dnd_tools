import { createFilterProcessor, buildWhereAndHavingClauses } from '../../../db/queryBuilder.js';
import { spellFilterConfig } from '../config/spellConfig.js';

export const processSpellsQuery = createFilterProcessor(spellFilterConfig);

export function buildSpellsQuery(processedQuery) {
    const { filters, pagination, sort, useAlternateBaseTable } = processedQuery;

    let baseQuery = '';
    let joinClause = '';

    if (useAlternateBaseTable) {
        baseQuery = 'FROM spell_level_map slm JOIN spells sp ON slm.spell_id = sp.spell_id';
        joinClause = `
            LEFT JOIN spell_school_map ssm ON sp.spell_id = ssm.spell_id
            LEFT JOIN spell_descriptor_map sdm ON sp.spell_id = sdm.spell_id
            LEFT JOIN spell_component_map scm ON sp.spell_id = scm.spell_id
            LEFT JOIN spell_source_map ssm_src ON sp.spell_id = ssm_src.spell_id and ssm_src.display = 1
        `;
    } else {
        baseQuery = 'FROM spells sp';
        joinClause = `
            LEFT JOIN spell_school_map ssm ON sp.spell_id = ssm.spell_id
            LEFT JOIN spell_descriptor_map sdm ON sp.spell_id = sdm.spell_id
            LEFT JOIN spell_component_map scm ON sp.spell_id = scm.spell_id
            LEFT JOIN spell_source_map ssm_src ON sp.spell_id = ssm_src.spell_id and ssm_src.display = 1
            LEFT JOIN spell_level_map slm ON sp.spell_id = slm.spell_id and slm.display = 1
        `;
    }

    const { where, having, whereValues, havingValues } = buildWhereAndHavingClauses(filters, spellFilterConfig);

    let sortBy = sort.sortBy;
    if (sortBy === 'spell_level') {
        sortBy = useAlternateBaseTable ? 'slm.spell_level' : 'sp.spell_level';
    } else if (sortBy === 'classId') {
        sortBy = 'slm.class_id';
    } else if (sortBy === 'spell_name') {
        sortBy = 'sp.spell_name';
    }

    const sortOrder = sort.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const mainQuery = `
        SELECT 
            sp.*,
            ${useAlternateBaseTable ? 'MIN(slm.spell_level) as spell_level' : 'sp.spell_level as spell_level'},
            GROUP_CONCAT(DISTINCT ssm.school_id) as school_ids,
            GROUP_CONCAT(DISTINCT sdm.desc_id) as desc_ids,
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

    const queryValues = [...whereValues, ...havingValues, pagination.limit, pagination.offset || ((pagination.page - 1) * pagination.limit)];

    return { mainQuery, queryValues };
} 