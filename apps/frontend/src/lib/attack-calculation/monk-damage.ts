import type { FeatureWithRelations, FeatureEntity } from '@shared/schema';
import {
    EntityType,
    EntityAppliesToType,
    FeatureEntityConditionType,
    FormulaId,
    SizeId,
} from '@shared/static-data';

/**
 * Get monk unarmed strike damage from resolved features
 * Extracts Replacement entities with appliesTo: UnarmedDamage
 * Calculates value based on character level and size using formula system
 * 
 * @param resolvedProgressions - Resolved feature features
 * @param characterLevel - Current character level
 * @param characterSizeId - Character size ID (from race)
 * @returns Damage dice string (e.g., "1d6") or null if not a monk
 */
export function getMonkUnarmedDamage(
    resolvedProgressions: FeatureWithRelations[],
    characterLevel: number,
    characterSizeId: number
): string | null {
    // Find Replacement entities with appliesTo: UnarmedDamage
    const unarmedDamageEntities: FeatureEntity[] = [];
    
    for (const feature of resolvedProgressions) {
        if (feature.entities) {
            for (const entity of feature.entities) {
                if (entity.type === EntityType.Replacement &&
                    entity.appliesTo === EntityAppliesToType.UnarmedDamage) {
                    // Check if entity has size condition matching character size
                    // If no size condition, assume Medium
                    const hasSizeCondition = entity.conditions?.some(
                        cond => cond.conditionType === FeatureEntityConditionType.character_size
                    );
                    
                    if (!hasSizeCondition) {
                        // No size condition = Medium size
                        if (characterSizeId === SizeId.Medium) {
                            unarmedDamageEntities.push(entity);
                        }
                    } else {
                        // Check if size condition matches
                        const sizeCondition = entity.conditions?.find(
                            cond => cond.conditionType === FeatureEntityConditionType.character_size
                        );
                        if (sizeCondition && sizeCondition.conditionValue === characterSizeId) {
                            unarmedDamageEntities.push(entity);
                        }
                    }
                }
            }
        }
    }
    
    if (unarmedDamageEntities.length === 0) {
        return null; // Not a monk or no unarmed damage replacement found
    }
    
    // Use the first matching entity (should only be one per size)
    const entity = unarmedDamageEntities[0];
    
    if (!entity.formulaParams) {
        return null;
    }
    
    // Calculate damage using formula system
    // Formula ID 3 is CONDITIONAL_SCALING (threshold-based formula)
    const formulaParams = entity.formulaParams;
    if (formulaParams.formulaId !== FormulaId.CONDITIONAL_SCALING) {
        return null;
    }
    
    if (!formulaParams.thresholds || !formulaParams.values) {
        return null;
    }
    
    // Thresholds and values are arrays in the resolved schema
    const thresholds = formulaParams.thresholds;
    const values = formulaParams.values.map(v => String(v));
    
    // Find the appropriate threshold for current level
    let selectedValue: string | null = null;
    for (let i = thresholds.length - 1; i >= 0; i--) {
        if (characterLevel >= thresholds[i]) {
            selectedValue = values[i];
            break;
        }
    }
    
    // If no threshold matched, use first value
    if (selectedValue === null && values.length > 0) {
        selectedValue = values[0];
    }
    
    return selectedValue || null;
}

