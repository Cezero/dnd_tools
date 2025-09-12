import { z } from 'zod';
import {
    ABILITY_LIST,
    ABILITY_MAP,
    SpecialFeatureId,
    EntityAppliesToType
} from '@shared/static-data';

// Import the actual types from the schema
import type { FeatureProgressionSchema } from '@shared/schema';

// Use the actual schema types
type FeatureProgressionWithRelations = z.infer<typeof FeatureProgressionSchema>;

export interface AbilityAdjustment {
    abilityId: number;
    value: number;
}

export class CharacterUtils {
    /**
     * Extract ability adjustments from feature progressions
     * @param features Array of feature progressions
     * @returns Array of ability adjustments with their values
     */
    static getAbilityAdjustments(features: FeatureProgressionWithRelations[]): AbilityAdjustment[] {
        const abilityFeatures = features.filter(fp =>
            fp.featureId === SpecialFeatureId.AbilityAdjustment &&
            fp.entities?.some(e => e.appliesTo === EntityAppliesToType.Ability)
        );

        const adjustments: AbilityAdjustment[] = [];

        // Collect all ability adjustments with their actual ability IDs
        for (const ability of ABILITY_LIST) {
            const abilityFeature = abilityFeatures.find(fp =>
                fp.featureId === SpecialFeatureId.AbilityAdjustment &&
                fp.entities?.some(e => e.appliesTo === EntityAppliesToType.Ability && e.appliesToId === ability.id)
            );
            const abilityEntity = abilityFeature?.entities?.find(e =>
                e.appliesTo === EntityAppliesToType.Ability && e.appliesToId === ability.id
            );
            if (abilityEntity && abilityEntity.value !== null && abilityEntity.value !== 0) {
                adjustments.push({
                    abilityId: ability.id,
                    value: abilityEntity.value
                });
            }
        }

        return adjustments;
    }

    /**
     * Get ability adjustment for a specific ability
     * @param features Array of feature progressions
     * @param abilityId The ability ID to get adjustment for
     * @returns The adjustment value for the specified ability
     */
    static getAbilityAdjustment(features: FeatureProgressionWithRelations[], abilityId: number): number {
        const abilityFeatures = features.filter(fp =>
            fp.featureId === SpecialFeatureId.AbilityAdjustment &&
            fp.entities?.some(e => e.appliesTo === EntityAppliesToType.Ability && e.appliesToId === abilityId)
        );

        const abilityEntity = abilityFeatures
            .flatMap(fp => fp.entities || [])
            .find(e => e.appliesTo === EntityAppliesToType.Ability && e.appliesToId === abilityId);

        return abilityEntity?.value ?? 0;
    }

    /**
     * Get formatted ability adjustments string for display
     * @param features Array of feature progressions
     * @returns Formatted string of ability adjustments (e.g., "STR +2, DEX +2, CON -2")
     */
    static getFormattedAbilityAdjustments(features: FeatureProgressionWithRelations[]): string {
        const adjustments = this.getAbilityAdjustments(features);

        if (adjustments.length === 0) {
            return 'None';
        }

        return adjustments
            .map(adj => {
                const ability = ABILITY_LIST.find(a => a.id === adj.abilityId);
                const sign = adj.value > 0 ? '+' : '';
                return `${ability?.abbreviation} ${sign}${adj.value}`;
            })
            .join(', ');
    }

    /**
     * Get all ability adjustments as a map for easy lookup
     * @param features Array of feature progressions
     * @returns Map of ability ID to adjustment value
     */
    static getAbilityAdjustmentsMap(features: FeatureProgressionWithRelations[]): Map<number, number> {
        const adjustments = this.getAbilityAdjustments(features);
        const map = new Map<number, number>();

        adjustments.forEach(adj => {
            map.set(adj.abilityId, adj.value);
        });

        return map;
    }

    /**
     * Calculate total ability score including racial adjustments
     * @param baseScore The base ability score
     * @param features Array of feature progressions
     * @param abilityId The ability ID to calculate for
     * @returns The total ability score including racial adjustments
     */
    static getTotalAbilityScore(baseScore: number, features: FeatureProgressionWithRelations[], abilityId: number): number {
        const adjustment = this.getAbilityAdjustment(features, abilityId);
        return baseScore + adjustment;
    }
}
