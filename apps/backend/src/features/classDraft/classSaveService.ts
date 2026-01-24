import { prisma } from '@/lib/prisma';
import type { ClassDraftState, CreateClassRequest, UpdateClassRequest } from '@shared/schema';
import { ClassDraftStateSchema, CreateClassSchema, UpdateClassSchema } from '@shared/schema';

import { classService } from '../class/classService';
import { featureSystemService } from '../featureSystem/featureSystemService';
import { parseDraftState } from '../shared/draftState/draftSaveUtils';

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
    transformSessionToUpdateRequest(classState: ClassDraftState): UpdateClassRequest {
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
     * Transforms session state to CreateClassRequest format.
     *
     * @param classState - The class edit state from session
     * @returns CreateClassRequest ready for classService.createClass
     */
    transformSessionToCreateRequest(classState: ClassDraftState): CreateClassRequest {
        return {
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
            featureIds: classState.featureIds ?? [],
            spellcastingProgression: classState.spellcastingProgression?.map(prog => {
                const { id: _id, classId: _classId, ...progressionData } = prog;
                return {
                    ...progressionData,
                    slots: prog.slots?.map(slot => {
                        const { id: _slotId, progressionId: _slotProgressionId, ...slotData } = slot;
                        return slotData;
                    }) ?? [],
                };
            }) ?? null,
            spellsKnownProgression: classState.spellsKnownProgression?.map(prog => {
                const { id: _id, classId: _classId, ...progressionData } = prog;
                return {
                    ...progressionData,
                    slots: prog.slots?.map(slot => {
                        const { id: _slotId, progressionId: _slotProgressionId, ...slotData } = slot;
                        return slotData;
                    }) ?? [],
                };
            }) ?? null,
        };
    }

    /**
     * Saves a class session to MySQL.
     * 
     * @param classId - The class ID
     * @param classState - The class edit state from session (may be flexible JSON)
     * @param userId - The user saving the draft
     * @returns The created/updated class ID
     * @throws ValidationErrorWithPaths if state validation fails
     */
    async saveSessionToMySQL(classId: number, classState: ClassDraftState | Record<string, unknown>, _userId: number): Promise<number> {
        const validatedState = parseDraftState(ClassDraftStateSchema.parse, classState);

        // New drafts use negative IDs.
        if (classId < 0) {
            const createRequest = this.transformSessionToCreateRequest(validatedState);
            const validatedCreateRequest = CreateClassSchema.parse(createRequest);
            const created = await classService.createClass(validatedCreateRequest);
            return parseInt(created.id, 10);
        }

        // Transform session state to update request
        const updateRequest = this.transformSessionToUpdateRequest(validatedState);
        const validatedUpdateRequest = UpdateClassSchema.parse(updateRequest);

        // Use transaction to ensure atomicity
        await prisma.$transaction(async (tx) => {
            // Update class fields
            await classService.updateClass({ id: classId }, validatedUpdateRequest);

            // Sync feature IDs (link/unlink features)
            const featureIds = validatedState.featureIds || [];

            // Guard against accidentally removing all links
            // Check current links before syncing
            const currentLinks = await tx.featureClassMap.findMany({
                where: { classId },
                select: { featureId: true }
            });
            const currentFeatureIds = new Set(currentLinks.map(link => link.featureId));

            if (currentFeatureIds.size > 0 && featureIds.length === 0) {
                console.error(`[ClassSaveService] WARNING: Attempting to remove ALL ${currentFeatureIds.size} feature links for class ${classId}! classState.featureIds is empty. This is likely a bug.`);
                console.error(`[ClassSaveService] Current feature IDs in database:`, Array.from(currentFeatureIds));
                console.error(`[ClassSaveService] classState:`, JSON.stringify(classState, null, 2));
                // Don't proceed with removing all links - this is likely a state management bug
                throw new Error(`Cannot remove all feature links for class ${classId}: classState.featureIds is empty but ${currentFeatureIds.size} links exist. This indicates a state synchronization issue.`);
            }

            await featureSystemService.syncClassFeatures(classId, featureIds, tx);
        });

        return classId;
    }
}
