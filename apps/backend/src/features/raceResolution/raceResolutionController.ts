import { Response, NextFunction } from 'express';

import type { ValidatedParamsT, ValidatedParamsBodyT } from '@/util/validated-types';
import type {
    Race,
    RaceSummary,
    ApplyRaceUpdateBodyRequest,
    StartRaceEditingResponse,
    GetRaceStateResponse,
    SaveRaceStateResponse,
    CancelRaceEditingResponse,
} from '@shared/schema';

import { RaceSaveService } from './raceSaveService';
import { raceUpdateApplierConfig } from './raceUpdateApplierConfig';
import type { RaceEditState } from './types';
import { raceService } from '../race/raceService';
import { EntityLockService } from '../shared/entityState/EntityLockService';
import { EntityStateService } from '../shared/entityState/EntityStateService';
import { UserSessionService } from '../shared/session/UserSessionService';
import { applyUpdateToState } from '../shared/session/GenericUpdateApplier';

/**
 * Helper function to build initial race state from database entity.
 */
function buildInitialState(race: Race, raceId: number): RaceEditState {
    return {
        raceId,
        name: race.name,
        editionId: race.editionId,
        isVisible: race.isVisible,
        description: race.description ?? null,
        sourceBookInfo: race.sourceBookInfo || null,
        featureIds: race.features?.map(f => f.id).filter((id): id is number => id !== null && id !== undefined) || []
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
 * Start editing a race.
 * 
 * Acquires a lock on the race, adds it to the user's editing list, and
 * initializes/loads the race state.
 * 
 * @param req - Express request with validated raceId parameter
 * @param res - Express response
 * @param _next - Express next function
 */
export async function StartRaceEditing(
    req: ValidatedParamsT<{ raceId: string }, StartRaceEditingResponse>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const raceId = parseInt(req.params.raceId, 10);
        if (isNaN(raceId)) {
            res.status(400).json({ error: 'Invalid race ID' });
            return;
        }

        const lockService = getEntityLockService();
        const stateService = getEntityStateService();
        const userSessionService = getUserSessionService();

        // Acquire lock
        const lockAcquired = await lockService.acquireLock('race', raceId, userId);
        if (!lockAcquired) {
            const lockedBy = await lockService.checkLock('race', raceId);
            res.status(409).json({
                error: 'Race is locked by another user',
                lockedBy: lockedBy || undefined
            });
            return;
        }

        try {
            // Add to user's editing list
            await userSessionService.setEditingEntity(userId, 'race', raceId);

            // Get or initialize race state
            let raceState = await stateService.getState<RaceEditState>('race', raceId);
            if (!raceState) {
                // Initialize from database
                const race = await raceService.getRaceById({ id: raceId });
                if (!race) {
                    await lockService.releaseLock('race', raceId, userId);
                    await userSessionService.clearEditingEntity(userId, 'race', raceId);
                    res.status(404).json({ error: 'Race not found' });
                    return;
                }
                raceState = buildInitialState(race, raceId);
                await stateService.setState('race', raceId, raceState);
            }

            res.json({ raceState });
        } catch (error) {
            // If anything fails after acquiring lock, release it
            await lockService.releaseLock('race', raceId, userId);
            await userSessionService.clearEditingEntity(userId, 'race', raceId);
            throw error;
        }
    } catch (error) {
        console.error('Error starting race editing:', error);
        res.status(500).json({
            error: 'Failed to start race editing',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Get current race state.
 * 
 * @param req - Express request with validated raceId parameter
 * @param res - Express response
 * @param _next - Express next function
 */
export async function GetRaceState(
    req: ValidatedParamsT<{ raceId: string }, GetRaceStateResponse>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const raceId = parseInt(req.params.raceId, 10);
        if (isNaN(raceId)) {
            res.status(400).json({ error: 'Invalid race ID' });
            return;
        }

        const stateService = getEntityStateService();

        // Get race state from Redis
        const raceState = await stateService.getState<RaceEditState>('race', raceId);
        if (!raceState) {
            res.status(404).json({ error: 'Race state not found' });
            return;
        }

        res.json({ raceState });
    } catch (error) {
        console.error('Error getting race state:', error);
        res.status(500).json({
            error: 'Failed to get race state',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Apply an update to the race state.
 * 
 * @param req - Express request with validated raceId and update body
 * @param res - Express response
 * @param _next - Express next function
 */
export async function ApplyRaceUpdate(
    req: ValidatedParamsBodyT<{ raceId: string }, ApplyRaceUpdateBodyRequest>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const raceId = parseInt(req.params.raceId, 10);
        if (isNaN(raceId)) {
            res.status(400).json({ error: 'Invalid race ID' });
            return;
        }

        const body = req.body as ApplyRaceUpdateBodyRequest;
        const update = body.update;
        const lockService = getEntityLockService();
        const stateService = getEntityStateService();

        // Verify lock is held by this user
        const lockedBy = await lockService.checkLock('race', raceId);
        if (lockedBy !== userId) {
            res.status(409).json({
                error: 'Race is locked by another user',
                lockedBy: lockedBy || undefined
            });
            return;
        }

        // Get current state
        const currentState = await stateService.getState<RaceEditState>('race', raceId);
        if (!currentState) {
            res.status(404).json({ error: 'Race state not found' });
            return;
        }

        // Apply update
        const updatedState = applyUpdateToState(currentState, update, raceUpdateApplierConfig);

        // Update state in Redis (automatically publishes update)
        // Update state in Redis (skip pub/sub for race updates - not needed for editing)
        await stateService.setState('race', raceId, updatedState, { publish: false });

        res.json({
            raceState: updatedState
        });
    } catch (error) {
        console.error('Error applying race update:', error);
        res.status(500).json({
            error: 'Failed to apply race update',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Save race state to database.
 * 
 * @param req - Express request with validated raceId parameter
 * @param res - Express response
 * @param _next - Express next function
 */
export async function SaveRaceState(
    req: ValidatedParamsT<{ raceId: string }, SaveRaceStateResponse>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const raceId = parseInt(req.params.raceId, 10);
        if (isNaN(raceId)) {
            res.status(400).json({ error: 'Invalid race ID' });
            return;
        }

        const lockService = getEntityLockService();
        const stateService = getEntityStateService();
        const userSessionService = getUserSessionService();

        // Verify lock is held by this user
        const lockedBy = await lockService.checkLock('race', raceId);
        if (lockedBy !== userId) {
            res.status(409).json({
                error: 'Race is locked by another user',
                lockedBy: lockedBy || undefined
            });
            return;
        }

        // Get current state from Redis
        const raceState = await stateService.getState<RaceEditState>('race', raceId);
        if (!raceState) {
            res.status(404).json({ error: 'Race state not found' });
            return;
        }

        // Save state to database
        const saveService = new RaceSaveService();
        await saveService.saveSessionToMySQL(raceId, raceState);

        // Release lock after successful save
        await lockService.releaseLock('race', raceId, userId);

        // Remove from user's editing list
        await userSessionService.clearEditingEntity(userId, 'race', raceId);

        // Return race summary
        const race = await raceService.getRaceById({ id: raceId });
        if (!race) {
            res.status(404).json({ error: 'Race not found after save' });
            return;
        }

        const raceSummary: RaceSummary = {
            id: raceId,
            name: race.name,
            editionId: race.editionId,
            isVisible: race.isVisible,
            description: race.description,
            sourceBookInfo: race.sourceBookInfo
        };

        res.json({ race: raceSummary });
    } catch (error) {
        console.error('Error saving race state:', error);
        res.status(500).json({
            error: 'Failed to save race state',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Cancel race editing.
 * 
 * Releases the lock and removes from user's editing list, but does not save changes.
 * 
 * @param req - Express request with validated raceId parameter
 * @param res - Express response
 * @param _next - Express next function
 */
export async function CancelRaceEditing(
    req: ValidatedParamsT<{ raceId: string }, CancelRaceEditingResponse>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const raceId = parseInt(req.params.raceId, 10);
        if (isNaN(raceId)) {
            res.status(400).json({ error: 'Invalid race ID' });
            return;
        }

        const lockService = getEntityLockService();
        const userSessionService = getUserSessionService();

        // Release lock
        await lockService.releaseLock('race', raceId, userId);

        // Remove from user's editing list
        await userSessionService.clearEditingEntity(userId, 'race', raceId);

        // Note: We don't delete the state from Redis - it may be viewed by other users
        // State will expire naturally or be overwritten on next edit

        res.json({ success: true });
    } catch (error) {
        console.error('Error canceling race editing:', error);
        res.status(500).json({
            error: 'Failed to cancel race editing',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
