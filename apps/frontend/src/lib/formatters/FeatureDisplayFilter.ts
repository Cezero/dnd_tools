import type { FeatureProgression, Feature, FeatureProgressionCondition } from '@shared/schema';
import type { CharacterWithAllDetailsResponse } from '@shared/schema';
import { FeatureEntityConditionType } from '@shared/static-data';

/**
 * Filters features based on display flags and conditions
 */
export class FeatureDisplayFilter {
    /**
     * Determines if a feature should be displayed on character sheets
     */
    static shouldDisplayFeature(
        feature: Feature,
        progression: FeatureProgression,
        character: CharacterWithAllDetailsResponse
    ): boolean {
        // Check displayInCharacterSheet flag
        if (feature.displayInCharacterSheet === false) {
            return false;
        }

        // Check feature progression display conditions
        if (progression.displayConditions && progression.displayConditions.length > 0) {
            const shouldDisplay = this.evaluateDisplayConditions(
                progression.displayConditions,
                character
            );
            if (!shouldDisplay) {
                return false;
            }
        }

        return true;
    }

    /**
     * Evaluates display conditions for a feature progression
     */
    private static evaluateDisplayConditions(
        conditions: FeatureProgressionCondition[],
        character: CharacterWithAllDetailsResponse
    ): boolean {
        // All conditions must be met (AND logic)
        return conditions.every(condition => {
            return this.evaluateCondition(condition, character);
        });
    }

    /**
     * Evaluates a single display condition
     */
    private static evaluateCondition(
        condition: FeatureProgressionCondition,
        character: CharacterWithAllDetailsResponse
    ): boolean {
        switch (condition.conditionType) {
            case FeatureEntityConditionType.character_level:
                const characterLevel = this.getCharacterLevel(character);
                return characterLevel >= condition.conditionValue;

            case FeatureEntityConditionType.character_size:
                return character.race?.sizeId === condition.conditionValue;

            case FeatureEntityConditionType.character_alignment:
                return character.alignmentId === condition.conditionValue;

            case FeatureEntityConditionType.class_level:
                // Would need to check specific class level
                return true; // Placeholder

            case FeatureEntityConditionType.has_feature:
                // Would need to check if character has specific feature
                return true; // Placeholder

            case FeatureEntityConditionType.has_choice:
                // Would need to check if character has made specific choice
                return true; // Placeholder

            default:
                // Unknown condition type - default to true to avoid hiding features
                return true;
        }
    }

    /**
     * Gets character's total level
     */
    private static getCharacterLevel(character: CharacterWithAllDetailsResponse): number {
        if (!character.advancements || character.advancements.length === 0) {
            return 0;
        }
        return character.advancements.reduce((max, adv) => Math.max(max, adv.level || 0), 0);
    }
}

