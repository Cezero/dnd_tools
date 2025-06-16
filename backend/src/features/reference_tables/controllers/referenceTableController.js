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
            SELECT id, name, description, COUNT(*) OVER() as total_count
            FROM reference_tables
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
        await timedQuery('START TRANSACTION');

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

        await timedQuery('COMMIT');
        res.status(201).json({ message: 'Reference table created successfully', tableId: tableId });

    } catch (err) {
        await timedQuery('ROLLBACK');
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
        await timedQuery('START TRANSACTION');

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

        await timedQuery('COMMIT');
        res.json({ message: 'Reference table updated successfully' });

    } catch (err) {
        await timedQuery('ROLLBACK');
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function deleteReferenceTable(req, res) {
    const { id } = req.params;

    try {
        await timedQuery('START TRANSACTION');

        // Delete associated cells and rows first due to foreign key constraints
        await timedQuery(`DELETE FROM reference_table_cells WHERE row_id IN (SELECT id FROM reference_table_rows WHERE table_id = ?)`, [id], 'Delete associated reference table cells');
        await timedQuery(`DELETE FROM reference_table_rows WHERE table_id = ?`, [id], 'Delete associated reference table rows');
        await timedQuery(`DELETE FROM reference_tables WHERE id = ?`, [id], 'Delete reference table');

        await timedQuery('COMMIT');
        res.status(200).json({ message: 'Reference table deleted successfully' });

    } catch (err) {
        await timedQuery('ROLLBACK');
        console.error(err);
        res.status(500).send('Server error');
    }
} 