import { FeatureEntityConditionType } from '@shared/static-data';

import {
    materialConditionLabeler,
    sourceConditionLabeler,
    sizeConditionLabeler,
    creatureTypeConditionLabeler,
    spellSchoolConditionLabeler,
    attackTypeConditionLabeler,
    targetConditionLabeler,
    environmentConditionLabeler
} from './condition-labelers';
import type { ConditionLabeler } from './condition-labelers';

/**
 * Registry for condition labelers
 */
class ConditionLabelerRegistry {
    private labelers = new Map<FeatureEntityConditionType, ConditionLabeler>();

    constructor() {
        this.initializeDefaultLabelers();
    }

    /**
     * Register a labeler for a specific condition type
     */
    registerLabeler(conditionType: FeatureEntityConditionType, labeler: ConditionLabeler): void {
        this.labelers.set(conditionType, labeler);
    }

    /**
     * Get a labeler for a specific condition type
     */
    getLabeler(conditionType: FeatureEntityConditionType): ConditionLabeler | undefined {
        return this.labelers.get(conditionType);
    }

    /**
     * Initialize default labelers for all condition types
     */
    private initializeDefaultLabelers(): void {
        this.registerLabeler(FeatureEntityConditionType.material, materialConditionLabeler);
        this.registerLabeler(FeatureEntityConditionType.source, sourceConditionLabeler);
        this.registerLabeler(FeatureEntityConditionType.character_size, sizeConditionLabeler);
        this.registerLabeler(FeatureEntityConditionType.creature_type, creatureTypeConditionLabeler);
        this.registerLabeler(FeatureEntityConditionType.spell_school, spellSchoolConditionLabeler);
        this.registerLabeler(FeatureEntityConditionType.attack_type, attackTypeConditionLabeler);
        this.registerLabeler(FeatureEntityConditionType.target, targetConditionLabeler);
        this.registerLabeler(FeatureEntityConditionType.environment, environmentConditionLabeler);
    }
}

export const conditionLabelerRegistry = new ConditionLabelerRegistry();
