import type { FeatureWithRelations, FeatureEntity , CharacterWithAllDetailsResponse } from '@shared/schema';
import { EntityType, EntityAppliesToType } from '@shared/static-data';

import type { FeatureBonus, FormulaModification } from '../types';
import { applyFeatureFormula } from '../utils/formulaApplier';

/**
 * Resolve bonuses from resolved feature features
 */
export function resolveFeatureBonuses(
    resolvedProgressions: FeatureWithRelations[],
    appliesTo: EntityAppliesToType,
    character: CharacterWithAllDetailsResponse,
    level: number,
    context?: {
        itemId?: number;
        abilityId?: number;
    }
): FeatureBonus[] {
    const bonuses: FeatureBonus[] = [];

    for (const feature of resolvedProgressions) {
        if (!feature.entities) continue;

        for (const entity of feature.entities) {
            // Check if entity applies to the requested type
            if (entity.appliesTo !== appliesTo) continue;

            // Base values (race speed, BAB, etc.) are extracted separately.
            // Including them here double-counts (e.g. Human 30 ft + 30 ft = 60).
            if (entity.type === EntityType.Base) continue;

            // Skip entities with conditions - these are conditional modifiers and should not be included in regular bonuses
            if (entity.conditions && entity.conditions.length > 0) {
                continue;
            }

            // Check item-specific filtering
            if (context?.itemId && entity.appliesToId !== context.itemId) {
                continue;
            }

            // Check ability-specific filtering
            if (context?.abilityId && entity.appliesToId !== context.abilityId) {
                continue;
            }

            // Calculate value (may use formula)
            let value = entity.value ?? 0;
            if (entity.formulaParams) {
                const calculatedValue = applyFeatureFormula(entity, character, level);
                if (calculatedValue !== null) {
                    value = calculatedValue;
                }
            }

            if (value === 0 && entity.type !== EntityType.Bonus) {
                continue; // Skip zero values for non-bonus entities
            }

            bonuses.push({
                value,
                source: {
                    type: 'feature',
                    id: feature.id ?? 0,
                    name: feature.name ?? 'Unknown Feature',
                },
                context: {
                    itemId: entity.appliesToId ?? undefined,
                    abilityId: entity.appliesToId ?? undefined,
                },
            });
        }
    }

    return bonuses;
}

/**
 * Resolve formula modifications from features
 */
export function resolveFeatureFormulaModifications(
    resolvedProgressions: FeatureWithRelations[],
    character: CharacterWithAllDetailsResponse,
    level: number
): FormulaModification[] {
    const modifications: FormulaModification[] = [];

    for (const feature of resolvedProgressions) {
        if (!feature.entities) continue;

        for (const entity of feature.entities) {
            // Check for ability addition (Monk AC Bonus)
            if (
                entity.type === EntityType.Bonus &&
                entity.appliesTo === EntityAppliesToType.AC &&
                entity.formulaParams
            ) {
                // Check if this is an ability modifier formula
                if (entity.formulaParams.formulaId === 7) {
                    // Formula ID 7 is ABILITY_MODIFIER
                    const abilityId = entity.formulaParams.abilityId;
                    if (abilityId) {
                        modifications.push({
                            type: 'ability_addition',
                            parameters: {
                                additionalAbility: abilityId,
                            },
                            source: {
                                type: 'feature',
                                id: feature.id ?? 0,
                                name: feature.name ?? 'Unknown Feature',
                            },
                        });
                    }
                }
            }
        }
    }

    return modifications;
}

