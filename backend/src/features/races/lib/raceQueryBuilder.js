import { createFilterProcessor, buildWhereAndHavingClauses } from '../../../db/queryBuilder.js';
import { raceFilterConfig } from '../config/raceConfig.js';

export const processRacesQuery = createFilterProcessor(raceFilterConfig);

export function buildRacesQuery(processedQuery) {
    const { filters, pagination, sort } = processedQuery;

    const baseQuery = 'FROM races r';
    const joinClause = '';

    const { where, having, whereValues, havingValues } = buildWhereAndHavingClauses(filters, raceFilterConfig);

    let sortBy = sort.sortBy;
    if (sortBy === 'race_name') {
        sortBy = 'r.race_name';
    } else if (sortBy === 'size_id') {
        sortBy = 'r.size_id';
    } else if (sortBy === 'favored_class_id') {
        sortBy = 'r.favored_class_id';
    }

    const sortOrder = sort.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const mainQuery = `
        SELECT 
            r.*,
            COUNT(*) OVER() as total_count
        ${baseQuery}
        ${joinClause}
        ${where}
        GROUP BY r.race_id
        ${having}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?`;

    const queryValues = [...whereValues, ...havingValues, pagination.limit, pagination.offset || ((pagination.page - 1) * pagination.limit)];

    return { mainQuery, queryValues };
}   