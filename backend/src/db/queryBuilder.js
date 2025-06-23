export function buildQuery(filterConfig, processedQuery) {
    const { filters, pagination, sort, useAlternateBaseTable } = processedQuery;

    const { baseQuery, joinClause } = buildBaseQueryAndJoinClauses(filterConfig, useAlternateBaseTable);

    const { where, having, whereValues, havingValues } = buildWhereAndHavingClauses(filters, filterConfig);
    const selectClauses = buildMultiValueSelect(filterConfig, useAlternateBaseTable);

    const { sortSelect, sortBy } = buildSortSelectAndSortBy(filterConfig, sort.sortBy, useAlternateBaseTable);

    const sortOrder = sort.sortOrder === 'desc' ? 'DESC' : 'ASC';

    const tableAlias = getTableAlias(filterConfig.base.table);

    const mainQuery = `
        SELECT 
            ${tableAlias}.*,
            ${sortSelect}
            ${selectClauses}
            COUNT(*) OVER() as total_count
        ${baseQuery}
        ${joinClause}
        ${where}
        GROUP BY ${tableAlias}.${filterConfig.base.groupColumn}
        ${having}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT ? OFFSET ?`;

    const queryValues = [...whereValues, ...havingValues, pagination.limit, pagination.offset || ((pagination.page - 1) * pagination.limit)];

    return { mainQuery, queryValues };

}


export function processQuery(queryParams, filterConfig) {
    const processed = {
        filters: {},
        pagination: {},
        sort: {},
        errors: [],
        useAlternateBaseTable: false, // This will be handled by the specific feature's query builder
    };
    const allowedParams = Object.keys(filterConfig);
    const allowedLogicParams = allowedParams.filter(key => filterConfig[key].logicSupported).map(key => `${key}_logic`);
    const allAllowed = [...allowedParams, ...allowedLogicParams, 'page', 'limit', 'sort', 'order', 'mclist', 'mcfilter'];

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
            processed.pagination.limit = parseInt(queryParams[key]) || 25;
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

        if (key === 'mclist') {
            processed.filters._mclist = queryParams[key].split(',').map(col => col.trim()).filter(col => col.length > 0);
            // Validate that all columns in mclist are allowed parameters
            const invalidColumns = processed.filters._mclist.filter(col => !allowedParams.includes(col));
            if (invalidColumns.length > 0) {
                processed.errors.push(`Invalid columns in mclist: ${invalidColumns.join(', ')}`);
            }
            continue;
        }

        if (key === 'mcfilter') {
            processed.filters._mcfilter = `%${queryParams[key]}%`;
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
                } else if (config.dataType === 'string') {
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

    processed.pagination.page = processed.pagination.page || filterConfig.page || 1;
    processed.pagination.limit = processed.pagination.limit || filterConfig.limit || 25;
    processed.sort.sortBy = processed.sort.sortBy || filterConfig.base.sort || 'name';
    processed.sort.sortOrder = processed.sort.sortOrder || filterConfig.order || 'asc';

    return processed;
};


export function getTableAlias(table) {
    let parts = table.split(/[-_]/);
    if (parts.length === 0) return table;
    const alias = parts.map(word => word.slice(0, 2) || '').join('');

    return alias;
}

export function buildSortSelectAndSortBy(filterConfig, inputSortBy, useAlternateBaseTable) {
    const baseAlias = getTableAlias(filterConfig.base.table);
    const altAlias = (filterConfig.base.alt ? getTableAlias(filterConfig.base.alt) : '');
    let sortBy = inputSortBy;
    let sortSelect = '';
    if (sortBy in filterConfig && 'sortLogic' in filterConfig[sortBy]) {
        const sortLogic = filterConfig[sortBy].sortLogic;
        const selectConf = (useAlternateBaseTable && sortLogic.altTable ? sortLogic.altTable : sortLogic.baseTable);
        const selectTable = (useAlternateBaseTable && sortLogic.altTable ? altAlias : baseAlias);
        if (sortLogic.sortAlias) {
            if (selectConf) {
                if (selectConf.function) {
                    sortSelect = `${selectConf.function}(${selectTable}.${selectConf.column}) AS ${sortLogic.sortAlias},`;
                } else {
                    sortSelect = `${selectTable}.${selectConf.column} AS ${sortLogic.sortAlias},`;
                }
            }
            sortBy = `${sortLogic.sortAlias}`;
        } else {
            sortBy = `${selectTable}.${selectConf.column}`;
        }
    }
    return { sortSelect, sortBy };
}

export function buildBaseQueryAndJoinClauses(filterConfig, useAlternateBaseTable) {
    let joinClauses = [];
    let baseQuery = ''
    const baseTable = filterConfig.base.table;
    const baseTableAlias = getTableAlias(baseTable);
    const altTable = filterConfig.base.alt;
    const joinColumn = filterConfig.base.joinColumn;
    const altTableAlias = (filterConfig.base.alt ? getTableAlias(filterConfig.base.alt) : '');

    if (useAlternateBaseTable) {
        baseQuery = `FROM ${altTable} ${altTableAlias}`;
        joinClauses.push(`JOIN ${baseTable} ${baseTableAlias} ON ${altTableAlias}.${joinColumn} = ${baseTableAlias}.${joinColumn}`);
    } else {
        baseQuery = `FROM ${baseTable} ${baseTableAlias}`;
        if (altTable) {
            let fixedCondition = '';
            if (filterConfig.base.fixedConditions && filterConfig.base.fixedConditions.length > 0) {
                for (const cond in filterConfig.base.fixedConditions) {
                    fixedCondition += ` AND ${altTableAlias}.${cond}`;
                }
            }
            joinClauses.push(`JOIN ${altTable} ${altTableAlias} ON ${baseTableAlias}.${joinColumn} = ${altTableAlias}.${joinColumn}${fixedCondition}`);
        }
    }
    Object.entries(filterConfig).forEach(([key, value]) => {
        if (value.join) {
            const { table, mainIdColumn } = value.join;
            const alias = getTableAlias(table);
            let fixedCondition = '';
            if (filterConfig.base.fixedConditions && filterConfig.base.fixedConditions.length > 0) {
                for (const cond in value.fixedConditions) {
                    fixedCondition += ` AND ${alias}.${cond}`;
                }
            }
            joinClauses.push(`LEFT JOIN ${table} ${alias} on ${baseTableAlias}.${mainIdColumn} = ${alias}.${mainIdColumn}${fixedCondition}`);
        }
    });
    const joinClause = `${joinClauses.join('\n')}`;
    return { baseQuery, joinClause };
}

export function buildMultiValueSelect(filterConfig) {
    let selectClauses = [];
    Object.entries(filterConfig).forEach(([key, value]) => {
        if (value.multiValue) {
            const mvConf = value.multiValue;
            const sourceTable = (value.useAltTable
                ? filterConfig.base.alt
                : (value.join?.table
                    ? value.join.table
                    : filterConfig.base.table
                )
            );
            const tableAlias = getTableAlias(sourceTable);
            /* GROUP_CONCAT(DISTINCT CONCAT(ssm_src.book_id, ':', ssm_src.page_number)) as source_info,
               GROUP_CONCAT(DISTINCT scm.comp_id) as component_ids, */
            selectClauses.push((mvConf.value
                ? `GROUP_CONCAT(DISTINCT CONCAT(${tableAlias}.${mvConf.column}, ':', ${tableAlias}.${mvConf.value})) AS ${mvConf.alias}`
                : `GROUP_CONCAT(DISTINCT ${tableAlias}.${mvConf.column}) AS ${mvConf.alias}`
            ))
        }
    });
    return (selectClauses.length > 0 ? selectClauses.join(',\n')+',\n' : '');
}

export function buildWhereAndHavingClauses(filters, filterConfig) {
    console.log('[buildWhereAndHavingClauses] filters', filters);
    let whereClauses = [];
    let havingClauses = [];
    let whereValues = [];
    let havingValues = [];

    const tableAlias = getTableAlias(filterConfig.base.table);
    const altTableAlias = (filterConfig.base.alt ? getTableAlias(filterConfig.base.alt) : '');

    for (const key in filters) {
        if (key.endsWith('_logic')
            || key === 'base'
            || key === '_mclist'
            || key === '_mcfilter'
        ) {
            continue; // These are handled separately
        }

        const config = filterConfig[key];
        const column = (config.useAltTable
            ? `${altTableAlias}.${config.column}`
            : `${tableAlias}.${config.column}`
        );

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
                    whereClauses.push(`${column} = ?`);
                    whereValues.push(value[0]);
                } else {
                    const placeholders = value.map(() => '?').join(', ');
                    if (logic === 'and') {
                        whereClauses.push(`${column} IN (${placeholders})`);
                        whereValues.push(...value);
                        havingClauses.push(`COUNT(DISTINCT ${column}) = ?`);
                        havingValues.push(value.length);
                    } else {
                        whereClauses.push(`${column} IN (${placeholders})`);
                        whereValues.push(...value);
                    }
                }
            } else {
                whereClauses.push(`${column} = ?`);
                whereValues.push(value);
            }
            if (config.fixedConditions && config.fixedConditions.length > 0) {
                for (const cond in value.fixedConditions) {
                    const condition = (config.useAltTable
                        ? `${altTableAlias}.${cond}`
                        : `${tableAlias}.${cond}`
                    );
                    whereClauses.push(`${condition}`);
                }
            }
        } else if (config.join) {
            const { table, filterColumn, mainIdColumn, fixedConditions } = config.join;
            const joinTableAlias = getTableAlias(table);
            const joinCol = `${joinTableAlias}.${mainIdColumn}`;
            const mainCol = `${tableAlias}.${mainIdColumn}`;
            const filterCol = `${joinTableAlias}.${filterColumn}`;
            let conditionsTemp = [];
            let conditionsClause = '';
            if (fixedConditions && fixedConditions.length > 0) {
                for (const cond in fixedConditions) {
                    conditionsTemp.push(`${joinTableAlias}.${cond}`);
                }
                conditionsClause = `AND ${fixedConditions.join(' AND ')}`;
            };

            if (config.isMultiValued) {
                if (value.length === 1) {
                    whereClauses.push(`
                        EXISTS (
                        SELECT 1 FROM ${table} ${joinTableAlias}
                        WHERE ${joinCol} = ${mainCol}
                        AND ${filterCol} = ?
                        ${conditionsClause}
                        )`);
                    whereValues.push(value[0]);
                } else {
                    const placeholders = value.map(() => '?').join(', ');
                    if (logic === 'and') {
                        whereClauses.push(`
                            EXISTS (
                            SELECT 1 FROM ${table} ${joinTableAlias}
                            WHERE ${joinCol} = ${mainCol}
                            AND ${filterCol} IN (${placeholders})
                            ${conditionsClause}
                            GROUP BY ${joinCol}
                            HAVING COUNT(DISTINCT ${filterCol}) = ?
                            )`);
                        whereValues.push(...value);
                        whereValues.push(value.length);
                    } else {
                        whereClauses.push(`
                            EXISTS (
                            SELECT 1 FROM ${table} ${joinTableAlias}
                            WHERE ${joinCol} = ${mainCol}
                            AND ${joinCol} IN (${placeholders})
                            ${conditionsClause}
                            )`);
                        whereValues.push(...value);
                    }
                }
            } else {
                whereClauses.push(`
                    EXISTS (
                    SELECT 1 FROM ${table} ${joinTableAlias}
                    WHERE ${joinCol} = ${mainCol}
                    AND ${filterCol} = ?
                    ${conditionsClause}
                    )`);
                whereValues.push(value);
            }
        } else if (config.isSearch) {
            whereClauses.push(`(${column} ${config.operator} ?)`);
            whereValues.push(value);
        } else {
            whereClauses.push(`${column} = ?`);
            whereValues.push(value);
        }
    }

    // Handle mclist and mcfilter
    const mclist = filters._mclist;
    const mcfilter = filters._mcfilter;

    if (mclist && mcfilter) {
        const mcWhereClauses = mclist.map(column => `${tableAlias}.${column} LIKE ?`);
        const mcClause = `(${mcWhereClauses.join(' OR ')})`;
        whereClauses.push(mcClause);
        for (let i = 0; i < mclist.length; i++) {
            whereValues.push(mcfilter);
        }
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    const having = havingClauses.length > 0 ? `HAVING ${havingClauses.join(' AND ')}` : '';

    return { where, having, whereValues, havingValues };
}
