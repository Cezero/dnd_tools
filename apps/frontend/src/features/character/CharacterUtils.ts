import type { FeatureProgression } from '@shared/schema';
import {
    ABILITY_LIST,
    SpecialFeatureId,
    EntityAppliesToType
} from '@shared/static-data';

export interface AbilityAdjustment {
    abilityId: number;
    value: number;
}

export class CharacterUtils {
    static getAbilityAdjustments(features: FeatureProgression[]): AbilityAdjustment[] {
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

    static getAbilityAdjustment(features: FeatureProgression[], abilityId: number): number {
        const abilityFeatures = features.filter(fp =>
            fp.featureId === SpecialFeatureId.AbilityAdjustment &&
            fp.entities?.some(e => e.appliesTo === EntityAppliesToType.Ability && e.appliesToId === abilityId)
        );

        const abilityEntity = abilityFeatures
            .flatMap(fp => fp.entities || [])
            .find(e => e.appliesTo === EntityAppliesToType.Ability && e.appliesToId === abilityId);

        return abilityEntity?.value ?? 0;
    }

    static getFormattedAbilityAdjustments(features: FeatureProgression[]): string {
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

    static getAbilityAdjustmentsMap(features: FeatureProgression[]): Map<number, number> {
        const adjustments = this.getAbilityAdjustments(features);
        const map = new Map<number, number>();

        adjustments.forEach(adj => {
            map.set(adj.abilityId, adj.value);
        });

        return map;
    }

    static getTotalAbilityScore(baseScore: number, features: FeatureProgression[], abilityId: number): number {
        const adjustment = this.getAbilityAdjustment(features, abilityId);
        return baseScore + adjustment;
    }
}
