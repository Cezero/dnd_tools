import type { UpdateRaceRequest } from '@shared/schema';

import type { RaceEditState } from './types';
import { raceService } from '../race/raceService';


/**
 * Transforms race session state to MySQL update request format.
 * 
 * This service handles the transformation from SQLite session state to MySQL,
 * distinguishing between new and existing entities based on their IDs.
 * 
 * Process:
 * 1. Transform race fields
 * 2. Transform feature progressions (new vs existing based on IDs)
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

        // Transform feature progressions
        // Note: The session state contains FeatureProgression objects with IDs.
        // IDs that are temp (from SQLite) will need to be handled specially.
        // For now, we'll pass them through and let raceService handle them.
        // TODO: Implement proper temp ID detection and transformation
        if (raceState.featureProgressions && raceState.featureProgressions.length > 0) {
            updateRequest.features = raceState.featureProgressions.map(progression => {
                // Remove frontend-only fields
                const { classes: _classes, races: _races, feature: _feature, ...progressionData } = progression;

                // Transform entities if present
                const entities = progression.entities?.map(entity => {
                    const { progressionId: _progressionId, ...entityData } = entity;

                    // Handle formulaParams
                    if (entityData.formulaParams && entityData.formulaParams.formulaId) {
                        const formulaParamsData = { ...entityData.formulaParams };
                        delete (formulaParamsData as { id?: unknown }).id; // Remove id if it exists
                        entityData.formulaParams = formulaParamsData;
                        delete entityData.formulaParamsId;
                    } else {
                        delete entityData.formulaParams;
                        delete entityData.formulaParamsId;
                    }

                    return entityData;
                });

                return {
                    ...progressionData,
                    entities: entities || []
                };
            });
        }

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
        // Transform session state to update request
        const updateRequest = this.transformSessionToUpdateRequest(raceState);

        // Call raceService.updateRace
        await raceService.updateRace({ id: raceId }, updateRequest);
    }
}
