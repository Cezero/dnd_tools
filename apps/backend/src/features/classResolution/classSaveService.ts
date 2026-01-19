import type { UpdateClassRequest } from '@shared/schema';

import { classService } from '../class/classService';
import type { ClassEditState } from './types';

/**
 * Transforms class session state to MySQL update request format.
 * 
 * This service handles the transformation from SQLite session state to MySQL,
 * distinguishing between new and existing entities based on their IDs.
 * 
 * Process:
 * 1. Transform class fields
 * 2. Transform feature progressions (new vs existing based on IDs)
 * 3. Transform spellcasting progressions
 * 4. Return UpdateClassRequest ready for classService.updateClass
 */
export class ClassSaveService {
    /**
     * Transforms session state to UpdateClassRequest format.
     * 
     * @param classState - The class edit state from session
     * @returns UpdateClassRequest ready for classService.updateClass
     */
    transformSessionToUpdateRequest(classState: ClassEditState): UpdateClassRequest {
        // Transform class fields
        const updateRequest: UpdateClassRequest = {
            name: classState.name,
            abbreviation: classState.abbreviation,
            editionId: classState.editionId,
            isPrestige: classState.isPrestige,
            isVisible: classState.isVisible,
            canCastSpells: classState.canCastSpells,
            spellsKnown: classState.spellsKnown,
            isDivine: classState.isDivine,
            description: classState.description,
        };

        // Transform feature progressions
        // Note: The session state contains FeatureProgression objects with IDs.
        // IDs that are temp (from SQLite) will need to be handled specially.
        // For now, we'll pass them through and let classService.handle them.
        // TODO: Implement proper temp ID detection and transformation
        if (classState.featureProgressions && classState.featureProgressions.length > 0) {
            updateRequest.features = classState.featureProgressions.map(progression => {
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

        // Transform spellcasting progressions
        if (classState.spellcastingProgression && classState.spellcastingProgression.length > 0) {
            updateRequest.spellcastingProgression = classState.spellcastingProgression.map(prog => {
                const { id: _id, classId: _classId, ...progressionData } = prog;
                return {
                    ...progressionData,
                    slots: prog.slots?.map(slot => {
                        const { id: _slotId, progressionId: _slotProgressionId, ...slotData } = slot;
                        return slotData;
                    }) || []
                };
            });
        }

        // Transform spells known progressions
        if (classState.spellsKnownProgression && classState.spellsKnownProgression.length > 0) {
            updateRequest.spellsKnownProgression = classState.spellsKnownProgression.map(prog => {
                const { id: _id, classId: _classId, ...progressionData } = prog;
                return {
                    ...progressionData,
                    slots: prog.slots?.map(slot => {
                        const { id: _slotId, progressionId: _slotProgressionId, ...slotData } = slot;
                        return slotData;
                    }) || []
                };
            });
        }

        return updateRequest;
    }

    /**
     * Saves a class session to MySQL.
     * 
     * @param classId - The class ID
     * @param classState - The class edit state from session
     * @returns The updated class
     */
    async saveSessionToMySQL(classId: number, classState: ClassEditState): Promise<void> {
        // Transform session state to update request
        const updateRequest = this.transformSessionToUpdateRequest(classState);

        // Call classService.updateClass
        await classService.updateClass({ id: classId }, updateRequest);
    }
}
