import { Response, NextFunction } from 'express';

import type { ValidatedParamsT, ValidatedParamsBodyT } from '@/util/validated-types';
import type {
    ApplyFeatureUpdateBodyRequest,
    StartFeatureEditingResponse,
    GetFeatureStateResponse,
    SaveFeatureStateResponse,
    CancelFeatureEditingResponse,
} from '@shared/schema';

import { FeatureStateService } from './featureStateService';
import { featureSystemService } from './featureSystemService';
import { featureUpdateApplierConfig } from './featureUpdateApplierConfig';
import { EntityLockService } from '../shared/entityState/EntityLockService';
import { applyUpdateToState } from '../shared/session/GenericUpdateApplier';
import { UserSessionService } from '../shared/session/UserSessionService';

/**
 * Feature resolution controller for managing feature editing.
 * 
 * Uses the new entity state system where features have independent states
 * stored in Redis. User sessions track which entities are being edited (not entity sessions).
 * 
 * **Endpoints**:
 * - `POST /features/:featureId/start-editing` - Start editing feature (acquire lock, add to user session)
 * - `GET /features/:featureId/state` - Get feature state
 * - `PUT /features/:featureId/update` - Apply feature update
 * - `POST /features/:featureId/save` - Save feature state to database
 * - `POST /features/:featureId/cancel` - Cancel editing (release lock, remove from user session)
 * - `POST /features/:featureId/lock/force-release` - Admin-only: Force release lock
 * 
 * @see FeatureStateService - For state management
 * @see EntityLockService - For lock management
 * @see UserSessionService - For user session tracking
 * @see packages/shared/docs/feature-system/backend-implementation.md - Full documentation
 */

// Initialize services (singleton pattern)
let featureStateServiceInstance: FeatureStateService | null = null;
let entityLockServiceInstance: EntityLockService | null = null;
let userSessionServiceInstance: UserSessionService | null = null;

function getFeatureStateService(): FeatureStateService {
    if (!featureStateServiceInstance) {
        featureStateServiceInstance = new FeatureStateService(featureSystemService);
    }
    return featureStateServiceInstance;
}

function getEntityLockService(): EntityLockService {
    if (!entityLockServiceInstance) {
        entityLockServiceInstance = new EntityLockService();
    }
    return entityLockServiceInstance;
}

function getUserSessionService(): UserSessionService {
    if (!userSessionServiceInstance) {
        userSessionServiceInstance = new UserSessionService();
    }
    return userSessionServiceInstance;
}

/**
 * Start editing a feature.
 * 
 * Acquires a lock on the feature, adds it to the user's editing list, and
 * initializes/loads the feature state.
 * 
 * For new features (featureId === 'new'), creates a new empty state without acquiring a lock.
 * 
 * @param req - Express request with validated featureId parameter (can be 'new' or a number)
 * @param res - Express response
 * @param _next - Express next function
 */
export async function StartFeatureEditing(
    req: ValidatedParamsT<{ featureId: string }, StartFeatureEditingResponse>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const featureIdParam = req.params.featureId;
        const isNewFeature = featureIdParam === 'new';
        const featureId = isNewFeature ? 'new' : parseInt(featureIdParam, 10);
        
        if (!isNewFeature && isNaN(featureId as number)) {
            res.status(400).json({ error: 'Invalid feature ID' });
            return;
        }

        const lockService = getEntityLockService();
        const stateService = getFeatureStateService();
        const userSessionService = getUserSessionService();

        if (isNewFeature) {
            // For new features, don't acquire a lock (no feature exists yet)
            // Don't add to editing list since there's no real entity to track
            // Just create empty state
            
            const featureState = await stateService.getFeatureState('new', userId);
            if (!featureState) {
                res.status(500).json({ error: 'Failed to create new feature state' });
                return;
            }
            
            // Store the empty state in Redis for this user
            await stateService.updateFeatureState('new', featureState, userId);
            
            res.json({
                featureState
            });
            return;
        }

        // For existing features, acquire lock
        const lockAcquired = await lockService.acquireLock('feature', featureId as number, userId);
        if (!lockAcquired) {
            const lockedBy = await lockService.checkLock('feature', featureId as number);
            res.status(409).json({
                error: 'Feature is locked by another user',
                lockedBy: lockedBy || undefined
            });
            return;
        }

        try {
            // Add to user's editing list
            await userSessionService.setEditingEntity(userId, 'feature', featureId as number);

            // Get or initialize feature state
            const featureState = await stateService.getFeatureState(featureId as number);
            if (!featureState) {
                // Release lock and remove from editing list if feature not found
                await lockService.releaseLock('feature', featureId as number, userId);
                await userSessionService.clearEditingEntity(userId, 'feature', featureId as number);
                res.status(404).json({ error: 'Feature not found' });
                return;
            }

            res.json({
                featureState
            });
        } catch (error) {
            // If anything fails after acquiring lock, release it
            await lockService.releaseLock('feature', featureId as number, userId);
            await userSessionService.clearEditingEntity(userId, 'feature', featureId as number);
            throw error;
        }
    } catch (error) {
        console.error('Error starting feature editing:', error);
        res.status(500).json({
            error: 'Failed to start feature editing',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Get current feature state.
 * 
 * @param req - Express request with validated featureId parameter (can be 'new' or a number)
 * @param res - Express response
 * @param _next - Express next function
 */
export async function GetFeatureState(
    req: ValidatedParamsT<{ featureId: string }, GetFeatureStateResponse>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const featureIdParam = req.params.featureId;
        const isNewFeature = featureIdParam === 'new';
        const featureId = isNewFeature ? 'new' : parseInt(featureIdParam, 10);
        
        if (!isNewFeature && (isNaN(featureId as number) || (featureId as number) <= 0)) {
            res.status(400).json({ error: 'Invalid feature ID: must be "new" or a positive integer' });
            return;
        }

        const stateService = getFeatureStateService();

        // Get feature state from Redis (pass userId for new features)
        const featureState = await stateService.getFeatureState(featureId, userId);
        if (!featureState) {
            res.status(404).json({ error: 'Feature state not found' });
            return;
        }

        res.json({
            featureState
        });
    } catch (error) {
        console.error('Error getting feature state:', error);
        res.status(500).json({
            error: 'Failed to get feature state',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Apply an update to the feature state.
 * 
 * @param req - Express request with validated featureId and update body
 * @param res - Express response
 * @param _next - Express next function
 */
export async function ApplyFeatureUpdate(
    req: ValidatedParamsBodyT<{ featureId: string }, ApplyFeatureUpdateBodyRequest>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const featureIdParam = req.params.featureId;
        const isNewFeature = featureIdParam === 'new';
        const featureId = isNewFeature ? 'new' : parseInt(featureIdParam, 10);
        
        if (!isNewFeature && (isNaN(featureId as number) || (featureId as number) <= 0)) {
            res.status(400).json({ error: 'Invalid feature ID: must be "new" or a positive integer' });
            return;
        }

        const update = req.body.update;
        const lockService = getEntityLockService();
        const stateService = getFeatureStateService();

        // For existing features, verify lock is held by this user
        if (!isNewFeature) {
            const lockedBy = await lockService.checkLock('feature', featureId as number);
            if (lockedBy !== userId) {
                res.status(409).json({
                    error: 'Feature is locked by another user',
                    lockedBy: lockedBy || undefined
                });
                return;
            }
        }

        // Get current state (pass userId for new features)
        const currentState = await stateService.getFeatureState(featureId, userId);
        if (!currentState) {
            res.status(404).json({ error: 'Feature state not found' });
            return;
        }

        // Apply update
        const updatedState = applyUpdateToState(currentState, update, featureUpdateApplierConfig);

        // Update state in Redis (automatically publishes update)
        await stateService.updateFeatureState(featureId, updatedState, userId);

        res.json({
            featureState: updatedState
        });
    } catch (error) {
        console.error('Error applying feature update:', error);
        res.status(500).json({
            error: 'Failed to apply feature update',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Save feature state to database.
 * 
 * @param req - Express request with validated featureId parameter (can be 'new' or a number)
 * @param res - Express response
 * @param _next - Express next function
 */
export async function SaveFeatureState(
    req: ValidatedParamsT<{ featureId: string }, SaveFeatureStateResponse>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const featureIdParam = req.params.featureId;
        const isNewFeature = featureIdParam === 'new';
        const featureId = isNewFeature ? 'new' : parseInt(featureIdParam, 10);
        
        if (!isNewFeature && (isNaN(featureId as number) || (featureId as number) <= 0)) {
            res.status(400).json({ error: 'Invalid feature ID: must be "new" or a positive integer' });
            return;
        }

        const lockService = getEntityLockService();
        const stateService = getFeatureStateService();
        const userSessionService = getUserSessionService();

        // For existing features, verify lock is held by this user
        if (!isNewFeature) {
            const lockedBy = await lockService.checkLock('feature', featureId as number);
            if (lockedBy !== userId) {
                res.status(409).json({
                    error: 'Feature is locked by another user',
                    lockedBy: lockedBy || undefined
                });
                return;
            }
        }

        // Save state to database (returns featureId)
        const savedFeatureId = await stateService.saveFeatureStateToDatabase(featureId, userId);

        // Release lock after successful save (only for existing features)
        if (!isNewFeature) {
            await lockService.releaseLock('feature', featureId as number, userId);
            // Remove from user's editing list (only for existing features)
            await userSessionService.clearEditingEntity(userId, 'feature', featureId as number);
        }

        res.json({ 
            success: true,
            featureId: savedFeatureId
        });
    } catch (error) {
        console.error('Error saving feature state:', error);
        res.status(500).json({
            error: 'Failed to save feature state',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Cancel feature editing.
 * 
 * Releases the lock and removes from user's editing list, but does not save changes.
 * 
 * @param req - Express request with validated featureId parameter (can be 'new' or a number)
 * @param res - Express response
 * @param _next - Express next function
 */
export async function CancelFeatureEditing(
    req: ValidatedParamsT<{ featureId: string }, CancelFeatureEditingResponse>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        const featureIdParam = req.params.featureId;
        const isNewFeature = featureIdParam === 'new';
        const featureId = isNewFeature ? 'new' : parseInt(featureIdParam, 10);
        
        if (!isNewFeature && (isNaN(featureId as number) || (featureId as number) <= 0)) {
            res.status(400).json({ error: 'Invalid feature ID: must be "new" or a positive integer' });
            return;
        }

        const lockService = getEntityLockService();
        const userSessionService = getUserSessionService();
        const stateService = getFeatureStateService();

        // For existing features, release lock
        if (!isNewFeature) {
            await lockService.releaseLock('feature', featureId as number, userId);
            // Remove from user's editing list (only for existing features)
            await userSessionService.clearEditingEntity(userId, 'feature', featureId as number);
        } else {
            // For new features, delete the temporary state from Redis
            await stateService.deleteNewFeatureState(userId);
        }

        // Note: We don't delete the state from Redis for existing features - it may be viewed by other users
        // State will expire naturally or be overwritten on next edit

        res.json({ success: true });
    } catch (error) {
        console.error('Error canceling feature editing:', error);
        res.status(500).json({
            error: 'Failed to cancel feature editing',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}

/**
 * Admin-only: Force release a feature lock.
 * 
 * Useful for development when session IDs change or locks become stale.
 * 
 * @param req - Express request with validated featureId parameter
 * @param res - Express response
 * @param _next - Express next function
 */
export async function ForceReleaseFeatureLock(
    req: ValidatedParamsT<{ featureId: string }, { success: boolean }>,
    res: Response,
    _next: NextFunction
): Promise<void> {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'User not authenticated' });
            return;
        }

        // TODO: Check if user is admin
        // For now, allow any authenticated user (should be restricted to admins)
        // if (!req.user?.isAdmin) {
        //     res.status(403).json({ error: 'Admin access required' });
        //     return;
        // }

        const featureId = parseInt(req.params.featureId, 10);
        if (isNaN(featureId)) {
            res.status(400).json({ error: 'Invalid feature ID' });
            return;
        }

        const lockService = getEntityLockService();

        // Force release lock
        await lockService.forceReleaseLock('feature', featureId, userId);

        res.json({ success: true });
    } catch (error) {
        console.error('Error force releasing feature lock:', error);
        res.status(500).json({
            error: 'Failed to force release feature lock',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
}
