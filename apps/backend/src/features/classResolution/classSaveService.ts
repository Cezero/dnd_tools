import type { UpdateClassRequest } from '@shared/schema';

import type { ClassEditState } from './types';
import { classService } from '../class/classService';
import { featureSystemService } from '../featureSystem/featureSystemService';
import { PrismaClient } from '@shared/prisma-client';

const prisma = new PrismaClient();

/**
 * Transforms class session state to MySQL update request format.
 * 
 * This service handles the transformation from Redis session state to MySQL,
 * distinguishing between new and existing entities based on their IDs.
 * 
 * Process:
 * 1. Transform class fields
 * 2. Transform feature features (new vs existing based on IDs)
 * 3. Transform spellcasting features
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
            sourceBookInfo: classState.sourceBookInfo,
        };

        // Features are now managed independently via featureIds
        // The features array is no longer part of the class state
        // Feature linking/unlinking is handled separately via syncClassFeatures
        // For backward compatibility with UpdateClassRequest, set features to null
        updateRequest.features = null;

        // Transform spellcasting features
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

        // Transform spells known features
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

        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // Update class fields
            await classService.updateClass({ id: classId }, updateRequest);

            // Sync feature IDs (link/unlink features)
            await featureSystemService.syncClassFeatures(classId, classState.featureIds || [], tx);
        });
    }
}
