import pool from './pool.js';

/**
 * Utility function to time database queries
 * @param {Function} queryFn - The query function to execute
 * @param {string} queryName - Name of the query for logging
 * @returns {Promise<any>} - Returns query result
 */
export async function timeQuery(queryFn, queryName) {
    const start = performance.now();
    const result = await queryFn();
    const end = performance.now();
    const duration = end - start;

    console.log(`[QueryTimer] ${queryName} took ${duration.toFixed(2)}ms`);
    return result[0];
}

/**
 * Wrapper for pool.query that includes timing
 * @param {string} sql - The SQL query
 * @param {Array} values - Query parameters
 * @param {string} queryName - Name of the query for logging
 * @returns {Promise<any>} - Returns query result
 */
export async function timedQuery(sql, values, queryName) {
    return timeQuery(
        () => pool.query(sql, values),
        queryName
    );
} 