import { DraftType } from '@shared/static-data';

import { DraftLockService } from './DraftLockService';
import { DraftStateService } from './DraftStateService';
import { updateValueAtPath, type JsonObject } from '../utils';

/**
 * Generic service for updating entity states by path.
 * 
 * Works with DraftStateService for all draft types. Handles lock checking, state retrieval,
 * path-based updates, and state persistence.
 * 
 * **Supported Draft Types**:
 * - DraftType.Class (1) - Uses DraftStateService
 * - DraftType.Race (2) - Uses DraftStateService
 * - DraftType.Feature (3) - Uses DraftStateService
 * - DraftType.Character (4) - Uses DraftStateService
 * 
 * **Update Flow**:
 * 1. Check draft lock (must be locked by requesting user)
 * 2. Retrieve current state from Redis
 * 3. Update value at specified path using path parser
 * 4. Persist updated state back to Redis
 * 
 * @see DraftStateService - For generic state storage
 * @see DraftLockService - For lock management
 * @see updateValueAtPath - For path-based updates
 * 
 * @example
 * ```typescript
 * const updateService = new StateUpdateService();
 * 
 * // Update a top-level field
 * await updateService.updateStateValue(DraftType.Class, 1, 'name', 'New Name', userId);
 * 
 * // Update a nested field
 * await updateService.updateStateValue(DraftType.Class, 1, 'sourceBookInfo.editionId', 5, userId);
 * 
 * // Update an array element
 * await updateService.updateStateValue(DraftType.Feature, 2, 'entities.0.type', 1, userId);
 * ```
 */
export class StateUpdateService {
    private draftStateService: DraftStateService;
    private draftLockService: DraftLockService;

    constructor() {
        this.draftStateService = new DraftStateService();
        this.draftLockService = new DraftLockService();
    }

    /**
     * Updates a value at a specific path in a draft's state.
     * 
     * @param draftType - The draft type (numeric enum value)
     * @param entityId - The entity ID, or 'new' for new entities
     * @param path - The path to update (e.g., 'name', 'entities.0.type', 'sourceBookInfo.editionId')
     * @param value - The new value to set
     * @param userId - The user ID requesting the update (must match lock owner)
     * @returns The updated state
     * @throws Error if lock check fails, state retrieval fails, or update fails
     * 
     * @example
     * ```typescript
     * // Update class name
     * const updatedState = await updateService.updateStateValue(
     *   DraftType.Class,
     *   1,
     *   'name',
     *   'Wizard',
     *   userId
     * );
     * 
     * // Update nested feature entity
     * const updatedState = await updateService.updateStateValue(
     *   DraftType.Feature,
     *   2,
     *   'entities.0.appliesTo',
     *   5,
     *   userId
     * );
     * ```
     */
    async updateStateValue(
        draftType: DraftType,
        entityId: number | 'new',
        path: string,
        value: unknown,
        userId: number
    ): Promise<Record<string, unknown>> {
        // Resolve actual entity ID for lock checking
        // For 'new' entities, use negative userId as the key
        const lockEntityId = entityId === 'new' ? -userId : entityId;

        // Check lock - user must own the lock
        const lockedBy = await this.draftLockService.checkLock(draftType, lockEntityId);
        if (lockedBy !== null && lockedBy !== userId) {
            throw new Error(`Draft ${draftType}:${lockEntityId} is locked by another user`);
        }

        // Get current state
        const currentState = await this.draftStateService.getState<JsonObject>(
            draftType,
            lockEntityId
        );

        if (!currentState) {
            throw new Error(`State not found for ${draftType}:${lockEntityId}`);
        }

        // Update value at path
        const updatedState = updateValueAtPath(currentState, path, value as string | number);

        // Persist updated state
        await this.draftStateService.setState(draftType, lockEntityId, updatedState);

        return updatedState;
    }
}
