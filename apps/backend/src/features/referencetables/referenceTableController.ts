import { Request, Response } from 'express';
import { Prisma, PrismaClient, ReferenceTable, ReferenceTableCell } from '@shared/prisma-client';

const prisma = new PrismaClient();

// Define the return type for the complex object
export interface ReferenceTableData {
    table: ReferenceTable;
    headers: Array<{
        id: number;
        tableSlug: string;
        columnIndex: number;
        header: string;
        span: number | null;
        alignment: string | null;
    }>;
    rows: Array<{
        id: number;
        rowIndex: number;
        label: string | null;
        cells: (ReferenceTableCell | null)[];
    }>;
}

interface ReferenceTableRequest extends Request {
    query: {
        page?: string;
        limit?: string;
        sort?: string;
        order?: string;
        name?: string;
        slug?: string;
    };
}

interface ReferenceTableCreateRequest extends Request {
    body: {
        name: string;
        description?: string;
        slug: string;
        headers: Array<{
            header: string;
            alignment?: string;
        }>;
        rows: Array<Array<{
            column_index: number;
            value?: string;
            col_span?: number;
            row_span?: number;
        }>>;
    };
}

interface ReferenceTableUpdateRequest extends Request {
    params: { id: string };
    body: {
        name: string;
        description?: string;
        slug: string;
        headers: Array<{
            header: string;
            alignment?: string;
        }>;
        rows: Array<Array<{
            column_index: number;
            value?: string;
            col_span?: number;
            row_span?: number;
        }>>;
    };
}

interface ReferenceTableDeleteRequest extends Request {
    params: { id: string };
}

interface ReferenceTableGetRequest extends Request {
    params: { identifier: string };
}

export async function GetReferenceTableData(identifier: string | number): Promise<ReferenceTableData | null> {
    let table;

    // Determine if the identifier is a number (ID) or a string (slug)
    const isNumeric = !isNaN(Number(identifier));

    if (isNumeric) {
        // ReferenceTable doesn't have an id field, only slug
        return null;
    } else {
        table = await prisma.referenceTable.findUnique({
            where: { slug: identifier as string },
        });
    }

    if (!table) {
        return null;
    }

    const tableSlug = table.slug;

    // Get columns in order
    const columns = await prisma.referenceTableColumn.findMany({
        where: { tableSlug },
        orderBy: { columnIndex: 'asc' },
    });

    // Get all rows
    const tableRows = await prisma.referenceTableRow.findMany({
        where: { tableSlug },
        orderBy: { rowIndex: 'asc' },
    });

    // Get all cells with their related data
    let cells: ReferenceTableCell[] = [];
    if (tableRows.length > 0) {
        cells = await prisma.referenceTableCell.findMany({
            where: {
                rowId: {
                    in: tableRows.map(row => row.id),
                },
            },
            include: {
                column: true,
                row: true,
            },
        });
    }

    // Create maps for quick lookup
    const colMap = Object.fromEntries(columns.map(col => [col.id, col]));
    const rowMap = Object.fromEntries(tableRows.map(row => [row.id, row]));

    // Initialize structured rows with empty cells array
    const structuredRows = tableRows.map(row => ({
        id: row.id,
        rowIndex: row.rowIndex,
        label: row.label,
        cells: [] as (ReferenceTableCell | null)[],
    }));

    // Assign cells to their correct positions
    cells.forEach(cell => {
        const row = rowMap[cell.rowId];
        const col = colMap[cell.columnId];
        
        if (row && col) {
            const rowIndex = row.rowIndex;
            const colIndex = col.columnIndex;
            
            // Ensure the cells array is large enough
            while (structuredRows[rowIndex].cells.length <= colIndex) {
                structuredRows[rowIndex].cells.push(null as ReferenceTableCell | null);
            }
            
            structuredRows[rowIndex].cells[colIndex] = cell;
        }
    });

    return {
        table: table,
        headers: columns,
        rows: structuredRows,
    };
}

export async function GetReferenceTables(req: ReferenceTableRequest, res: Response): Promise<void> {
    const { page = '1', limit = '25', sort = 'name', order = 'asc', name = '', slug = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const allowedSorts = ['name', 'slug'];
    const sortBy = allowedSorts.includes(sort) ? sort : 'name';
    const sortOrder = order === 'desc' ? 'desc' : 'asc';

    // Build where clause for filtering
    const where: Prisma.ReferenceTableWhereInput = {};

    if (name) {
        where.name = { contains: name };
    }
    if (slug) {
        where.slug = { contains: slug };
    }

    try {
        const [tables, total] = await Promise.all([
            prisma.referenceTable.findMany({
                where,
                skip: offset,
                take: parseInt(limit),
                orderBy: { [sortBy]: sortOrder },
                include: {
                    _count: {
                        select: {
                            rows: true,
                            columns: true,
                        },
                    },
                },
            }),
            prisma.referenceTable.count({ where }),
        ]);

        // Transform the data to match the expected format
        const results = tables.map(table => ({
            id: table.slug,
            name: table.name,
            description: table.description,
            slug: table.slug,
            row_count: table._count.rows,
            column_count: table._count.columns,
        }));

        res.json({
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            results,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
}

export async function CreateReferenceTable(req: ReferenceTableCreateRequest, res: Response): Promise<void> {
    const { name, description, headers, rows: tableRows, slug } = req.body;

    if (!name) {
        res.status(400).send('Reference table name is required.');
        return;
    }

    if (!slug) {
        res.status(400).send('Reference table slug is required.');
        return;
    }

    try {
        const newTable = await prisma.$transaction(async (tx) => {
            // 1. Insert into reference_tables
            const newTableRecord = await tx.referenceTable.create({
                data: {
                    name,
                    description: description || null,
                    slug,
                },
            });

            // 2. Insert columns
            const columnMap = new Map(); // Map column_index to column_id
            for (const [index, headerData] of headers.entries()) {
                const column = await tx.referenceTableColumn.create({
                    data: {
                        tableSlug: newTableRecord.slug,
                        columnIndex: index,
                        header: headerData.header,
                        alignment: headerData.alignment,
                    },
                });
                columnMap.set(index, column.id);
            }

            // 3. Insert rows and cells
            for (const [rowIndex, rowCells] of tableRows.entries()) {
                const newRow = await tx.referenceTableRow.create({
                    data: {
                        tableSlug: newTableRecord.slug,
                        rowIndex,
                    },
                });

                for (const cell of rowCells) {
                    const colId = columnMap.get(cell.column_index);
                    if (colId !== undefined) {
                        await tx.referenceTableCell.create({
                            data: {
                                rowId: newRow.id,
                                columnId: colId,
                                value: cell.value || null,
                                colSpan: cell.col_span || 1,
                                rowSpan: cell.row_span || 1,
                            },
                        });
                    }
                }
            }

            return newTableRecord;
        });

        res.status(201).json({ id: newTable.slug, message: 'Reference table created successfully' });
    } catch (error) {
        console.error('Error creating reference table:', error);
        res.status(500).send('Server error');
    }
}

export async function UpdateReferenceTable(req: ReferenceTableUpdateRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { name, description, headers, rows: tableRows, slug } = req.body;

    if (!name) {
        res.status(400).send('Reference table name is required.');
        return;
    }

    if (!slug) {
        res.status(400).send('Reference table slug is required.');
        return;
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 1. Update the table
            await tx.referenceTable.update({
                where: { slug: id },
                data: {
                    name,
                    description: description || null,
                    slug,
                },
            });

            // 2. Delete existing columns, rows, and cells
            await tx.referenceTableCell.deleteMany({
                where: {
                    row: {
                        tableSlug: id,
                    },
                },
            });

            await tx.referenceTableRow.deleteMany({
                where: { tableSlug: id },
            });

            await tx.referenceTableColumn.deleteMany({
                where: { tableSlug: id },
            });

            // 3. Insert new columns
            const columnMap = new Map();
            for (const [index, headerData] of headers.entries()) {
                const column = await tx.referenceTableColumn.create({
                    data: {
                        tableSlug: id,
                        columnIndex: index,
                        header: headerData.header,
                        alignment: headerData.alignment,
                    },
                });
                columnMap.set(index, column.id);
            }

            // 4. Insert new rows and cells
            for (const [rowIndex, rowCells] of tableRows.entries()) {
                const newRow = await tx.referenceTableRow.create({
                    data: {
                        tableSlug: id,
                        rowIndex,
                    },
                });

                for (const cell of rowCells) {
                    const colId = columnMap.get(cell.column_index);
                    if (colId !== undefined) {
                        await tx.referenceTableCell.create({
                            data: {
                                rowId: newRow.id,
                                columnId: colId,
                                value: cell.value || null,
                                colSpan: cell.col_span || 1,
                                rowSpan: cell.row_span || 1,
                            },
                        });
                    }
                }
            }
        });

        res.status(200).json({ message: 'Reference table updated successfully' });
    } catch (error) {
        console.error('Error updating reference table:', error);
        if (error instanceof Error && error.message.includes('Record to update not found')) {
            res.status(404).send('Reference table not found');
        } else {
            res.status(500).send('Server error');
        }
    }
}

export async function DeleteReferenceTable(req: ReferenceTableDeleteRequest, res: Response): Promise<void> {
    const { id } = req.params;
    try {
        await prisma.referenceTable.delete({
            where: { slug: id },
        });
        res.status(200).send('Reference table deleted successfully');
    } catch (error) {
        console.error('Error deleting reference table:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            res.status(404).send('Reference table not found');
        } else {
            res.status(500).send('Server error');
        }
    }
}

export async function GetReferenceTable(req: ReferenceTableGetRequest, res: Response): Promise<void> {
    const { identifier } = req.params;
    try {
        const tableData = await GetReferenceTableData(identifier);
        if (!tableData) {
            res.status(404).send('Reference table not found');
            return;
        }
        res.json(tableData);
    } catch (error) {
        console.error('Error fetching reference table:', error);
        res.status(500).send('Server error');
    }
}

export async function Resolve(identifiers: string[]): Promise<ReferenceTableData[]> {
    const results: ReferenceTableData[] = [];

    for (const identifier of identifiers) {
        const tableData = await GetReferenceTableData(identifier);
        if (tableData) {
            results.push(tableData);
        }
    }

    return results;
} 