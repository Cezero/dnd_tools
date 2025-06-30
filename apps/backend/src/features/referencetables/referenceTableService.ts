import { PrismaClient, Prisma } from '@shared/prisma-client';

import type { ReferenceTableData, ReferenceTableService } from './types';

const prisma = new PrismaClient();

export const referenceTableService: ReferenceTableService = {
    async getAllReferenceTables(query) {
        const { page = '1', limit = '25', sort = 'name', order = 'asc', name = '', slug = '' } = query;
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

        return {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            results: tables,
        };
    },

    async getReferenceTableData(identifier: string | number): Promise<ReferenceTableData | null> {
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
        let cells: Array<Prisma.ReferenceTableCellGetPayload<{
            include: {
                column: true;
                row: true;
            };
        }>> = [];

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
            cells: [] as Array<Prisma.ReferenceTableCellGetPayload<{
                include: {
                    column: true;
                    row: true;
                };
            }> | null>,
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
                    structuredRows[rowIndex].cells.push(null);
                }

                structuredRows[rowIndex].cells[colIndex] = cell;
            }
        });

        return {
            table: table,
            headers: columns,
            rows: structuredRows,
        };
    },

    async createReferenceTable(data: Prisma.ReferenceTableCreateInput) {
        // Use Prisma's nested input types to handle the complex relationships
        const newTable = await prisma.referenceTable.create({
            data,
            include: {
                columns: true,
                rows: {
                    include: {
                        cells: {
                            include: {
                                column: true,
                            }
                        }
                    }
                }
            }
        });

        return { id: newTable.slug, message: 'Reference table created successfully' };
    },

    async updateReferenceTable(slug: string, data: Prisma.ReferenceTableUpdateInput) {
        // Use Prisma's nested input types for complex update operations
        await prisma.referenceTable.update({
            where: { slug },
            data,
        });

        return { message: 'Reference table updated successfully' };
    },

    async deleteReferenceTable(slug) {
        await prisma.referenceTable.delete({
            where: { slug },
        });
        return { message: 'Reference table deleted successfully' };
    },

    async resolve(identifiers: string[]): Promise<ReferenceTableData[]> {
        const results: ReferenceTableData[] = [];

        for (const identifier of identifiers) {
            const tableData = await this.getReferenceTableData(identifier);
            if (tableData) {
                results.push(tableData);
            }
        }

        return results;
    },
}; 