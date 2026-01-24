import { prisma } from '@/lib/prisma';
import type { CreateRaceRequest, RaceDraftState, UpdateRaceRequest } from '@shared/schema';
import { CreateRaceSchema, RaceDraftStateSchema, UpdateRaceSchema } from '@shared/schema';

import { featureSystemService } from '../featureSystem/featureSystemService';
import { raceService } from '../race/raceService';
import { parseDraftState } from '../shared/draftState/draftSaveUtils';

/**
 * Transforms race session state to MySQL update request format.
 * 
 * This service handles the transformation from Redis session state to MySQL,
 * distinguishing between new and existing entities based on their IDs.
 * 
 * Process:
 * 1. Transform race fields
 * 2. Transform feature features (new vs existing based on IDs)
 * 3. Return UpdateRaceRequest ready for raceService.updateRace
 */
export class RaceSaveService {
    /**
     * Transforms session state to UpdateRaceRequest format.
     * 
     * @param raceState - The race edit state from session
     * @returns UpdateRaceRequest ready for raceService.updateRace
     */
    transformSessionToUpdateRequest(raceState: RaceDraftState): UpdateRaceRequest {
        // Transform race fields
        const updateRequest: UpdateRaceRequest = {
            name: raceState.name,
            editionId: raceState.editionId,
            isVisible: raceState.isVisible,
            description: raceState.description,
            sourceBookInfo: raceState.sourceBookInfo,
        };

        // Features are now managed independently via featureIds
        // The features array is no longer part of the race state
        // Feature linking/unlinking is handled separately via syncRaceFeatures

        return updateRequest;
    }

    /**
     * Transforms session state to CreateRaceRequest format.
     *
     * @param raceState - The race edit state from session
     * @returns CreateRaceRequest ready for raceService.createRace
     */
    transformSessionToCreateRequest(raceState: RaceDraftState): CreateRaceRequest {
        return {
            name: raceState.name,
            editionId: raceState.editionId,
            isVisible: raceState.isVisible,
            description: raceState.description,
            sourceBookInfo: raceState.sourceBookInfo,
            featureIds: raceState.featureIds ?? [],
        };
    }

    /**
     * Saves a race session to MySQL.
     * 
     * @param raceId - The race ID
     * @param raceState - The race edit state from session
     * @param userId - The user saving the draft
     * @returns The created/updated race ID
     * @returns The updated race
     */
    async saveSessionToMySQL(raceId: number, raceState: RaceDraftState | Record<string, unknown>, _userId: number): Promise<number> {
        const validatedState = parseDraftState(RaceDraftStateSchema.parse, raceState);

        // New drafts use negative IDs.
        if (raceId < 0) {
            const createRequest = this.transformSessionToCreateRequest(validatedState);
            const validatedCreateRequest = CreateRaceSchema.parse(createRequest);
            const created = await raceService.createRace(validatedCreateRequest);
            return parseInt(created.id, 10);
        }

        // Transform session state to update request
        const updateRequest = this.transformSessionToUpdateRequest(validatedState);
        const validatedUpdateRequest = UpdateRaceSchema.parse(updateRequest);

        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // Update race fields
            await raceService.updateRace({ id: raceId }, validatedUpdateRequest);

            // Sync feature IDs (link/unlink features)
            await featureSystemService.syncRaceFeatures(raceId, validatedState.featureIds || [], tx);
        });

        return raceId;
    }
}
