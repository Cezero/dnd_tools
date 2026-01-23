import type { Response, NextFunction } from 'express';
import { z } from 'zod';

import { ValidatedBodyT } from '@/util/validated-types';
import type {
    DraftRefRequest,
    UpdateStateValueRequest,
    UpdateStateValueResponse,
    StartEditingResponse,
    DraftSaveResponse,
    CancelEditingResponse,
} from '@shared/schema';
import { DraftRefRequestSchema, UpdateStateValueSchema } from '@shared/schema';
import { DraftType } from '@shared/static-data';

import { DraftLockService } from './DraftLockService';
import { getDraftConfig, isValidDraftType } from './draftRegistry';
import { DraftStateService } from './DraftStateService';
import { StateUpdateService } from './StateUpdateService';
import { UserSessionService } from '../session/UserSessionService';
import { ValidationErrorWithPaths } from '../utils';

// Initialize services (singleton pattern)
let draftLockServiceInstance: DraftLockService | null = null;
let draftStateServiceInstance: DraftStateService | null = null;
let userSessionServiceInstance: UserSessionService | null = null;
let stateUpdateServiceInstance: StateUpdateService | null = null;

function getDraftLockService(): DraftLockService {
    if (!draftLockServiceInstance) {
        draftLockServiceInstance = new DraftLockService();
    }
    return draftLockServiceInstance;
}

function getDraftStateService(): DraftStateService {
    if (!draftStateServiceInstance) {
        draftStateServiceInstance = new DraftStateService();
    }
    return draftStateServiceInstance;
}

function getUserSessionService(): UserSessionService {
    if (!userSessionServiceInstance) {
        userSessionServiceInstance = new UserSessionService();
    }
    return userSessionServiceInstance;
}

function getStateUpdateService(): StateUpdateService {
    if (!stateUpdateServiceInstance) {
        stateUpdateServiceInstance = new StateUpdateService();
    }
    return stateUpdateServiceInstance;
}

/**
 * Start editing a draft.
 * 
 * Acquires a lock on the draft, adds it to the user's editing list, and
 * initializes/loads the draft state.
 * 
 * **Type Safety Note**: 
 * - Uses `ValidatedBodyT` from `@/util/validated-types` for proper type safety with `buildValidatedRouter`
 * - NEVER manually type `Request<>` - always use validated types from `@/util/validated-types`
 * - The body type `DraftRefRequest` comes from `@shared/schema` and matches `DraftRefRequestSchema`
 * 
 * @param req - Express request with validated draftType and id in body
 * @param res - Express response
 * @param _next - Express next function
 */
export async function StartDraftEditing(
    req: ValidatedBodyT<DraftRefRequest, StartEditingResponse>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const { draftType, id: entityId } = req.body;

        // Validate draft type
        if (!isValidDraftType(draftType)) {
            res.status(400).json({ error: `Invalid draft type: ${draftType}` });
            return;
        }

        const lockService = getDraftLockService();
        const stateService = getDraftStateService();
        const userSessionService = getUserSessionService();
        const draftConfig = getDraftConfig(draftType);

        // For new drafts (id = 0), mint a unique negative draft ID and initialize state.
        if (entityId === 0) {
            if (draftType === DraftType.Character) {
                res.status(400).json({ error: 'DraftType.Character does not support startEditing(id=0).' });
                return;
            }

            const mintDraftId = (): number => {
                // `Date.now() * 1000` keeps us within Number.MAX_SAFE_INTEGER; add a small random component for same-ms collisions.
                const seed = Date.now() * 1000 + Math.floor(Math.random() * 1000);
                return -Math.floor(seed);
            };

            let draftId = mintDraftId();
            for (let attempt = 0; attempt < 5; attempt += 1) {
                const existingState = await stateService.getState(draftType, draftId);
                const lockedBy = await lockService.checkLock(draftType, draftId);
                if (!existingState && lockedBy === null) {
                    break;
                }
                draftId = mintDraftId();
            }

            const lockAcquired = await lockService.acquireLock(draftType, draftId, userId);
            if (!lockAcquired) {
                const lockedBy = await lockService.checkLock(draftType, draftId);
                res.status(409).json({
                    error: `Draft type ${draftType} is locked by another user`,
                    lockedBy: lockedBy || undefined
                });
                return;
            }

            try {
                await userSessionService.setEditingEntity(userId, draftType, draftId);
                const initialState = await draftConfig.getInitialCreateState(draftId, userId);
                await stateService.setState(draftType, draftId, initialState);

                res.json({
                    success: true,
                    draftType: draftType,
                    id: draftId,
                });
                return;
            } catch (error) {
                await lockService.releaseLock(draftType, draftId, userId);
                await userSessionService.clearEditingEntity(userId, draftType, draftId);
                throw error;
            }
        }

        // Acquire lock for existing drafts
        const lockAcquired = await lockService.acquireLock(draftType, entityId, userId);
        if (!lockAcquired) {
            const lockedBy = await lockService.checkLock(draftType, entityId);
            res.status(409).json({
                error: `Draft type ${draftType} is locked by another user`,
                lockedBy: lockedBy || undefined
            });
            return;
        }

        try {
            // Add to user's editing list
            await userSessionService.setEditingEntity(userId, draftType, entityId);

            // Get or initialize draft state
            let entityState = await stateService.getState(draftType, entityId);
            if (!entityState) {
                // Initialize from database using draft config's getInitialState
                const initialState = await draftConfig.getInitialState(entityId);
                await stateService.setState(draftType, entityId, initialState);
                entityState = initialState;
            }

            // For character, trigger resolution and publish via WebSocket
            if (draftType === DraftType.Character && draftConfig.onStateUpdate) {
                await draftConfig.onStateUpdate(entityId, entityState as unknown, userId);
            }

            res.json({
                success: true,
                draftType: draftType,
                id: entityId,
            });
        } catch (error) {
            // If anything fails after acquiring lock, release it
            await lockService.releaseLock(draftType, entityId, userId);
            await userSessionService.clearEditingEntity(userId, draftType, entityId);
            throw error;
        }
    } catch (error) {
        console.error('Error starting draft editing:', error);
        res.status(500).json({
            error: 'Failed to start draft editing',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Update draft value by path.
 * 
 * This is an alias for UpdateStateValue for consistency with the generic draft API.
 * Both functions do the same thing - update a value at a path in a draft's state.
 * 
 * Uses the generic path-based update system. No validation is performed during the update;
 * validation only occurs when the draft is saved.
 * 
 * **Type Safety Note**: 
 * - Uses `ValidatedBodyT` from `@/util/validated-types` for proper type safety with `buildValidatedRouter`
 * - NEVER manually type `Request<>` - always use validated types from `@/util/validated-types`
 * - The body type `UpdateStateValueRequest` comes from `@shared/schema` and matches `UpdateStateValueSchema`
 * 
 * @param req - Express request with validated draftType, id, path, and value in body
 * @param res - Express response
 * @param _next - Express next function
 */
export async function UpdateDraftValue(
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

        const { action, draftType, id: entityId, path, value } = req.body;

        // Validate draft type
        if (!isValidDraftType(draftType)) {
            res.status(400).json({ error: `Invalid draft type: ${draftType}` });
            return;
        }

        const updateService = getStateUpdateService();
        const draftConfig = getDraftConfig(draftType);

        if (entityId === 0) {
            res.status(400).json({ error: 'Draft id must not be 0. Call startEditing with id=0 to obtain a minted draft id first.' });
            return;
        }

        // Update value at path
        const updateResult = await updateService.updateStateValue(
            draftType,
            entityId,
            path,
            value,
            userId,
            action
        );

        // For character, trigger resolution and publish via WebSocket after state update
        if (draftType === DraftType.Character && draftConfig.onStateUpdate) {
            const stateService = getDraftStateService();
            const currentState = await stateService.getState(draftType, entityId);
            if (currentState) {
                await draftConfig.onStateUpdate(entityId, currentState as unknown, userId);
            }
        }

        res.json({
            success: true,
            ...(updateResult.id !== undefined && { id: updateResult.id }),
        } satisfies UpdateStateValueResponse);
    } catch (error) {
        console.error('Error updating entity value:', error);

        // Handle lock errors specifically
        if (error instanceof Error && error.message.includes('locked by another user')) {
            res.status(409).json({
                error: error.message
            });
            return;
        }

        res.status(500).json({
            error: 'Failed to update entity value',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Save draft state to database.
 * 
 * Validates the state against the draft's edit state schema, transforms it,
 * and persists it to the database using the draft's save service.
 * 
 * **Type Safety Note**: 
 * - Uses `ValidatedBodyT` from `@/util/validated-types` for proper type safety with `buildValidatedRouter`
 * - NEVER manually type `Request<>` - always use validated types from `@/util/validated-types`
 * - The body type `DraftRefRequest` comes from `@shared/schema` and matches `DraftRefRequestSchema`
 * 
 * @param req - Express request with validated draftType and id in body
 * @param res - Express response
 * @param _next - Express next function
 */
export async function SaveDraftState(
    req: ValidatedBodyT<DraftRefRequest, DraftSaveResponse>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const { draftType, id: entityId } = req.body;

        // Validate draft type
        if (!isValidDraftType(draftType)) {
            res.status(400).json({ error: `Invalid draft type: ${draftType}` });
            return;
        }

        const lockService = getDraftLockService();
        const stateService = getDraftStateService();
        const userSessionService = getUserSessionService();
        const draftConfig = getDraftConfig(draftType);

        if (entityId === 0) {
            res.status(400).json({ error: 'Draft id must not be 0. Call startEditing with id=0 to obtain a minted draft id first.' });
            return;
        }

        // Check lock - user must own the lock
        const lockedBy = await lockService.checkLock(draftType, entityId);
        if (lockedBy !== userId) {
            res.status(409).json({
                error: `Draft type ${draftType} is locked by another user`,
                lockedBy: lockedBy || undefined
            });
            return;
        }

        // Get draft state from DraftStateService
        const entityStateRaw = await stateService.getState(draftType, entityId);

        if (!entityStateRaw) {
            res.status(404).json({ error: `Draft type ${draftType} state not found` });
            return;
        }

        // Validate state against draft config's editStateSchema
        let validatedState: unknown;
        try {
            validatedState = draftConfig.editStateSchema.parse(entityStateRaw);
        } catch (error) {
            if (error instanceof z.ZodError) {
                // Map Zod errors to field paths for frontend error display
                const validationErrors = error.issues.map(err => ({
                    path: err.path.join('.'),
                    message: err.message,
                    code: err.code,
                }));
                res.status(400).json({
                    success: false as const,
                    errors: validationErrors,
                });
                return;
            }
            throw error;
        }

        // Save to database using draft config's saveService
        const savedEntityId = await draftConfig.saveService.saveSessionToMySQL(
            entityId,
            validatedState,
            userId
        );

        // Release lock and clear from user session
        await lockService.releaseLock(draftType, entityId, userId);
        await userSessionService.clearEditingEntity(userId, draftType, entityId);

        // Delete state from Redis
        await stateService.deleteState(draftType, entityId);

        res.json({
            success: true as const,
            draftType: draftType,
            id: savedEntityId,
        });
    } catch (error) {
        // Handle validation errors with detailed field paths
        if (error instanceof ValidationErrorWithPaths) {
            console.error(`Validation errors saving draft type ${req.body.draftType} session:`, error.errors);
            res.status(400).json({
                success: false as const,
                errors: error.errors
            });
            return;
        }

        console.error(`Error saving draft type ${req.body.draftType} state:`, error);
        res.status(500).json({ error: `Failed to save draft type ${req.body.draftType} state` });
    }
}

/**
 * Cancel editing without saving.
 * 
 * Releases the lock and clears the draft from the user's editing list.
 * 
 * **Type Safety Note**: 
 * - Uses `ValidatedBodyT` from `@/util/validated-types` for proper type safety with `buildValidatedRouter`
 * - NEVER manually type `Request<>` - always use validated types from `@/util/validated-types`
 * - The body type `DraftRefRequest` comes from `@shared/schema` and matches `DraftRefRequestSchema`
 * 
 * @param req - Express request with validated draftType and id in body
 * @param res - Express response
 * @param _next - Express next function
 */
export async function CancelDraftEditing(
    req: ValidatedBodyT<DraftRefRequest, CancelEditingResponse>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const { draftType, id: entityId } = req.body;

        // Validate draft type
        if (!isValidDraftType(draftType)) {
            res.status(400).json({ error: `Invalid draft type: ${draftType}` });
            return;
        }

        const lockService = getDraftLockService();
        const stateService = getDraftStateService();
        const userSessionService = getUserSessionService();

        if (entityId === 0) {
            res.status(400).json({ error: 'Draft id must not be 0. Call startEditing with id=0 to obtain a minted draft id first.' });
            return;
        }

        // Check lock - user must own the lock
        const lockedBy = await lockService.checkLock(draftType, entityId);
        if (lockedBy !== userId) {
            res.status(409).json({
                error: `Draft type ${draftType} is locked by another user`,
                lockedBy: lockedBy || undefined
            });
            return;
        }

        // Release lock and clear state
        await lockService.releaseLock(draftType, entityId, userId);
        await userSessionService.clearEditingEntity(userId, draftType, entityId);
        await stateService.deleteState(draftType, entityId);

        res.json({
            success: true,
            draftType: draftType,
            id: entityId,
        });
    } catch (error) {
        console.error(`Error canceling draft type ${req.body.draftType} editing:`, error);
        res.status(500).json({ error: `Failed to cancel draft type ${req.body.draftType} editing` });
    }
}

/**
 * Admin-only function to force release a draft lock.
 * 
 * **Type Safety Note**: 
 * - Uses `ValidatedBodyT` from `@/util/validated-types` for proper type safety with `buildValidatedRouter`
 * - NEVER manually type `Request<>` - always use validated types from `@/util/validated-types`
 * - The body type `DraftRefRequest` comes from `@shared/schema` and matches `DraftRefRequestSchema`
 * 
 * @param req - Express request with validated draftType and id in body
 * @param res - Express response
 * @param _next - Express next function
 */
export async function ForceReleaseDraftLock(
    req: ValidatedBodyT<DraftRefRequest, CancelEditingResponse>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        // Check if user is admin
        if (!req.user?.isAdmin) {
            res.status(403).json({ error: 'Admin access required' });
            return;
        }

        const { draftType, id: entityId } = req.body;

        // Validate draft type
        if (!isValidDraftType(draftType)) {
            res.status(400).json({ error: `Invalid draft type: ${draftType}` });
            return;
        }

        const lockService = getDraftLockService();

        // Force release lock
        await lockService.forceReleaseLock(draftType, entityId, userId);

        res.json({
            success: true,
            draftType: draftType,
            id: entityId,
        });
    } catch (error) {
        const draftType = req.body?.draftType;
        const entityId = req.body?.id;
        console.error(`Error force releasing draft lock (draftType: ${draftType}, id: ${entityId}):`, error);
        res.status(500).json({ error: `Failed to force release draft lock` });
    }
}
