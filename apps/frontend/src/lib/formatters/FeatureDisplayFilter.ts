import type { FeatureWithRelations, Feature, FeatureCondition, CharacterWithAllDetailsResponse } from '@shared/schema';
import { EntityAppliesToType, FeatureEntityConditionType } from '@shared/static-data';

/**
 * Filters features based on display flags and conditions
 */
export class FeatureDisplayFilter {
    /**
     * Determines if a feature should be displayed on character sheets
     */
    static shouldDisplayFeature(
        baseFeature: Feature,
        featureWithRelations: FeatureWithRelations,
        character: CharacterWithAllDetailsResponse
    ): boolean {
        // Check displayInCharacterSheet flag
        if (baseFeature.displayInCharacterSheet === false) {
            return false;
        }

        // Check feature feature display conditions
        if (featureWithRelations.displayConditions && featureWithRelations.displayConditions.length > 0) {
            const shouldDisplay = this.evaluateDisplayConditions(
                featureWithRelations.displayConditions,
                character
            );
            if (!shouldDisplay) {
                return false;
            }
        }

        return true;
    }

    /**
     * Whether a feature belongs on the character viewer Features list (and PDF special abilities).
     *
     * `displayInCharacterSheet` hides the whole feature (BAB, saves, hit dice).
     * `displayInDetail` hides chassis entities. If every entity is hidden, the
     * feature is omitted. Class-skill and proficiency wrappers stay off this
     * list because they already appear on the Skills tab and Proficiencies section.
     */
    static shouldListFeatureInCharacterView(feature: FeatureWithRelations): boolean {
        if (feature.displayInCharacterSheet === false) {
            return false;
        }

        const entities = feature.entities ?? [];
        if (entities.length === 0) {
            return true;
        }

        const visibleEntities = entities.filter((entity) => entity.displayInDetail !== false);
        if (visibleEntities.length === 0) {
            return false;
        }

        if (visibleEntities.every((entity) => entity.appliesTo === EntityAppliesToType.Skill)) {
            return false;
        }

        if (visibleEntities.every((entity) => entity.appliesTo === EntityAppliesToType.Proficiency)) {
            return false;
        }

        return true;
    }

    /**
     * Evaluates display conditions for a feature feature
     */
    private static evaluateDisplayConditions(
        conditions: FeatureCondition[],
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
        condition: FeatureCondition,
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

