import { Response, NextFunction } from 'express';

import { PrismaClient } from '@shared/prisma-client';
import {
    VariantIdParamRequest,
    CreateClassVariantRequest,
    UpdateClassVariantRequest,
    UpdateResponse
} from '@shared/schema';

import { VariantClassService } from './variantClassService.js';
import {
    ValidatedParamsT,
    ValidatedBodyT,
    ValidatedParamsBodyT,
} from '../../util/validated-types';

const variantClassService = new VariantClassService(new PrismaClient());

/**
 * Create a new class variant
 */
export async function CreateVariant(req: ValidatedBodyT<CreateClassVariantRequest>, res: Response, _next: NextFunction) {
    try {
        await variantClassService.createVariant(req.body);
        res.status(201).json({ message: 'Class variant created successfully' });
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

/**
 * Update an existing class variant
 */
export async function UpdateVariant(req: ValidatedParamsBodyT<VariantIdParamRequest, UpdateClassVariantRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    try {
        await variantClassService.updateVariant(req.params.id, req.body);
        res.json({ message: 'Class variant updated successfully' });
    } catch (error) {
        if (error instanceof Error) {
            const statusCode = error.message.includes('not found') ? 404 : 400;
            res.status(statusCode).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

/**
 * Delete a class variant
 */
export async function DeleteVariant(req: ValidatedParamsT<VariantIdParamRequest>, res: Response, _next: NextFunction) {
    try {
        await variantClassService.deleteVariant(req.params.id);
        res.json({ message: 'Class variant deleted successfully' });
    } catch (error) {
        if (error instanceof Error) {
            const statusCode = error.message.includes('not found') ? 404 : 400;
            res.status(statusCode).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

/**
 * Get a variant by ID
 */
export async function GetVariant(req: ValidatedParamsT<VariantIdParamRequest>, res: Response, _next: NextFunction) {
    try {
        const variant = await variantClassService.getVariant(req.params.id);

        if (!variant) {
            res.status(404).json({ error: 'Variant not found' });
            return;
        }

        res.json(variant);
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
