import { describe, it, expect, beforeEach, vi } from 'vitest';
import { referenceTableService } from './referenceTableService';
import type { Prisma, ReferenceTable, ReferenceTableColumn, ReferenceTableCell } from '@shared/prisma-client';

// Mock Prisma client
vi.mock('@shared/prisma-client', () => ({
    PrismaClient: vi.fn().mockImplementation(() => ({
        referenceTable: {
            findMany: vi.fn(),
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
            count: vi.fn(),
        },
        referenceTableColumn: {
            findMany: vi.fn(),
            create: vi.fn(),
            deleteMany: vi.fn(),
        },
        referenceTableRow: {
            findMany: vi.fn(),
            create: vi.fn(),
            deleteMany: vi.fn(),
        },
        referenceTableCell: {
            findMany: vi.fn(),
            create: vi.fn(),
            deleteMany: vi.fn(),
        },
        $transaction: vi.fn(),
    })),
    Prisma: {
        ReferenceTableWhereInput: {},
    },
}));

describe('ReferenceTableService', () => {
    let mockPrisma: any;

    beforeEach(() => {
        vi.clearAllMocks();
        const { PrismaClient } = require('@shared/prisma-client');
        mockPrisma = PrismaClient;
    });

    describe('getAllReferenceTables', () => {
        it('should return paginated reference tables with default parameters', async () => {
            const mockTables = [
                {
                    slug: 'test-table',
                    name: 'Test Table',
                    description: 'Test description',
                    _count: { rows: 5, columns: 3 },
                },
            ];

            const mockInstance = new mockPrisma();
            mockInstance.referenceTable.findMany.mockResolvedValue(mockTables);
            mockInstance.referenceTable.count.mockResolvedValue(1);

            const result = await referenceTableService.getAllReferenceTables({});

            expect(result).toEqual({
                page: 1,
                limit: 25,
                total: 1,
                results: mockTables,
            });
            expect(mockInstance.referenceTable.findMany).toHaveBeenCalledWith({
                where: {},
                skip: 0,
                take: 25,
                orderBy: { name: 'asc' },
                include: {
                    _count: {
                        select: {
                            rows: true,
                            columns: true,
                        },
                    },
                },
            });
        });

        it('should apply name filter correctly', async () => {
            const mockInstance = new mockPrisma();
            mockInstance.referenceTable.findMany.mockResolvedValue([]);
            mockInstance.referenceTable.count.mockResolvedValue(0);

            await referenceTableService.getAllReferenceTables({ name: 'test' });

            expect(mockInstance.referenceTable.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { name: { contains: 'test' } },
                })
            );
        });

        it('should apply slug filter correctly', async () => {
            const mockInstance = new mockPrisma();
            mockInstance.referenceTable.findMany.mockResolvedValue([]);
            mockInstance.referenceTable.count.mockResolvedValue(0);

            await referenceTableService.getAllReferenceTables({ slug: 'test-slug' });

            expect(mockInstance.referenceTable.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { slug: { contains: 'test-slug' } },
                })
            );
        });

        it('should handle custom pagination parameters', async () => {
            const mockInstance = new mockPrisma();
            mockInstance.referenceTable.findMany.mockResolvedValue([]);
            mockInstance.referenceTable.count.mockResolvedValue(0);

            await referenceTableService.getAllReferenceTables({
                page: '2',
                limit: '10',
                sort: 'slug',
                order: 'desc',
            });

            expect(mockInstance.referenceTable.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    skip: 10,
                    take: 10,
                    orderBy: { slug: 'desc' },
                })
            );
        });

        it('should handle invalid sort parameters gracefully', async () => {
            const mockInstance = new mockPrisma();
            mockInstance.referenceTable.findMany.mockResolvedValue([]);
            mockInstance.referenceTable.count.mockResolvedValue(0);

            await referenceTableService.getAllReferenceTables({
                sort: 'invalid',
                order: 'invalid',
            });

            expect(mockInstance.referenceTable.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    orderBy: { name: 'asc' },
                })
            );
        });

        it('should handle database errors gracefully', async () => {
            const mockInstance = new mockPrisma();
            mockInstance.referenceTable.findMany.mockRejectedValue(new Error('Database error'));

            await expect(
                referenceTableService.getAllReferenceTables({})
            ).rejects.toThrow('Database error');
        });
    });

    describe('getReferenceTableData', () => {
        it('should return null for numeric identifiers', async () => {
            const result = await referenceTableService.getReferenceTableData('123');
            expect(result).toBeNull();
        });

        it('should return null for non-existent table', async () => {
            const mockInstance = new mockPrisma();
            mockInstance.referenceTable.findUnique.mockResolvedValue(null);

            const result = await referenceTableService.getReferenceTableData('non-existent');
            expect(result).toBeNull();
        });

        it('should return complete table data for existing table', async () => {
            const mockTable: ReferenceTable = {
                slug: 'test-table',
                name: 'Test Table',
                description: 'Test description',
            };

            const mockColumns: ReferenceTableColumn[] = [
                { id: 1, tableSlug: 'test-table', columnIndex: 0, header: 'Column 1', alignment: 'left', span: null },
                { id: 2, tableSlug: 'test-table', columnIndex: 1, header: 'Column 2', alignment: 'center', span: null },
            ];

            const mockRows = [
                { id: 1, tableSlug: 'test-table', rowIndex: 0, label: 'Row 1' },
                { id: 2, tableSlug: 'test-table', rowIndex: 1, label: 'Row 2' },
            ];

            const mockCells: Array<Prisma.ReferenceTableCellGetPayload<{
                include: {
                    column: true;
                    row: true;
                };
            }>> = [
                    {
                        id: 1,
                        rowId: 1,
                        columnId: 1,
                        value: 'Cell 1-1',
                        colSpan: 1,
                        rowSpan: 1,
                        column: mockColumns[0],
                        row: mockRows[0],
                    },
                    {
                        id: 2,
                        rowId: 1,
                        columnId: 2,
                        value: 'Cell 1-2',
                        colSpan: 1,
                        rowSpan: 1,
                        column: mockColumns[1],
                        row: mockRows[0],
                    },
                ];

            const mockInstance = new mockPrisma();
            mockInstance.referenceTable.findUnique.mockResolvedValue(mockTable);
            mockInstance.referenceTableColumn.findMany.mockResolvedValue(mockColumns);
            mockInstance.referenceTableRow.findMany.mockResolvedValue(mockRows);
            mockInstance.referenceTableCell.findMany.mockResolvedValue(mockCells);

            const result = await referenceTableService.getReferenceTableData('test-table');

            expect(result).toEqual({
                table: mockTable,
                headers: mockColumns,
                rows: [
                    {
                        id: 1,
                        rowIndex: 0,
                        label: 'Row 1',
                        cells: [mockCells[0], mockCells[1]],
                    },
                    {
                        id: 2,
                        rowIndex: 1,
                        label: 'Row 2',
                        cells: [],
                    },
                ],
            });
        });

        it('should handle empty rows correctly', async () => {
            const mockTable: ReferenceTable = { slug: 'test-table', name: 'Test Table', description: null };
            const mockColumns: ReferenceTableColumn[] = [];

            const mockInstance = new mockPrisma();
            mockInstance.referenceTable.findUnique.mockResolvedValue(mockTable);
            mockInstance.referenceTableColumn.findMany.mockResolvedValue(mockColumns);
            mockInstance.referenceTableRow.findMany.mockResolvedValue([]);

            const result = await referenceTableService.getReferenceTableData('test-table');

            expect(result).toEqual({
                table: mockTable,
                headers: mockColumns,
                rows: [],
            });
        });

        it('should handle database errors gracefully', async () => {
            const mockInstance = new mockPrisma();
            mockInstance.referenceTable.findUnique.mockRejectedValue(new Error('Database error'));

            await expect(
                referenceTableService.getReferenceTableData('test-table')
            ).rejects.toThrow('Database error');
        });
    });

    describe('createReferenceTable', () => {
        it('should create reference table with nested relationships', async () => {
            const createData: Prisma.ReferenceTableCreateInput = {
                name: 'Test Table',
                description: 'Test description',
                slug: 'test-table',
                columns: {
                    create: [
                        {
                            columnIndex: 0,
                            header: 'Column 1',
                            alignment: 'left',
                        },
                        {
                            columnIndex: 1,
                            header: 'Column 2',
                            alignment: 'center',
                        },
                    ],
                },
                rows: {
                    create: [
                        {
                            rowIndex: 0,
                            label: 'Row 1',
                            cells: {
                                create: [
                                    {
                                        value: 'Cell 1-1',
                                        colSpan: 1,
                                        rowSpan: 1,
                                        columnId: 1, // Use columnId instead of nested column
                                    },
                                ],
                            },
                        },
                    ],
                },
            };

            const mockCreatedTable = {
                slug: 'test-table',
                name: 'Test Table',
                description: 'Test description',
                columns: [],
                rows: [],
            };

            const mockInstance = new mockPrisma();
            mockInstance.referenceTable.create.mockResolvedValue(mockCreatedTable);

            const result = await referenceTableService.createReferenceTable(createData);

            expect(result).toEqual({
                id: 'test-table',
                message: 'Reference table created successfully',
            });
            expect(mockInstance.referenceTable.create).toHaveBeenCalledWith({
                data: createData,
                include: {
                    columns: true,
                    rows: {
                        include: {
                            cells: {
                                include: {
                                    column: true,
                                },
                            },
                        },
                    },
                },
            });
        });

        it('should handle database errors gracefully', async () => {
            const mockInstance = new mockPrisma();
            mockInstance.referenceTable.create.mockRejectedValue(new Error('Database error'));

            const createData: Prisma.ReferenceTableCreateInput = {
                name: 'Test Table',
                slug: 'test-table',
            };

            await expect(
                referenceTableService.createReferenceTable(createData)
            ).rejects.toThrow('Database error');
        });

        it('should handle Prisma constraint violations', async () => {
            const mockInstance = new mockPrisma();
            const constraintError = new Error('Unique constraint failed');
            constraintError.name = 'PrismaClientKnownRequestError';
            (constraintError as any).code = 'P2002';
            mockInstance.referenceTable.create.mockRejectedValue(constraintError);

            const createData: Prisma.ReferenceTableCreateInput = {
                name: 'Test Table',
                slug: 'test-table',
            };

            await expect(
                referenceTableService.createReferenceTable(createData)
            ).rejects.toThrow('Unique constraint failed');
        });
    });

    describe('updateReferenceTable', () => {
        it('should update reference table with nested relationships', async () => {
            const updateData: Prisma.ReferenceTableUpdateInput = {
                name: 'Updated Table',
                description: 'Updated description',
                slug: 'updated-table',
                columns: {
                    deleteMany: {},
                    create: [
                        {
                            columnIndex: 0,
                            header: 'Updated Column 1',
                            alignment: 'right',
                        },
                    ],
                },
                rows: {
                    deleteMany: {},
                    create: [
                        {
                            rowIndex: 0,
                            label: 'Updated Row 1',
                            cells: {
                                create: [
                                    {
                                        value: 'Updated Cell',
                                        colSpan: 2,
                                        rowSpan: 1,
                                        columnId: 1, // Use columnId instead of nested column
                                    },
                                ],
                            },
                        },
                    ],
                },
            };

            const mockInstance = new mockPrisma();
            mockInstance.referenceTable.update.mockResolvedValue({});

            const result = await referenceTableService.updateReferenceTable('test-table', updateData);

            expect(result).toEqual({
                message: 'Reference table updated successfully',
            });
            expect(mockInstance.referenceTable.update).toHaveBeenCalledWith({
                where: { slug: 'test-table' },
                data: updateData,
            });
        });

        it('should handle non-existent table update', async () => {
            const mockInstance = new mockPrisma();
            const notFoundError = new Error('Record to update not found');
            notFoundError.name = 'PrismaClientKnownRequestError';
            (notFoundError as any).code = 'P2025';
            mockInstance.referenceTable.update.mockRejectedValue(notFoundError);

            const updateData: Prisma.ReferenceTableUpdateInput = {
                name: 'Updated Table',
                slug: 'updated-table',
            };

            await expect(
                referenceTableService.updateReferenceTable('non-existent', updateData)
            ).rejects.toThrow('Record to update not found');
        });

        it('should handle database errors gracefully', async () => {
            const mockInstance = new mockPrisma();
            mockInstance.referenceTable.update.mockRejectedValue(new Error('Database error'));

            const updateData: Prisma.ReferenceTableUpdateInput = {
                name: 'Updated Table',
                slug: 'updated-table',
            };

            await expect(
                referenceTableService.updateReferenceTable('test-table', updateData)
            ).rejects.toThrow('Database error');
        });
    });

    describe('deleteReferenceTable', () => {
        it('should delete reference table successfully', async () => {
            const mockInstance = new mockPrisma();
            mockInstance.referenceTable.delete.mockResolvedValue({ slug: 'test-table' });

            const result = await referenceTableService.deleteReferenceTable('test-table');

            expect(result).toEqual({
                message: 'Reference table deleted successfully',
            });
            expect(mockInstance.referenceTable.delete).toHaveBeenCalledWith({
                where: { slug: 'test-table' },
            });
        });

        it('should handle non-existent table deletion', async () => {
            const mockInstance = new mockPrisma();
            const notFoundError = new Error('Record to delete does not exist');
            notFoundError.name = 'PrismaClientKnownRequestError';
            (notFoundError as any).code = 'P2025';
            mockInstance.referenceTable.delete.mockRejectedValue(notFoundError);

            await expect(
                referenceTableService.deleteReferenceTable('non-existent')
            ).rejects.toThrow('Record to delete does not exist');
        });

        it('should handle database errors gracefully', async () => {
            const mockInstance = new mockPrisma();
            mockInstance.referenceTable.delete.mockRejectedValue(new Error('Database error'));

            await expect(
                referenceTableService.deleteReferenceTable('test-table')
            ).rejects.toThrow('Database error');
        });
    });

    describe('resolve', () => {
        it('should resolve multiple identifiers successfully', async () => {
            const mockTableData1 = {
                table: { slug: 'table-1', name: 'Table 1', description: null },
                headers: [],
                rows: [],
            };

            const mockTableData2 = {
                table: { slug: 'table-2', name: 'Table 2', description: null },
                headers: [],
                rows: [],
            };

            // Mock the getReferenceTableData method
            const getReferenceTableDataSpy = vi.spyOn(referenceTableService, 'getReferenceTableData');
            getReferenceTableDataSpy
                .mockResolvedValueOnce(mockTableData1)
                .mockResolvedValueOnce(mockTableData2)
                .mockResolvedValueOnce(null); // Non-existent table

            const result = await referenceTableService.resolve(['table-1', 'table-2', 'non-existent']);

            expect(result).toEqual([mockTableData1, mockTableData2]);
            expect(getReferenceTableDataSpy).toHaveBeenCalledTimes(3);
            expect(getReferenceTableDataSpy).toHaveBeenCalledWith('table-1');
            expect(getReferenceTableDataSpy).toHaveBeenCalledWith('table-2');
            expect(getReferenceTableDataSpy).toHaveBeenCalledWith('non-existent');

            getReferenceTableDataSpy.mockRestore();
        });

        it('should return empty array for no identifiers', async () => {
            const result = await referenceTableService.resolve([]);
            expect(result).toEqual([]);
        });

        it('should handle errors in individual resolutions', async () => {
            const getReferenceTableDataSpy = vi.spyOn(referenceTableService, 'getReferenceTableData');
            getReferenceTableDataSpy.mockRejectedValue(new Error('Database error'));

            await expect(
                referenceTableService.resolve(['table-1'])
            ).rejects.toThrow('Database error');

            getReferenceTableDataSpy.mockRestore();
        });
    });
}); 