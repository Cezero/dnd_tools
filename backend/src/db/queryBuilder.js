export function createFilterProcessor(filterConfig) {
    return function processQuery(queryParams) {
        const processed = {
            filters: {},
            pagination: {},
            sort: {},
            errors: [],
            useAlternateBaseTable: false, // This will be handled by the specific feature's query builder
        };
        const allowedParams = Object.keys(filterConfig);
        const allowedLogicParams = allowedParams.filter(key => filterConfig[key].logicSupported).map(key => `${key}_logic`);
        const allAllowed = [...allowedParams, ...allowedLogicParams, 'page', 'limit', 'sort', 'order'];

        for (const key in queryParams) {
            if (!allAllowed.includes(key)) {
                processed.errors.push(`Invalid query parameter: ${key}`);
                continue;
            }

            if (key === 'page') {
                processed.pagination.page = parseInt(queryParams[key]) || 1;
                continue;
            }
            if (key === 'limit') {
                processed.pagination.limit = parseInt(queryParams[key]) || 20;
                continue;
            }
            if (key === 'sort') {
                processed.sort.sortBy = queryParams[key];
                continue;
            }
            if (key === 'order') {
                processed.sort.sortOrder = queryParams[key];
                continue;
            }

            const config = filterConfig[key.replace('_logic', '')];

            if (key.endsWith('_logic')) {
                if (config && config.logicSupported) {
                    processed.filters[key] = queryParams[key];
                } else {
                    processed.errors.push(`Logic parameter ${key} not supported for ${key.replace('_logic', '')}`);
                }
            } else {
                if (config) {
                    let parsedValue = queryParams[key];

                    if (config.isMultiValued) {
                        parsedValue = (Array.isArray(queryParams[key]) ? queryParams[key] : String(queryParams[key]).split(',')).map(Number).filter(id => !isNaN(id));
                    } else if (config.isSearch) {
                        parsedValue = `%${queryParams[key]}%`;
                    } else if (config.data_type === 'string') {
                        parsedValue = String(queryParams[key]);
                    } else { // Default to int
                        parsedValue = parseInt(queryParams[key], 10);
                    }

                    if (config.cache) {
                        const id = config.cache.getID(parsedValue);
                        if (id) {
                            parsedValue = id;
                        } else {
                            processed.errors.push(`${key} not found: ${queryParams[key]}`);
                            continue;
                        }
                    }

                    if (config.isMultiValued && parsedValue.length === 0 && queryParams[key].length > 0) {
                        processed.errors.push(`No valid IDs found for ${key}: ${queryParams[key]}`);
                        continue;
                    }

                    processed.filters[key] = parsedValue;

                    // This flag remains for the specific query builder to decide base table
                    if (config.isBaseTableDecider && (!config.isMultiValued && parsedValue !== undefined || (config.isMultiValued && parsedValue.length > 0))) {
                        processed.useAlternateBaseTable = true;
                    }
                }
            }
        }

        processed.pagination.page = processed.pagination.page || 1;
        processed.pagination.limit = processed.pagination.limit || 20;
        processed.sort.sortBy = processed.sort.sortBy || 'spell_name'; // Default sort may need to be overridden by specific builder
        processed.sort.sortOrder = processed.sort.sortOrder || 'asc';

        return processed;
    };
}

export function buildWhereAndHavingClauses(filters, filterConfig) {
    let whereClauses = [];
    let havingClauses = [];
    let whereValues = [];
    let havingValues = [];

    for (const key in filters) {
        if (key.endsWith('_logic')) continue;

        const config = filterConfig[key];

        if (!config || ['page', 'limit', 'sort', 'order'].includes(key)) {
            continue;
        }

        const value = filters[key];
        const logic = filters[`${key}_logic`];

        if (value === undefined || value === null || (config.isMultiValued && value.length === 0)) {
            continue;
        }

        if (config.specialHandling) {
            config.specialHandling(value, whereClauses, whereValues);
        } else if (config.applyDirectlyToMainQuery) {
            if (config.isMultiValued) {
                if (value.length === 1) {
                    whereClauses.push(`${config.column} = ?`);
                    whereValues.push(value[0]);
                } else {
                    const placeholders = value.map(() => '?').join(', ');
                    if (logic === 'and') {
                        whereClauses.push(`${config.column} IN (${placeholders})`);
                        whereValues.push(...value);
                        havingClauses.push(`COUNT(DISTINCT ${config.column}) = ?`);
                        havingValues.push(value.length);
                    } else {
                        whereClauses.push(`${config.column} IN (${placeholders})`);
                        whereValues.push(...value);
                    }
                }
            } else {
                whereClauses.push(`${config.column} = ?`);
                whereValues.push(value);
            }
            if (config.fixedConditions && config.fixedConditions.length > 0) {
                whereClauses.push(...config.fixedConditions);
            }
        } else if (config.join) {
            const { table, filterColumn, mainIdColumn, fixedConditions } = config.join;
            const subqueryAlias = `${table.split(' ')[0]}_filter`;

            if (config.isMultiValued) {
                if (value.length === 1) {
                    whereClauses.push(`EXISTS (\n                        SELECT 1 FROM ${table} ${subqueryAlias} \n                        WHERE ${subqueryAlias}.spell_id = sp.spell_id \n                        AND ${subqueryAlias}.${filterColumn} = ?\n                        ${fixedConditions.length > 0 ? `AND ${fixedConditions.join(' AND ')}` : ''} \n                    )`);
                    whereValues.push(value[0]);
                } else {
                    const placeholders = value.map(() => '?').join(', ');
                    if (logic === 'and') {
                        whereClauses.push(`EXISTS (\n                            SELECT 1 FROM ${table} ${subqueryAlias} \n                            WHERE ${subqueryAlias}.spell_id = sp.spell_id \n                            AND ${subqueryAlias}.${filterColumn} IN (${placeholders}) \n                            ${fixedConditions.length > 0 ? `AND ${fixedConditions.join(' AND ')}` : ''} \n                            GROUP BY ${subqueryAlias}.spell_id \n                            HAVING COUNT(DISTINCT ${subqueryAlias}.${filterColumn}) = ?\n                        )`);
                        whereValues.push(...value);
                        whereValues.push(value.length);
                    } else {
                        whereClauses.push(`EXISTS (\n                            SELECT 1 FROM ${table} ${subqueryAlias} \n                            WHERE ${subqueryAlias}.spell_id = sp.spell_id \n                            AND ${subqueryAlias}.${filterColumn} IN (${placeholders}) \n                            ${fixedConditions.length > 0 ? `AND ${fixedConditions.join(' AND ')}` : ''} \n                        )`);
                        whereValues.push(...value);
                    }
                }
            } else {
                whereClauses.push(`EXISTS (\n                    SELECT 1 FROM ${table} ${subqueryAlias} \n                    WHERE ${subqueryAlias}.spell_id = sp.spell_id \n                    AND ${subqueryAlias}.${filterColumn} = ?\n                    ${fixedConditions.length > 0 ? `AND ${fixedConditions.join(' AND ')}` : ''} \n                )`);
                whereValues.push(value);
            }
        } else if (config.isSearch) {
            whereClauses.push(`(${config.column} ${config.operator} ?)`);
            whereValues.push(value);
        } else {
            whereClauses.push(`${config.column} = ?`);
            whereValues.push(value);
        }
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const having = havingClauses.length > 0 ? `HAVING ${havingClauses.join(' AND ')}` : '';

    return { where, having, whereValues, havingValues };
} 