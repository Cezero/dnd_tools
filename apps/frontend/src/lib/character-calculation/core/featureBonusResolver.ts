import type { FeatureProgression, FeatureEntity } from '@shared/schema';
import { EntityType, EntityAppliesToType } from '@shared/static-data';
import type { CharacterWithAllDetailsResponse } from '@shared/schema';
import { applyFeatureFormula } from '../utils/formulaApplier';
import type { FeatureBonus, FormulaModification } from '../types';

/**
 * Resolve bonuses from resolved feature progressions
 */
export function resolveFeatureBonuses(
    resolvedProgressions: FeatureProgression[],
    appliesTo: EntityAppliesToType,
    character: CharacterWithAllDetailsResponse,
    level: number,
    context?: {
        itemId?: number;
        abilityId?: number;
    }
): FeatureBonus[] {
    const bonuses: FeatureBonus[] = [];

    for (const progression of resolvedProgressions) {
        if (!progression.entities) continue;

        for (const entity of progression.entities) {
            // Check if entity applies to the requested type
            if (entity.appliesTo !== appliesTo) continue;

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
                    id: progression.featureId ?? 0,
                    name: progression.feature?.name ?? 'Unknown Feature',
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
    resolvedProgressions: FeatureProgression[],
    character: CharacterWithAllDetailsResponse,
    level: number
): FormulaModification[] {
    const modifications: FormulaModification[] = [];

    for (const progression of resolvedProgressions) {
        if (!progression.entities) continue;

        for (const entity of progression.entities) {
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
                                id: progression.featureId ?? 0,
                                name: progression.feature?.name ?? 'Unknown Feature',
                            },
                        });
                    }
                }
            }
        }
    }

    return modifications;
}

