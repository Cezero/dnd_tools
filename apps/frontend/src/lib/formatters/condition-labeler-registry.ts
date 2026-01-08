import { FeatureEntityConditionType, EntityAppliesToType, CompanionBenefitConditionType } from '@shared/static-data';

import {
    materialConditionLabeler,
    sourceConditionLabeler,
    sizeConditionLabeler,
    creatureTypeConditionLabeler,
    spellSchoolConditionLabeler,
    attackTypeConditionLabeler,
    targetConditionLabeler,
    environmentConditionLabeler,
    spellSchoolSpellDCLabeler,
    lightingConditionLabeler
} from './condition-labelers';
import type { ConditionLabeler } from './condition-labelers';
// Custom key generation for condition labelers
function generateConditionKey(conditionType: FeatureEntityConditionType, appliesToType?: EntityAppliesToType): string {
    return appliesToType !== undefined ? `${conditionType}-${appliesToType}` : `${conditionType}`;
}

/**
 * Registry for condition labelers with context-aware support
 */
class ConditionLabelerRegistry {
    private labelers = new Map<string, ConditionLabeler>();

    constructor() {
        this.initializeDefaultLabelers();
    }

    /**
     * Register a labeler for a specific condition type with optional entity context
     */
    registerLabeler(
        conditionType: FeatureEntityConditionType,
        appliesToType: EntityAppliesToType | undefined,
        labeler: ConditionLabeler
    ): void {
        const key = generateConditionKey(conditionType, appliesToType);
        this.labelers.set(key, labeler);
    }

    /**
     * Get a labeler for a specific condition type with optional entity context
     */
    getLabeler(
        conditionType: FeatureEntityConditionType,
        appliesToType?: EntityAppliesToType
    ): ConditionLabeler | undefined {
        // First try to get context-specific labeler
        if (appliesToType !== undefined) {
            const contextKey = generateConditionKey(conditionType, appliesToType);
            const contextLabeler = this.labelers.get(contextKey);
            if (contextLabeler) {
                return contextLabeler;
            }
        }

        // Fall back to general labeler for this condition type
        const generalKey = generateConditionKey(conditionType);
        return this.labelers.get(generalKey);
    }

    /**
     * Initialize default labelers for all condition types
     */
    private initializeDefaultLabelers(): void {
        // Register general labelers for all condition types
        this.registerLabeler(FeatureEntityConditionType.material, undefined, materialConditionLabeler);
        this.registerLabeler(FeatureEntityConditionType.source, undefined, sourceConditionLabeler);
        this.registerLabeler(FeatureEntityConditionType.character_size, undefined, sizeConditionLabeler);
        this.registerLabeler(FeatureEntityConditionType.creature_type, undefined, creatureTypeConditionLabeler);
        this.registerLabeler(FeatureEntityConditionType.spell_school, undefined, spellSchoolConditionLabeler);
        this.registerLabeler(FeatureEntityConditionType.attack_type, undefined, attackTypeConditionLabeler);
        this.registerLabeler(FeatureEntityConditionType.target, undefined, targetConditionLabeler);
        this.registerLabeler(FeatureEntityConditionType.environment, undefined, environmentConditionLabeler);
        // Register lighting condition labeler (CompanionBenefitConditionType.lighting = 8)
        this.registerLabeler(CompanionBenefitConditionType.lighting as FeatureEntityConditionType, undefined, lightingConditionLabeler);

        // Register context-specific labelers
        this.registerLabeler(FeatureEntityConditionType.spell_school, EntityAppliesToType.SpellSvDC, spellSchoolSpellDCLabeler);
    }
}

export const conditionLabelerRegistry = new ConditionLabelerRegistry();
