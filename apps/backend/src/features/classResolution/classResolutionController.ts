import { Response, NextFunction } from 'express';

import type { ValidatedParamsT, ValidatedParamsBodyT } from '@/util/validated-types';
import type {
    DnDClass,
    ClassSummary,
    ApplyClassUpdateBodyRequest,
    StartClassEditingResponse,
    GetClassStateResponse,
    ApplyClassUpdateResponse,
    SaveClassStateResponse,
    CancelClassEditingResponse,
} from '@shared/schema';

import { ClassSaveService } from './classSaveService';
import { classUpdateApplierConfig } from './classUpdateApplierConfig';
import type { ClassEditState, ClassUpdate } from './types';
import { classService } from '../class/classService';
import { EntityLockService } from '../shared/entityState/EntityLockService';
import { EntityStateService } from '../shared/entityState/EntityStateService';
import { UserSessionService } from '../shared/session/UserSessionService';
import { applyUpdateToState } from '../shared/session/GenericUpdateApplier';

/**
 * Helper function to build initial class state from database entity.
 */
function buildInitialState(cls: DnDClass, classId: number): ClassEditState {
    return {
        classId,
        name: cls.name,
        abbreviation: cls.abbreviation,
        editionId: cls.editionId,
        isPrestige: cls.isPrestige,
        isVisible: cls.isVisible,
        canCastSpells: cls.canCastSpells,
        spellsKnown: cls.spellsKnown,
        isDivine: cls.isDivine,
        description: cls.description ?? null,
        sourceBookInfo: cls.sourceBookInfo !== undefined ? cls.sourceBookInfo : null,
        featureIds: cls.features?.map(f => f.id).filter((id): id is number => id !== null && id !== undefined) || [],
        spellcastingProgression: cls.spellcastingProgression || [],
        spellsKnownProgression: cls.spellsKnownProgression || []
    };
}

// Initialize services (singleton pattern)
let entityLockServiceInstance: EntityLockService | null = null;
let entityStateServiceInstance: EntityStateService | null = null;
let userSessionServiceInstance: UserSessionService | null = null;

function getEntityLockService(): EntityLockService {
    if (!entityLockServiceInstance) {
        entityLockServiceInstance = new EntityLockService();
    }
    return entityLockServiceInstance;
}

function getEntityStateService(): EntityStateService {
    if (!entityStateServiceInstance) {
        entityStateServiceInstance = new EntityStateService();
    }
    return entityStateServiceInstance;
}

function getUserSessionService(): UserSessionService {
    if (!userSessionServiceInstance) {
        userSessionServiceInstance = new UserSessionService();
    }
    return userSessionServiceInstance;
}

/**
 * Start editing a class.
 * 
 * Acquires a lock on the class, adds it to the user's editing list, and
 * initializes/loads the class state.
 * 
 * @param req - Express request with validated classId parameter
 * @param res - Express response
 * @param _next - Express next function
 */
export async function StartClassEditing(
    req: ValidatedParamsT<{ classId: string }, StartClassEditingResponse>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const classId = parseInt(req.params.classId, 10);
        if (isNaN(classId)) {
            res.status(400).json({ error: 'Invalid class ID' });
            return;
        }

        const lockService = getEntityLockService();
        const stateService = getEntityStateService();
        const userSessionService = getUserSessionService();

        // Acquire lock
        const lockAcquired = await lockService.acquireLock('class', classId, userId);
        if (!lockAcquired) {
            const lockedBy = await lockService.checkLock('class', classId);
            res.status(409).json({
                error: 'Class is locked by another user',
                lockedBy: lockedBy || undefined
            });
            return;
        }

        try {
            // Add to user's editing list
            await userSessionService.setEditingEntity(userId, 'class', classId);

            // Get or initialize class state
            let classState = await stateService.getState<ClassEditState>('class', classId);
            if (!classState) {
                // Initialize from database
                const cls = await classService.getClassById({ id: classId });
                if (!cls) {
                    await lockService.releaseLock('class', classId, userId);
                    await userSessionService.clearEditingEntity(userId, 'class', classId);
                    res.status(404).json({ error: 'Class not found' });
                    return;
                }
                classState = buildInitialState(cls, classId);
                await stateService.setState('class', classId, classState);
            }

            res.json({ classState });
        } catch (error) {
            // If anything fails after acquiring lock, release it
            await lockService.releaseLock('class', classId, userId);
            await userSessionService.clearEditingEntity(userId, 'class', classId);
            throw error;
        }
    } catch (error) {
        console.error('Error starting class editing:', error);
        res.status(500).json({
            error: 'Failed to start class editing',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Get current class state.
 * 
 * @param req - Express request with validated classId parameter
 * @param res - Express response
 * @param _next - Express next function
 */
export async function GetClassState(
    req: ValidatedParamsT<{ classId: string }, { classState: ClassEditState }>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const classId = parseInt(req.params.classId, 10);
        if (isNaN(classId)) {
            res.status(400).json({ error: 'Invalid class ID' });
            return;
        }

        const stateService = getEntityStateService();

        // Get class state from Redis
        const classState = await stateService.getState<ClassEditState>('class', classId);
        if (!classState) {
            res.status(404).json({ error: 'Class state not found' });
            return;
        }

        res.json({ classState });
    } catch (error) {
        console.error('Error getting class state:', error);
        res.status(500).json({
            error: 'Failed to get class state',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Apply an update to the class state.
 * 
 * @param req - Express request with validated classId and update body
 * @param res - Express response
 * @param _next - Express next function
 */
export async function ApplyClassUpdate(
    req: ValidatedParamsBodyT<{ classId: string }, ApplyClassUpdateBodyRequest>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const classId = parseInt(req.params.classId, 10);
        if (isNaN(classId)) {
            res.status(400).json({ error: 'Invalid class ID' });
            return;
        }

        const body = req.body as ApplyClassUpdateBodyRequest;
        const update = body.update;
        const lockService = getEntityLockService();
        const stateService = getEntityStateService();

        // Verify lock is held by this user
        const lockedBy = await lockService.checkLock('class', classId);
        if (lockedBy !== userId) {
            res.status(409).json({
                error: 'Class is locked by another user',
                lockedBy: lockedBy || undefined
            });
            return;
        }

        // Get current state
        const currentState = await stateService.getState<ClassEditState>('class', classId);
        if (!currentState) {
            res.status(404).json({ error: 'Class state not found' });
            return;
        }

        // Apply update
        const updatedState = applyUpdateToState(currentState, update, classUpdateApplierConfig);

        // Update state in Redis (skip pub/sub for class updates - not needed for editing)
        await stateService.setState('class', classId, updatedState, { publish: false });

        res.json({
            classState: updatedState
        });
    } catch (error) {
        console.error('Error applying class update:', error);
        res.status(500).json({
            error: 'Failed to apply class update',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Save class state to database.
 * 
 * @param req - Express request with validated classId parameter
 * @param res - Express response
 * @param _next - Express next function
 */
export async function SaveClassState(
    req: ValidatedParamsT<{ classId: string }, SaveClassStateResponse>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const classId = parseInt(req.params.classId, 10);
        if (isNaN(classId)) {
            res.status(400).json({ error: 'Invalid class ID' });
            return;
        }

        const lockService = getEntityLockService();
        const stateService = getEntityStateService();
        const userSessionService = getUserSessionService();

        // Verify lock is held by this user
        const lockedBy = await lockService.checkLock('class', classId);
        if (lockedBy !== userId) {
            res.status(409).json({
                error: 'Class is locked by another user',
                lockedBy: lockedBy || undefined
            });
            return;
        }

        // Get current state from Redis
        const classState = await stateService.getState<ClassEditState>('class', classId);
        if (!classState) {
            res.status(404).json({ error: 'Class state not found' });
            return;
        }

        // Save state to database
        const saveService = new ClassSaveService();
        await saveService.saveSessionToMySQL(classId, classState);

        // Release lock after successful save
        await lockService.releaseLock('class', classId, userId);

        // Remove from user's editing list
        await userSessionService.clearEditingEntity(userId, 'class', classId);

        // Return class summary
        const cls = await classService.getClassById({ id: classId });
        if (!cls) {
            res.status(404).json({ error: 'Class not found after save' });
            return;
        }

        const classSummary: ClassSummary = {
            id: classId,
            name: cls.name,
            abbreviation: cls.abbreviation,
            editionId: cls.editionId,
            isPrestige: cls.isPrestige,
            isVisible: cls.isVisible,
            canCastSpells: cls.canCastSpells,
            spellsKnown: cls.spellsKnown,
            isDivine: cls.isDivine,
            description: cls.description,
            sourceBookInfo: cls.sourceBookInfo
        };

        res.json({ class: classSummary });
    } catch (error) {
        console.error('Error saving class state:', error);
        res.status(500).json({
            error: 'Failed to save class state',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Cancel class editing.
 * 
 * Releases the lock and removes from user's editing list, but does not save changes.
 * 
 * @param req - Express request with validated classId parameter
 * @param res - Express response
 * @param _next - Express next function
 */
export async function CancelClassEditing(
    req: ValidatedParamsT<{ classId: string }, CancelClassEditingResponse>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const classId = parseInt(req.params.classId, 10);
        if (isNaN(classId)) {
            res.status(400).json({ error: 'Invalid class ID' });
            return;
        }

        const lockService = getEntityLockService();
        const userSessionService = getUserSessionService();

        // Release lock
        await lockService.releaseLock('class', classId, userId);

        // Remove from user's editing list
        await userSessionService.clearEditingEntity(userId, 'class', classId);

        // Note: We don't delete the state from Redis - it may be viewed by other users
        // State will expire naturally or be overwritten on next edit

        res.json({ success: true });
    } catch (error) {
        console.error('Error canceling class editing:', error);
        res.status(500).json({
            error: 'Failed to cancel class editing',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
