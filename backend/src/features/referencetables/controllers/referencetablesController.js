import { timedQuery, runTransactionWith } from '../../../db/queryTimer.js';

export async function getReferenceTableData(identifier) {
    let table;
    // Determine if the identifier is a number (ID) or a string (slug)
    const isNumeric = !isNaN(identifier);

    if (isNumeric) {
        const { rows } = await timedQuery(
            `SELECT id, name, description, slug FROM reference_tables WHERE id = ?`,
            [identifier],
            `Fetch table details by ID: ${identifier}`
        );
        table = rows[0];
    } else {
        const { rows } = await timedQuery(
            `SELECT id, name, description, slug FROM reference_tables WHERE slug = ?`,
            [identifier],
            `Fetch table details by slug: ${identifier}`
        );
        table = rows[0];
    }

    if (!table) {
        return null;
    }

    const tableId = table.id;

    // Get columns in order
    const { rows: columns } = await timedQuery(
        `SELECT id, header, column_index, alignment FROM reference_table_columns WHERE table_id = ? ORDER BY column_index`,
        [tableId],
        `Fetch columns for table ${tableId}`
    );

    // Get all rows
    const { rows: table_rows } = await timedQuery(
        `SELECT id, row_index, label FROM reference_table_rows WHERE table_id = ? ORDER BY row_index`,
        [tableId],
        `Fetch rows for table ${tableId}`
    );

    // Get all cells
    let cells = [];
    if (table_rows.length > 0) {
        ({ rows: cells } = await timedQuery(
            `SELECT row_id, column_id, value, col_span, row_span FROM reference_table_cells WHERE row_id IN (${table_rows.map(() => '?').join(',')})`,
            table_rows.map(r => r.id),
            `Fetch cells for table ${tableId}`
        ));
    }

    const colMap = Object.fromEntries(columns.map(col => [col.id, col]));
    const rowMap = Object.fromEntries(table_rows.map(row => [row.id, row]));

    const structuredRows = table_rows.map(row => ({
        id: row.id,
        rowIndex: row.row_index,
        label: row.label,
        cells: []
    }));

    cells.forEach(cell => {
        const rowIndex = rowMap[cell.row_id].row_index;
        const colIndex = colMap[cell.column_id].column_index;
        structuredRows[rowIndex].cells[colIndex] = cell;
    });

    return {
        table: table,
        headers: columns,
        rows: structuredRows,
    };
}

export async function getReferenceTables(req, res) {
    const { page = 1, limit = 25, sort = 'name', order = 'asc', name = '', slug = '' } = req.query;
    const offset = (page - 1) * limit;

    const allowedSorts = ['name', 'slug'];
    const sortBy = allowedSorts.includes(sort) ? sort : 'name';
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

    let whereClauses = [];
    let whereValues = [];

    if (name) {
        whereClauses.push(`rt.name LIKE ?`);
        whereValues.push(`%${name}%`);
    }

    if (slug) {
        whereClauses.push(`rt.slug LIKE ?`);
        whereValues.push(`%${slug}%`);
    }

    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    try {
        const query = `
            SELECT
                rt.id,
                rt.name,
                rt.description,
                rt.slug,
                COALESCE(rc.row_count, 0) as row_count,
                COALESCE(cc.column_count, 0) as column_count,
                COUNT(rt.id) OVER() as total_count
            FROM
                reference_tables rt
            LEFT JOIN
                (SELECT table_id, COUNT(id) as row_count FROM reference_table_rows GROUP BY table_id) rc
                ON rt.id = rc.table_id
            LEFT JOIN
                (SELECT table_id, MAX(column_index) + 1 as column_count
                 FROM reference_table_columns
                 GROUP BY table_id) cc
                ON rt.id = cc.table_id
            ${where}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?`;

        const { rows } = await timedQuery(
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

export async function createReferenceTable(req, res) {
    const { name, description, headers, rows: table_rows, slug } = req.body;

    if (!name) {
        return res.status(400).send('Reference table name is required.');
    }

    if (!slug) {
        return res.status(400).send('Reference table slug is required.');
    }

    try {
        const newTable = await runTransactionWith(async (query) => {
            // 1. Insert into reference_tables
            const { rows } = await query(
                `INSERT INTO reference_tables (name, description, slug) VALUES (?, ?, ?)`,
                [name, description || null, slug],
                'Create reference table'
            );
            const newTableId = rows.insertId;

            // 2. Insert columns
            const columnMap = new Map(); // Map column_index to column_id
            for (const [index, headerData] of headers.entries()) {
                const { rows } = await query(
                    `INSERT INTO reference_table_columns (table_id, column_index, header, alignment) VALUES (?, ?, ?, ?)`,
                    [newTableId, index, headerData.header, headerData.alignment],
                    `Insert column ${index} for table ${newTableId}`
                );
                columnMap.set(index, rows.insertId);
            }

            // 3. Insert rows and cells
            const rowIds = [];
            for (const [rowIndex, rowCells] of table_rows.entries()) { // rowCells is now an array of cell objects
                const { rows } = await query(
                    `INSERT INTO reference_table_rows (table_id, row_index) VALUES (?, ?)`,
                    [newTableId, rowIndex],
                    `Insert row ${rowIndex} for table ${newTableId}`
                );
                const newRowId = rows.insertId;
                rowIds.push(newRowId);

                for (const cell of rowCells) { // Iterate over cell objects
                    const colId = columnMap.get(cell.column_index);
                    if (colId !== undefined) { // Ensure column exists for this cell
                        await query(
                            `INSERT INTO reference_table_cells (row_id, column_id, value, col_span, row_span) VALUES (?, ?, ?, ?, ?)`,
                            [newRowId, colId, cell.value || null, cell.col_span || 1, cell.row_span || 1],
                            `Insert cell at row ${rowIndex}, col ${cell.column_index} for table ${newTableId}`
                        );
                    }
                }
            }

            // Fetch the newly created table details to return
            const { rows: fetchedTable } = await query(
                `SELECT id, name, description, slug, created_at FROM reference_tables WHERE id = ?`,
                [newTableId],
                'Fetch newly created reference table'
            );
            return fetchedTable[0];
        });

        res.status(201).json(newTable);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function updateReferenceTable(req, res) {
    const { id } = req.params;
    const { name, description, headers, rows: table_rows, slug } = req.body;

    if (!name && description === undefined && (!headers || headers.length === 0) && (!rows || rows.length === 0) && !slug) {
        return res.status(400).send('At least one field (name, description, headers, rows, or slug) must be provided for update.');
    }

    try {
        const updatedTable = await runTransactionWith(async (query) => {
            // 1. Update the main reference_tables entry if name or description are provided
            let updateFields = [];
            let updateValues = [];

            if (name) {
                updateFields.push('name = ?');
                updateValues.push(name);
            }

            if (slug) {
                updateFields.push('slug = ?');
                updateValues.push(slug);
            }

            if (description !== undefined) {
                updateFields.push('description = ?');
                updateValues.push(description);
            }

            if (updateFields.length > 0) {
                await query(
                    `UPDATE reference_tables SET ${updateFields.join(', ')} WHERE id = ?`,
                    [...updateValues, id],
                    'Update reference table metadata'
                );
            }

            // 2. Delete existing columns, rows, and cells for this table_id
            // Due to ON DELETE CASCADE, deleting columns and rows will also delete associated cells.
            await query(
                `DELETE FROM reference_table_columns WHERE table_id = ?`,
                [id],
                'Delete existing columns'
            );
            await query(
                `DELETE FROM reference_table_rows WHERE table_id = ?`,
                [id],
                'Delete existing rows'
            );

            // 3. Insert new columns
            const columnMap = new Map(); // Map column_index to column_id
            if (headers && headers.length > 0) {
                for (const [index, headerData] of headers.entries()) {
                    const { rows } = await query(
                        `INSERT INTO reference_table_columns (table_id, column_index, header, alignment) VALUES (?, ?, ?, ?)`,
                        [id, index, headerData.header, headerData.alignment],
                        `Insert new column ${index} for table ${id}`);
                    columnMap.set(index, rows.insertId);
                }
            }

            // 4. Insert new rows and cells
            if (table_rows && table_rows.length > 0) {
                for (const [rowIndex, rowCells] of table_rows.entries()) { // rowCells is now an array of cell objects
                    const { rows } = await query(
                        `INSERT INTO reference_table_rows (table_id, row_index) VALUES (?, ?)`,
                        [id, rowIndex],
                        `Insert new row ${rowIndex} for table ${id}`
                    );
                    const newRowId = rows.insertId;

                    for (const cell of rowCells) { // Iterate over cell objects
                        const colId = columnMap.get(cell.column_index);
                        if (colId !== undefined) {
                            await query(
                                `INSERT INTO reference_table_cells (row_id, column_id, value, col_span, row_span) VALUES (?, ?, ?, ?, ?)`,
                                [newRowId, colId, cell.value || null, cell.col_span || 1, cell.row_span || 1],
                                `Insert new cell at row ${rowIndex}, col ${cell.column_index} for table ${id}`
                            );
                        }
                    }
                }
            }

            // 5. Fetch the updated table details to return
            const { rows: fetchedTable } = await query(
                `SELECT id, name, description, slug, created_at FROM reference_tables WHERE id = ?`,
                [id],
                'Fetch updated reference table'
            );
            if (fetchedTable.length === 0) {
                throw new Error('Reference table not found after update.');
            }
            return fetchedTable[0];
        });

        res.json(updatedTable);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function deleteReferenceTable(req, res) {
    const { id } = req.params;

    try {
        const { rows } = await runTransactionWith(async (query) => {
            return await query(
                `DELETE FROM reference_tables WHERE id = ?`,
                [id],
                'Delete reference table'
            );
        });

        if (rows[0].affectedRows === 0) {
            return res.status(404).send('Reference table not found.');
        }

        res.status(204).send(); // No Content
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function getReferenceTable(req, res) {
    const { identifier } = req.params;

    try {
        const tableData = await getReferenceTableData(identifier);

        if (!tableData) {
            return res.status(404).send('Reference table not found.');
        }

        res.json(tableData);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function resolve(identifiers) {

    const resolvedTables = {};
    for (const identifier of identifiers) {
        const tableData = await getReferenceTableData(identifier);
        resolvedTables[identifier] = tableData;
    }
    return resolvedTables;
} 
