import { timedQuery } from '../../../db/queryTimer.js';

export async function getReferenceTables(req, res) {
    const { page = 1, limit = 20, sort = 'name', order = 'asc', name = '' } = req.query;
    const offset = (page - 1) * limit;

    const allowedSorts = ['name'];
    const sortBy = allowedSorts.includes(sort) ? sort : 'name';
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

    let whereClauses = [];
    let whereValues = [];

    if (name) {
        whereClauses.push(`name LIKE ?`);
        whereValues.push(`%${name}%`);
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    try {
        const query = `
            SELECT
                rt.id,
                rt.name,
                rt.description,
                COALESCE(rc.row_count, 0) as row_count,
                COALESCE(cc.column_count, 0) as column_count,
                COUNT(rt.id) OVER() as total_count
            FROM
                reference_tables rt
            LEFT JOIN
                (SELECT table_id, COUNT(id) as row_count FROM reference_table_rows GROUP BY table_id) rc
                ON rt.id = rc.table_id
            LEFT JOIN
                (SELECT rtr.table_id, MAX(rtc.column_index) + 1 as column_count
                 FROM reference_table_rows rtr
                 JOIN reference_table_cells rtc ON rtr.id = rtc.row_id
                 GROUP BY rtr.table_id) cc
                ON rt.id = cc.table_id
            ${where}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?`;

        const rows = await timedQuery(
            query,
            [...whereValues, parseInt(limit), parseInt(offset)],
            'Reference tables list query'
        );

        const total = rows.length > 0 ? Number(rows[0].total_count) : 0;

        res.json({
            page: Number(page),
            limit: Number(limit),
            total: total,
            results: rows,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function getReferenceTableById(req, res) {
    const { id } = req.params;

    try {
        // Get the main table info
        const tableQuery = `SELECT * FROM reference_tables WHERE id = ?`;
        const tableRows = await timedQuery(tableQuery, [id], 'Get reference table by ID');

        if (tableRows.length === 0) {
            return res.status(404).send('Reference Table not found');
        }

        const table = tableRows[0];

        // Get rows for the table
        const rowsQuery = `SELECT id, row_index, label FROM reference_table_rows WHERE table_id = ? ORDER BY row_index ASC`;
        const rows = await timedQuery(rowsQuery, [id], 'Get reference table rows');

        // Get cells for all rows
        const rowIds = rows.map(row => row.id);
        let cells = [];
        if (rowIds.length > 0) {
            const cellsQuery = `SELECT id, row_id, column_index, content, col_span, row_span FROM reference_table_cells WHERE row_id IN (?) ORDER BY row_id, column_index ASC`;
            cells = await timedQuery(cellsQuery, [rowIds.join(',')], 'Get reference table cells');
        }

        // Structure the data
        const resultRows = rows.map(row => ({
            ...row,
            cells: cells.filter(cell => cell.row_id === row.id)
        }));

        res.json({
            ...table,
            rows: resultRows
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function createReferenceTable(req, res) {
    const { name, description, rows } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Table name is required.' });
    }

    try {
        await timedQuery('START TRANSACTION', [], 'Start Transaction: Create Reference Table');

        const insertTableQuery = `INSERT INTO reference_tables (name, description) VALUES (?, ?)`;
        const tableResult = await timedQuery(insertTableQuery, [name, description], 'Create reference table');
        const tableId = tableResult.insertId;

        if (rows && rows.length > 0) {
            for (const rowData of rows) {
                const insertRowQuery = `INSERT INTO reference_table_rows (table_id, row_index, label) VALUES (?, ?, ?)`;
                const rowResult = await timedQuery(insertRowQuery, [tableId, rowData.row_index, rowData.label], 'Create reference table row');
                const rowId = rowResult.insertId;

                if (rowData.cells && rowData.cells.length > 0) {
                    const cellValues = rowData.cells.map(cell => `(?, ?, ?, ?, ?)`).join(', ');
                    const cellParams = rowData.cells.flatMap(cell => [rowId, cell.column_index, cell.content, cell.col_span || 1, cell.row_span || 1]);
                    const insertCellsQuery = `INSERT INTO reference_table_cells (row_id, column_index, content, col_span, row_span) VALUES ${cellValues}`;
                    await timedQuery(insertCellsQuery, cellParams, 'Create reference table cells');
                }
            }
        }

        await timedQuery('COMMIT', [], 'Commit Transaction: Create Reference Table');
        res.status(201).json({ message: 'Reference table created successfully', tableId: tableId });

    } catch (err) {
        await timedQuery('ROLLBACK', [], 'Rollback Transaction: Create Reference Table');
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function updateReferenceTable(req, res) {
    const { id } = req.params;
    const { name, description, rows } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Table name is required.' });
    }

    try {
        await timedQuery('START TRANSACTION', [], 'Start Transaction: Update Reference Table');

        // Update the main table info
        const updateTableQuery = `UPDATE reference_tables SET name = ?, description = ? WHERE id = ?`;
        await timedQuery(updateTableQuery, [name, description, id], 'Update reference table');

        // Delete existing rows and cells for this table
        await timedQuery(`DELETE FROM reference_table_cells WHERE row_id IN (SELECT id FROM reference_table_rows WHERE table_id = ?)`, [id], 'Delete existing reference table cells');
        await timedQuery(`DELETE FROM reference_table_rows WHERE table_id = ?`, [id], 'Delete existing reference table rows');

        // Insert new/updated rows and cells
        if (rows && rows.length > 0) {
            for (const rowData of rows) {
                const insertRowQuery = `INSERT INTO reference_table_rows (table_id, row_index, label) VALUES (?, ?, ?)`;
                const rowResult = await timedQuery(insertRowQuery, [id, rowData.row_index, rowData.label], 'Insert new reference table row');
                const rowId = rowResult.insertId;

                if (rowData.cells && rowData.cells.length > 0) {
                    const cellValues = rowData.cells.map(cell => `(?, ?, ?, ?, ?)`).join(', ');
                    const cellParams = rowData.cells.flatMap(cell => [rowId, cell.column_index, cell.content, cell.col_span || 1, cell.row_span || 1]);
                    const insertCellsQuery = `INSERT INTO reference_table_cells (row_id, column_index, content, col_span, row_span) VALUES ${cellValues}`;
                    await timedQuery(insertCellsQuery, cellParams, 'Insert new reference table cells');
                }
            }
        }

        await timedQuery('COMMIT', [], 'Commit Transaction: Update Reference Table');
        res.json({ message: 'Reference table updated successfully' });

    } catch (err) {
        await timedQuery('ROLLBACK', [], 'Rollback Transaction: Update Reference Table');
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function deleteReferenceTable(req, res) {
    const { id } = req.params;

    try {
        await timedQuery('START TRANSACTION', [], 'Start Transaction: Delete Reference Table');

        // Delete associated cells and rows first due to foreign key constraints
        await timedQuery(`DELETE FROM reference_table_cells WHERE row_id IN (SELECT id FROM reference_table_rows WHERE table_id = ?)`, [id], 'Delete associated reference table cells');
        await timedQuery(`DELETE FROM reference_table_rows WHERE table_id = ?`, [id], 'Delete associated reference table rows');
        await timedQuery(`DELETE FROM reference_tables WHERE id = ?`, [id], 'Delete reference table');

        await timedQuery('COMMIT', [], 'Commit Transaction: Delete Reference Table');
        res.status(200).json({ message: 'Reference table deleted successfully' });

    } catch (err) {
        await timedQuery('ROLLBACK', [], 'Rollback Transaction: Delete Reference Table');
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function getReferenceTableContent(req, res) {
    const { id } = req.params;
    const { page = 1, limit = 20, sort, order } = req.query;
    const offset = (page - 1) * limit;

    try {
        // Get column information for the table
        const columnsQuery = `
            SELECT DISTINCT
                rtc.column_index,
                SUBSTR(rtc.content, 1, 50) AS sample_content,
                'TEXT' as data_type -- Placeholder, actual type detection is complex without schema
            FROM
                reference_table_cells rtc
            JOIN
                reference_table_rows rtr ON rtc.row_id = rtr.id
            WHERE
                rtr.table_id = ?
            ORDER BY
                rtc.column_index ASC;
        `;
        const rawColumns = await timedQuery(columnsQuery, [id], 'Get reference table columns');

        // Determine column names based on column_index
        const columns = rawColumns.map((col, index) => ({
            column_name: `column_${col.column_index + 1}`,
            data_type: col.data_type // Or attempt to infer type from sample_content if desired
        }));

        // Construct the dynamic SELECT part for content
        let selectColumns = ['rtr.id', 'rtr.row_index', 'rtr.label'];
        columns.forEach(col => {
            selectColumns.push(`MAX(CASE WHEN rtc.column_index = ${col.column_name.replace('column_', '') - 1} THEN rtc.content ELSE NULL END) AS ${col.column_name}`);
        });

        // Get rows and cells for the table
        const countQuery = `SELECT COUNT(id) AS total_count FROM reference_table_rows WHERE table_id = ?`;
        const totalRowsResult = await timedQuery(countQuery, [id], 'Count reference table rows');
        const total = totalRowsResult.length > 0 ? totalRowsResult[0].total_count : 0;

        let orderByClause = '';
        if (sort && columns.some(col => col.column_name === sort)) {
            orderByClause = `ORDER BY ${sort} ${order === 'desc' ? 'DESC' : 'ASC'}`;
        } else {
            orderByClause = 'ORDER BY rtr.row_index ASC';
        }

        const contentQuery = `
            SELECT
                ${selectColumns.join(',\n')}
            FROM
                reference_table_rows rtr
            LEFT JOIN
                reference_table_cells rtc ON rtr.id = rtc.row_id
            WHERE
                rtr.table_id = ?
            GROUP BY
                rtr.id, rtr.row_index, rtr.label
            ${orderByClause}
            LIMIT ? OFFSET ?;
        `;
        const results = await timedQuery(contentQuery, [id, parseInt(limit), parseInt(offset)], 'Get reference table content');

        res.json({
            page: Number(page),
            limit: Number(limit),
            total: Number(total),
            columns: columns,
            results: results,
        });

    } catch (err) {
        console.error('Error fetching reference table content:', err);
        res.status(500).send('Server error');
    }
} 