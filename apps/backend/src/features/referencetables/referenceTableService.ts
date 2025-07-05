import { PrismaClient, Prisma } from '@shared/prisma-client';
import {
    ReferenceTableDataResponse,
    ReferenceTableQueryRequest,
    ReferenceTableQueryResponse,
    ReferenceTableSlugParamRequest,
    ReferenceTableUpdate,
    UpdateResponse,
    CreateResponse,
    ReferenceTableSummary
} from '@shared/schema';

import { ReferenceTableService } from './types';

const prisma = new PrismaClient();

export const referenceTableService: ReferenceTableService = {
    async getReferenceTables(query: ReferenceTableQueryRequest): Promise<ReferenceTableQueryResponse> {

        const offset = (query.page - 1) * query.limit;

        const allowedSorts = ['name', 'slug'];
        const sortBy = allowedSorts.includes(query.sort) ? query.sort : 'name';
        const sortOrder = query.order === 'desc' ? 'desc' : 'asc';

        // Build where clause for filtering
        const where: Prisma.ReferenceTableWhereInput = {};

        if (query.name) {
            where.name = { contains: query.name };
        }
        if (query.slug) {
            where.slug = { contains: query.slug };
        }

        const [tables, total] = await Promise.all([
            prisma.referenceTable.findMany({
                where,
                skip: offset,
                take: query.limit,
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

        const results: ReferenceTableQueryResponse['results'] = tables.map(table => ({
            ...table,
            rows: table._count.rows,
            columns: table._count.columns,
        }));

        return {
            page: query.page,
            limit: query.limit,
            total,
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


    async deleteReferenceTable(slug: ReferenceTableSlugParamRequest) {
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
    }
};