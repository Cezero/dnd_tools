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
                (SELECT table_id, MAX(column_index) + 1 as column_count
                 FROM reference_table_columns
                 GROUP BY table_id) cc
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
        // Get columns in order
        const columns = await timedQuery(`
            SELECT id, header, column_index
            FROM reference_table_columns
            WHERE table_id = ?
            ORDER BY column_index
            `, [id], 'Fetch reference table columns by ID');

        const colMap = Object.fromEntries(columns.map(col => [col.id, col]));

        // Get all rows
        const rows = await timedQuery(`
            SELECT id, row_index
            FROM reference_table_rows
            WHERE table_id = ?
            ORDER BY row_index
            `, [id], 'Fetch reference table rows by ID');

        const rowMap = Object.fromEntries(rows.map(row => [row.id, row]));

        // Get all cells
        const cells = await timedQuery(`
            SELECT row_id, column_id, value, col_span, row_span
            FROM reference_table_cells
            WHERE row_id IN (${rows.map(r => r.id).join(',')})
            `, [], 'Fetch reference table cells by ID');

        // Group cells by row
        const rowsByIndex = {};
        rows.forEach(r => (rowsByIndex[r.row_index] = []));
        cells.forEach(cell => {
            const colIndex = colMap[cell.column_id].column_index;
            rowsByIndex[rowMap[cell.row_id].row_index][colIndex] = cell;
        });

        // Build HTML string
        let html = '<table class="table-auto border-collapse border border-gray-300 dark:border-gray-600 w-full">\n';

        // Header row
        html += '  <thead>\n    <tr>\n';
        columns.forEach(col => {
            html += `      <th class="border px-2 py-1">${col.header}</th>\n`;
        });
        html += '    </tr>\n  </thead>\n';

        // Body rows
        html += '  <tbody>\n';
        Object.values(rowsByIndex).forEach(row => {
            html += '    <tr>\n';
            for (let i = 0; i < columns.length; i++) {
                const cell = row[i];
                if (cell) {
                    const attrs = [];
                    if (cell.col_span > 1) attrs.push(`colspan="${cell.col_span}"`);
                    if (cell.row_span > 1) attrs.push(`rowspan="${cell.row_span}"`);
                    html += `      <td class="border px-2 py-1" ${attrs.join(' ')}>${cell.value}</td>\n`;
                } else {
                    html += '      <td class="border px-2 py-1"></td>\n';
                }
            }
            html += '    </tr>\n';
        });
        html += '  </tbody>\n</table>';
        res.json({ html });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function createReferenceTable(req, res) {
    const { name, description } = req.body;

    if (!name) {
        return res.status(400).send('Reference table name is required.');
    }

    try {
        const result = await timedQuery(
            `INSERT INTO reference_tables (name, description) VALUES (?, ?)`,
            [name, description || null],
            'Create reference table'
        );
        const newTableId = result.insertId;

        const newTable = await timedQuery(
            `SELECT id, name, description, created_at FROM reference_tables WHERE id = ?`,
            [newTableId],
            'Fetch newly created reference table'
        );

        res.status(201).json(newTable);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function updateReferenceTable(req, res) {
    const { id } = req.params;
    const { name, description } = req.body;

    if (!name && description === undefined) {
        return res.status(400).send('At least one field (name or description) must be provided for update.');
    }

    let updateFields = [];
    let updateValues = [];

    if (name) {
        updateFields.push('name = ?');
        updateValues.push(name);
    }

    if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
    }

    try {
        await timedQuery(
            `UPDATE reference_tables SET ${updateFields.join(', ')} WHERE id = ?`,
            [...updateValues, id],
            'Update reference table'
        );

        const updatedTable = await timedQuery(
            `SELECT id, name, description, created_at FROM reference_tables WHERE id = ?`,
            [id],
            'Fetch updated reference table'
        );

        if (updatedTable.length === 0) {
            return res.status(404).send('Reference table not found.');
        }

        res.json(updatedTable);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function deleteReferenceTable(req, res) {
    const { id } = req.params;

    try {
        const result = await timedQuery(
            `DELETE FROM reference_tables WHERE id = ?`,
            [id],
            'Delete reference table'
        );

        if (result.affectedRows === 0) {
            return res.status(404).send('Reference table not found.');
        }

        res.status(204).send(); // No Content
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function getReferenceTableRaw(req, res) {
    const { id } = req.params;

    try {
        // Get table details
        const table = await timedQuery(
            `SELECT id, name, description FROM reference_tables WHERE id = ?`,
            [id],
            'Fetch reference table details'
        );

        if (table.length === 0) {
            return res.status(404).send('Reference table not found.');
        }

        // Get columns in order
        const columns = await timedQuery(
            `SELECT id, header, column_index, span FROM reference_table_columns WHERE table_id = ? ORDER BY column_index`,
            [id],
            'Fetch reference table columns'
        );

        // Get all rows
        const rows = await timedQuery(
            `SELECT id, row_index, label FROM reference_table_rows WHERE table_id = ? ORDER BY row_index`,
            [id],
            'Fetch reference table rows'
        );

        // Get all cells
        const cells = await timedQuery(
            `SELECT row_id, column_id, value, col_span, row_span FROM reference_table_cells WHERE row_id IN (?)`,
            [rows.map(r => r.id).join(',')],
            'Fetch reference table cells'
        );

        const colMap = Object.fromEntries(columns.map(col => [col.id, col]));
        const rowMap = Object.fromEntries(rows.map(row => [row.id, row]));

        const structuredRows = rows.map(row => ({
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

        res.json({
            table: table,
            headers: columns,
            rows: structuredRows,
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
} 