import { Response } from 'express';
import type { Prisma } from '@shared/prisma-client';

import { referenceTableService } from './referenceTableService';
import type {
    ReferenceTableRequest,
    ReferenceTableCreateRequest,
    ReferenceTableUpdateRequest,
    ReferenceTableDeleteRequest,
    ReferenceTableGetRequest,
    ReferenceTableData
} from './types';
import { CreateReferenceTableSchema, UpdateReferenceTableSchema } from '@shared/schema';

export async function GetReferenceTables(req: ReferenceTableRequest, res: Response): Promise<void> {
    try {
        const result = await referenceTableService.getAllReferenceTables(req.query);
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error fetching reference tables:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reference tables',
        });
    }
}

export async function CreateReferenceTable(req: ReferenceTableCreateRequest, res: Response): Promise<void> {
    try {
        // Validate the request data using Zod schema
        const validatedData = CreateReferenceTableSchema.parse(req.body);

        const result = await referenceTableService.createReferenceTable(validatedData as Prisma.ReferenceTableCreateInput);
        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error creating reference table:', error);
        if (error instanceof Error) {
            res.status(400).json({
                success: false,
                error: error.message,
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to create reference table',
            });
        }
    }
}

export async function UpdateReferenceTable(req: ReferenceTableUpdateRequest, res: Response): Promise<void> {
    const { id } = req.params;
    try {
        // Validate the request data using Zod schema
        const validatedData = UpdateReferenceTableSchema.parse(req.body);

        const result = await referenceTableService.updateReferenceTable(id, validatedData as Prisma.ReferenceTableUpdateInput);
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error updating reference table:', error);
        if (error instanceof Error) {
            if (error.message.includes('Record to update not found')) {
                res.status(404).json({
                    success: false,
                    error: 'Reference table not found',
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: error.message,
                });
            }
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to update reference table',
            });
        }
    }
}

export async function DeleteReferenceTable(req: ReferenceTableDeleteRequest, res: Response): Promise<void> {
    const { id } = req.params;
    try {
        const result = await referenceTableService.deleteReferenceTable(id);
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error deleting reference table:', error);
        if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
            res.status(404).json({
                success: false,
                error: 'Reference table not found',
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Failed to delete reference table',
            });
        }
    }
}

export async function GetReferenceTable(req: ReferenceTableGetRequest, res: Response): Promise<void> {
    const { identifier } = req.params;
    try {
        const tableData = await referenceTableService.getReferenceTableData(identifier);
        if (!tableData) {
            res.status(404).json({
                success: false,
                error: 'Reference table not found',
            });
            return;
        }
        res.json({
            success: true,
            data: tableData,
        });
    } catch (error) {
        console.error('Error fetching reference table:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch reference table',
        });
    }
}

export async function Resolve(identifiers: string[]): Promise<ReferenceTableData[]> {
    return await referenceTableService.resolve(identifiers);
} 