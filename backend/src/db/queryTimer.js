import pool from './pool.js';

/**
 * Times the execution of an asynchronous query function.
 *
 * @param {Function} queryFn - The asynchronous function to execute and time.
 * @param {string} queryName - The name of the query for logging purposes.
 * @returns {Promise<{rows: Array<any>, fields: Array<any>, raw: any}>} The result of the query function
 */
async function timeQuery(queryFn, queryName) {
    const start = performance.now();
    const result = await queryFn();
    const end = performance.now();
    const duration = end - start;

    console.log(`[QueryTimer] ${queryName} took ${duration.toFixed(2)}ms`);
    return result;
}

/**
 * Executes an SQL query and times its execution.
 *
 * @param {string} sql - The SQL query string.
 * @param {Array<any>} values - An array of values to be used with the SQL query.
 * @param {string} queryName - The name of the query for logging purposes.
 * @param {pg.Client | pg.Pool | null} client - Optional PostgreSQL client or pool to use for the query.
 * @returns {Promise<{rows: Array<any>, fields: Array<any>, raw: any}>} The result of the SQL query, with rows, fields, and raw properties.
 */
export async function timedQuery(sql, values, queryName, client = null) {
    return timeQuery(
        () => (client ?? pool).query(sql, values).then(result => ({
            rows: result[0],
            fields: result[1],
            raw: result,
        })),
        queryName
    );
}

/**
 * Runs a set of queries within a transaction using a client.
 * The callback receives a transaction-scoped `timedQuery` function and the `client`.
 * Automatically commits or rolls back on error.
 *
 * @param {Function} callback - Async function with signature `(timedQuery, client) => {...}`.
 * @returns {Promise<any>} - Whatever the callback returns.
 */
export async function runTransactionWith(callback) {
    const client = await pool.getConnection();
    try {
        await client.query('BEGIN');

        const result = await callback(
            // Transaction-bound timedQuery
            (sql, values, name) => timedQuery(sql, values, name, client),
            client
        );

        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[Transaction Error]', err);
        throw err;
    } finally {
        client.release();
    }
}
