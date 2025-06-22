import { createFilterProcessor, buildWhereAndHavingClauses } from '../../../db/queryBuilder.js';
import { classFilterConfig } from '../config/classConfig.js';

export const processClassesQuery = createFilterProcessor(classFilterConfig);

export function buildClassesQuery(processedQuery) {
    const { filters, pagination, sort } = processedQuery;

    const baseQuery = 'FROM classes c';
    const joinClause = '';

    const { where, having, whereValues, havingValues } = buildWhereAndHavingClauses(filters, classFilterConfig);

    let sortBy = sort.sortBy;
    if (sortBy === 'class_name') {
        sortBy = 'c.class_name';
    } else if (sortBy === 'class_abbr') {
        sortBy = 'c.class_abbr';
    } else if (sortBy === 'edition_id') {
        sortBy = 'c.edition_id';
    } else if (sortBy === 'is_prestige_class') {
        sortBy = 'c.is_prestige_class';
    } else if (sortBy === 'display') {
        sortBy = 'c.display';
    } else if (sortBy === 'caster') {
        sortBy = 'c.caster';
    } else if (sortBy === 'hit_die') {
        sortBy = 'c.hit_die';
    }

    const sortOrder = sort.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const mainQuery = `
        SELECT 
            c.*,
            COUNT(*) OVER() as total_count
        ${baseQuery}
        ${joinClause}
        ${where}
        GROUP BY c.class_id
        ${having}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?`;

    const queryValues = [...whereValues, ...havingValues, pagination.limit, pagination.offset || ((pagination.page - 1) * pagination.limit)];

    return { mainQuery, queryValues };
} 