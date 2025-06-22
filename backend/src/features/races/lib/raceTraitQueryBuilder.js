import { createFilterProcessor, buildWhereAndHavingClauses } from '../../../db/queryBuilder.js';
import { raceTraitFilterConfig } from '../config/raceTraitConfig.js';

export const processRaceTraitsQuery = createFilterProcessor(raceTraitFilterConfig);

export function buildRaceTraitsQuery(processedQuery) {
    const { filters, pagination, sort } = processedQuery;

    const baseQuery = 'FROM race_traits';

    const { where, having, whereValues, havingValues } = buildWhereAndHavingClauses(filters, raceTraitFilterConfig);

    const sortBy = sort.sortBy || 'trait_slug';
    const sortOrder = sort.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const mainQuery = `
        SELECT 
            *,
            COUNT(*) OVER() as total_count
        ${baseQuery}
        ${where}
        ${having}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?`;

    const queryValues = [...whereValues, ...havingValues, pagination.limit, pagination.offset || ((pagination.page - 1) * pagination.limit)];

    return { mainQuery, queryValues };
} 