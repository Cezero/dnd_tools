/**
 * Utility function to time database queries
 * @param {Function} queryFn - The query function to execute
 * @param {string} queryName - Name of the query for logging
 * @returns {Promise<[any, number]>} - Returns [query result, execution time in ms]
 */
export async function timeQuery(queryFn, queryName) {
    const start = performance.now();
    const result = await queryFn();
    const end = performance.now();
    const duration = end - start;

    console.log(`[QueryTimer] ${queryName} took ${duration.toFixed(2)}ms`);
    return [result, duration];
}

/**
 * Wrapper for pool.query that includes timing
 * @param {Object} pool - The database pool
 * @param {string} sql - The SQL query
 * @param {Array} values - Query parameters
 * @param {string} queryName - Name of the query for logging
 * @returns {Promise<[any, number]>} - Returns [query result, execution time in ms]
 */
export async function timedQuery(pool, sql, values, queryName) {
    return timeQuery(
        () => pool.query(sql, values),
        queryName
    );
} 