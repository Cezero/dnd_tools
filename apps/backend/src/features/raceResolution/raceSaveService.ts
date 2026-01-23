import { ZodError } from 'zod';

import { PrismaClient } from '@shared/prisma-client';
import type { RaceEditState, UpdateRaceRequest } from '@shared/schema';
import { RaceEditStateSchema } from '@shared/schema';

import { featureSystemService } from '../featureSystem/featureSystemService';
import { raceService } from '../race/raceService';
import { mapZodErrorsToFieldPaths, ValidationErrorWithPaths } from '../shared/utils';

const prisma = new PrismaClient();


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
    transformSessionToUpdateRequest(raceState: RaceEditState): UpdateRaceRequest {
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
     * Saves a race session to MySQL.
     * 
     * @param raceId - The race ID
     * @param raceState - The race edit state from session
     * @returns The updated race
     */
    async saveSessionToMySQL(raceId: number, raceState: RaceEditState): Promise<void> {
        // Validate and coerce flexible state to RaceEditState
        let validatedState: RaceEditState;
        try {
            validatedState = RaceEditStateSchema.parse(raceState);
        } catch (error) {
            if (error instanceof ZodError) {
                // Map Zod errors to field paths for frontend error display
                const validationErrors = mapZodErrorsToFieldPaths(error);
                throw new ValidationErrorWithPaths(validationErrors);
            }
            throw error;
        }

        // Transform session state to update request
        const updateRequest = this.transformSessionToUpdateRequest(validatedState);

        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // Update race fields
            await raceService.updateRace({ id: raceId }, updateRequest);

            // Sync feature IDs (link/unlink features)
            await featureSystemService.syncRaceFeatures(raceId, validatedState.featureIds || [], tx);
        });
    }
}
