import type { CharacterFeatureChoice, FeatureProgression, FeatureEntity } from '@shared/schema';

/**
 * Manages complex linked choices for features
 * Extends existing ChoiceResolver patterns for choice groups
 */
export class ChoiceGroupManager {
    /**
     * Groups choices by choiceGroupId
     */
    static groupChoices(choices: CharacterFeatureChoice[]): Map<string, CharacterFeatureChoice[]> {
        const groups = new Map<string, CharacterFeatureChoice[]>();
        
        for (const choice of choices) {
            if (choice.choiceGroupId) {
                if (!groups.has(choice.choiceGroupId)) {
                    groups.set(choice.choiceGroupId, []);
                }
                groups.get(choice.choiceGroupId)!.push(choice);
            }
        }
        
        return groups;
    }

    /**
     * Gets linked choices for a given choice group
     */
    static getLinkedChoices(
        choiceGroupId: string,
        allChoices: CharacterFeatureChoice[]
    ): CharacterFeatureChoice[] {
        return allChoices.filter(choice => choice.linkedChoiceGroupId === choiceGroupId);
    }

    /**
     * Validates that linked choices are consistent
     * For example, Turn/Rebuke and Spontaneous Casting must match for cleric energy type
     */
    static validateLinkedChoices(
        primaryChoice: CharacterFeatureChoice,
        linkedChoices: CharacterFeatureChoice[]
    ): boolean {
        // For cleric energy type, both choices must have matching energy type
        if (primaryChoice.choiceGroupId === 'cleric-energy-type') {
            const primaryData = primaryChoice.choiceData as {
                energyType?: 'positive' | 'negative';
            } | null;
            
            for (const linkedChoice of linkedChoices) {
                const linkedData = linkedChoice.choiceData as {
                    energyType?: 'positive' | 'negative';
                } | null;
                
                if (primaryData?.energyType && linkedData?.energyType) {
                    if (primaryData.energyType !== linkedData.energyType) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }

    /**
     * Creates a choice group choice from pending choices
     */
    static createChoiceGroupChoice(
        choiceGroupId: string,
        choiceData: Record<string, unknown>,
        progression: FeatureProgression,
        entity: FeatureEntity,
        advancementId: number,
        characterId: number
    ): CharacterFeatureChoice {
        return {
            id: 0, // Will be set by backend
            characterId,
            progressionId: progression.id,
            advancementId,
            featureEntityId: entity.id,
            appliesToId: 0, // May not be applicable for complex choices
            appliesToSubId: null,
            choiceIndex: null,
            choiceGroupId,
            choiceData: choiceData as Record<string, unknown>,
            linkedChoiceGroupId: null,
        };
    }

    /**
     * Creates a linked choice that depends on another choice group
     */
    static createLinkedChoice(
        choiceGroupId: string,
        linkedChoiceGroupId: string,
        choiceData: Record<string, unknown>,
        progression: FeatureProgression,
        entity: FeatureEntity,
        advancementId: number,
        characterId: number
    ): CharacterFeatureChoice {
        return {
            id: 0,
            characterId,
            progressionId: progression.id,
            advancementId,
            featureEntityId: entity.id,
            appliesToId: 0,
            appliesToSubId: null,
            choiceIndex: null,
            choiceGroupId,
            choiceData: choiceData as Record<string, unknown>,
            linkedChoiceGroupId,
        };
    }
}

