import type { FeatureProgression, Feature, FeatureProgressionCondition, CharacterWithAllDetailsResponse } from '@shared/schema';
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
        _character: CharacterWithAllDetailsResponse
    ): boolean {
        switch (condition.conditionType) {
            case FeatureEntityConditionType.character_size:
                // CharacterWithAllDetailsResponse.race only includes id and name, not sizeId
                // TODO: Add sizeId to race data or fetch race details separately to evaluate this condition
                return true; // Placeholder - default to true to avoid hiding features

            default:
                // Unknown condition type - default to true to avoid hiding features
                // Note: Other condition types (material, attack_type, target, environment, 
                // spell_school, creature_type, source, lighting, special) are not yet
                // implemented for display filtering
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

