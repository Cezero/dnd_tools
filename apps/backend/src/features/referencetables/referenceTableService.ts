import { PrismaClient, Prisma } from '@shared/prisma-client';
import {
    CreateReferenceTableRequest,
    ReferenceTableDataResponse,
    ReferenceTableIdentifierRequest,
    ReferenceTableQueryRequest,
    ReferenceTableQueryResponse,
    UpdateReferenceTableRequest
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

        return {
            page: query.page,
            limit: query.limit,
            total,
            results: tables
        };
    },

    async getReferenceTableData(identifier: ReferenceTableIdentifierRequest): Promise<ReferenceTableDataResponse | null> {
        const table = await prisma.referenceTable.findUnique({
            where: { slug: identifier.identifier },
            include: {
                columns: {
                    orderBy: {
                        columnIndex: 'asc',
                    }
                },
                rows: {
                    orderBy: {
                        rowIndex: 'asc',
                    },
                    include: {
                        cells: {
                            orderBy: {
                                column: {
                                    columnIndex: 'asc',
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

    async createReferenceTable(data: CreateReferenceTableRequest): Promise<{ id: string; message: string }> {
        return prisma.$transaction(async (tx) => {
            // 1. Create ReferenceTable main fields
            const createdTable = await tx.referenceTable.create({
                data: {
                    ...data,
                    columns: {
                        create: data.columns?.map(col => ({
                            ...col,
                            tableSlug: data.slug,
                        }))
                    },
                    rows: {
                        create: data.rows?.map(row => ({
                            ...row,
                            tableSlug: data.slug,
                        }))
                    },
                    cells: {
                        create: data.cells?.map(cell => ({
                            ...cell,
                            tableSlug: data.slug,
                        }))
                    }
                }
            });

            return { id: createdTable.slug, message: 'Reference table created successfully' };
        });
    },

    async updateReferenceTable(identifier: ReferenceTableIdentifierRequest, data: UpdateReferenceTableRequest) {
        return prisma.$transaction(async (tx) => {
            // 1. Update ReferenceTable main fields
            const _updatedTable = await tx.referenceTable.update({
                where: { slug: identifier.identifier },
                data: {
                    name: data.name,
                    description: data.description,
                },
            });

            // 2. Delete existing columns
            if (data.columns) {
                await tx.referenceTableColumn.deleteMany({
                    where: {
                        tableSlug: identifier.identifier,
                    }
                });
            
                // 3. Create new columns
                for (const col of data.columns) {
                    await tx.referenceTableColumn.create({
                        data: {
                            tableSlug: identifier.identifier,
                            columnIndex: col.columnIndex,
                            header: col.header,
                            span: col.span ?? null,
                            alignment: col.alignment ?? null,
                        },
                    });
                }
            }

            // 4. Delete existing rows
            if (data.rows) {
            await tx.referenceTableRow.deleteMany({
                where: {
                    tableSlug: identifier.identifier,
                    }
                });

                // 5. Create new rows
                for (const row of data.rows) {
                    await tx.referenceTableRow.create({
                        data: {
                            tableSlug: identifier.identifier,
                            rowIndex: row.rowIndex,
                            label: row.label ?? null,
                        },
                    });
                }
            }

            // 6. Delete existing cells
            if (data.cells) {
            await tx.referenceTableCell.deleteMany({
                where: {
                    tableSlug: identifier.identifier,
                    }
                });

                // 7. Create new cells
                for (const cell of data.cells) {
                    await tx.referenceTableCell.create({
                        data: {
                            tableSlug: identifier.identifier,
                            rowId: cell.rowId,
                            columnId: cell.columnId,
                            value: cell.value ?? null,
                            colSpan: cell.colSpan ?? null,
                            rowSpan: cell.rowSpan ?? null,
                        },
                    });
                }
            }

            return { message: 'Reference table updated successfully' };
        });
    },

    async deleteReferenceTable(identifier: ReferenceTableIdentifierRequest) {
        await prisma.referenceTable.delete({
            where: { slug: identifier.identifier },
        });
        return { message: 'Reference table deleted successfully' };
    }
};