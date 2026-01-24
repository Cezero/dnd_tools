import { prisma } from '@/lib/prisma';
import {
    ReferenceTableDataResponse,
    ReferenceTableSlugParamRequest,
    ReferenceTableUpdate,
    GetAllReferenceTablesResponse,
    UpdateResponse,
    CreateResponse,
    ReferenceTableSummary
} from '@shared/schema';

import { ReferenceTableService } from './types';

/**
 * Reference Table Service
 * 
 * Provides reference table management for dynamic reference tables containing structured
 * game data (encounter tables, treasure tables, etc.). Supports complex nested structures
 * (Table → Columns → Rows → Cells) with index-based ordering and transaction-based management.
 * 
 * Key Features:
 * - Complex nested structure management (Table → Columns → Rows → Cells)
 * - Index-based ordering for columns and rows
 * - Slug-based identification for URL-friendly references
 * - Transaction-based nested data creation and updates
 * - Delete/recreate pattern for updates to ensure data consistency
 * 
 * Integration Points:
 * - Frontend Markdown Rendering: Tables embedded in markdown via {table: slug} syntax
 * - Table preloading and caching in frontend
 * 
 * @see ReferenceTableService interface for method signatures
 * @see referenceTableController for request handling
 * @see referenceTableRoutes for API endpoints
 */
export const referenceTableService: ReferenceTableService = {
    async getAllReferenceTables(): Promise<GetAllReferenceTablesResponse> {
        const [tables] = await Promise.all([
            prisma.referenceTable.findMany({
                include: {
                    _count: {
                        select: {
                            rows: true,
                            columns: true,
                        },
                    },
                },
            }),
            prisma.referenceTable.count(),
        ]);

        const results: GetAllReferenceTablesResponse['results'] = tables.map(table => ({
            ...table,
            rows: table._count.rows,
            columns: table._count.columns,
        }));

        return {
            total: tables.length,
            results: results
        };
    },

    async getReferenceTableData(slug: ReferenceTableSlugParamRequest): Promise<ReferenceTableDataResponse | null> {
        const table = await prisma.referenceTable.findUnique({
            where: { slug: slug.slug },
            include: {
                columns: {
                    orderBy: {
                        index: 'asc',
                    }
                },
                rows: {
                    orderBy: {
                        index: 'asc',
                    },
                    include: {
                        cells: {
                            orderBy: {
                                column: {
                                    index: 'asc',
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!table) {
            return null;
        }

        return table;
    },

    async createReferenceTable(data: ReferenceTableUpdate): Promise<CreateResponse> {
        return prisma.$transaction(async (tx) => {
            // 1. Create ReferenceTable main fields
            const createdTable = await tx.referenceTable.create({
                data: {
                    ...data,
                    columns: {
                        create: data.columns?.map(col => ({
                            ...col,
                        }))
                    },
                    rows: {
                        create: data.rows?.map(row => ({
                            ...row,
                            cells: row.cells ? {
                                create: row.cells.map(cell => ({
                                    ...cell,
                                })) ?? null,
                            } : undefined,
                        }))
                    },
                }
            });

            return { id: createdTable.slug, message: 'Reference table created successfully' };
        });
    },
    // 
    /**
     * Updates a reference table using delete/recreate pattern for all nested data.
     * 
     * Uses delete/recreate pattern to ensure data consistency. Deletes all nested data
     * (cells, rows, columns) before recreating, ensuring clean state. This pattern
     * simplifies update logic compared to individual add/remove operations and guarantees
     * data consistency across all table components.
     * 
     * Update Process:
     * 1. Updates table main fields (name, description)
     * 2. Deletes all existing nested data (cells, rows, columns)
     * 3. Recreates columns if provided
     * 4. Recreates rows and cells if provided (creates each row individually, then cells)
     * 
     * @param slug - ReferenceTableSlugParamRequest with table slug
     * @param data - ReferenceTableUpdate with updated table data
     * @returns Promise resolving to UpdateResponse with success message
     */
    async updateReferenceTable(slug: ReferenceTableSlugParamRequest, data: ReferenceTableUpdate): Promise<UpdateResponse> {
        return prisma.$transaction(async (tx) => {
            const tableSlug = slug.slug;

            // 1. Update ReferenceTable main fields
            await tx.referenceTable.update({
                where: { slug: tableSlug },
                data: {
                    name: data.name,
                    description: data.description,
                },
            });

            // 2. Delete old rows/cells/columns
            await tx.referenceTableCell.deleteMany({ where: { tableSlug } });
            await tx.referenceTableRow.deleteMany({ where: { tableSlug } });
            await tx.referenceTableColumn.deleteMany({ where: { tableSlug } });

            // 3. Recreate columns
            if (data.columns?.length) {
                await tx.referenceTableColumn.createMany({
                    data: data.columns.map(col => ({ ...col, tableSlug })),
                });
            }

            // 4. Recreate rows and cells
            if (data.rows?.length) {
                for (const row of data.rows) {
                    await tx.referenceTableRow.create({
                        data: {
                            tableSlug,
                            index: row.index,
                        },
                    });

                    if (row.cells?.length) {
                        await tx.referenceTableCell.createMany({
                            data: row.cells.map(cell => ({
                                ...cell,
                                tableSlug,
                                rowIndex: row.index,
                            })),
                        });
                    }
                }
            }

            return { message: 'Reference table updated successfully' };
        });
    },


    async deleteReferenceTable(slug: ReferenceTableSlugParamRequest): Promise<UpdateResponse> {
        await prisma.referenceTable.delete({
            where: { slug: slug.slug },
        });
        return { message: 'Reference table deleted successfully' };
    },

    async getReferenceTableSummary(slug: ReferenceTableSlugParamRequest): Promise<ReferenceTableSummary | null> {
        const table = await prisma.referenceTable.findUnique({
            where: { slug: slug.slug },
            include: {
                _count: {
                    select: {
                        rows: true,
                        columns: true,
                    },
                },
            },
        });
        if (!table) {
            return null;
        }
        return {
            ...table,
            rows: table._count.rows,
            columns: table._count.columns,
        };
    },
};
