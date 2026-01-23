import type { Response, NextFunction } from 'express';

import { ValidatedBodyT } from '@/util/validated-types';
import type { UpdateStateValueRequest, UpdateStateValueResponse } from '@shared/schema';

import { StateUpdateService } from './StateUpdateService';

/**
 * Generic controller for updating state values by path.
 * 
 * Works with all draft types (class, race, feature, character) using a unified
 * path-based update system. The draft type and ID are provided in the request body.
 * 
 * **Request Body**:
 * - `draftType`: Numeric DraftType enum value (e.g., DraftType.Class = 1)
 * - `id`: Draft ID (use 0 for new drafts)
 * - `path`: Field path using dot notation (e.g., 'name', 'entities.0.type', 'sourceBookInfo.editionId')
 * - `value`: The new value (string or number)
 * 
 * Examples:
 * - Update name: `{ draftType: 1, id: 123, path: 'name', value: 'Wizard' }`
 * - Update nested field: `{ draftType: 3, id: 456, path: 'entities.0.type', value: 1 }`
 * 
 * **Type Safety Note**: 
 * - Uses `ValidatedBodyT` from `@/util/validated-types` for proper type safety with `buildValidatedRouter`
 * - NEVER manually type `Request<>` - always use validated types from `@/util/validated-types`
 * - The body type `UpdateStateValueRequest` comes from `@shared/schema` and matches `UpdateStateValueSchema`
 * 
 * @param req - Express request with validated body containing draftType, id, path, and value
 * @param res - Express response
 * @param _next - Express next function
 */
export async function UpdateStateValue(
    req: ValidatedBodyT<UpdateStateValueRequest, UpdateStateValueResponse>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const { draftType, id, path, value } = req.body;

        // All entities use the generic StateUpdateService
        const updateService = new StateUpdateService();

        // Update value at path
        await updateService.updateStateValue(
            draftType,
            id,
            path,
            value,
            userId
        );

        res.json({
            success: true,
        } satisfies UpdateStateValueResponse);
    } catch (error) {
        console.error('Error updating state value:', error);

        // Handle lock errors specifically
        if (error instanceof Error && error.message.includes('locked by another user')) {
            res.status(409).json({
                error: error.message
            });
            return;
        }

        res.status(500).json({
            error: 'Failed to update state value',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
