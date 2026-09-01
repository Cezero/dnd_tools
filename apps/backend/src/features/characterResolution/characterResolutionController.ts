import type { CharacterWithAllDetailsResponse, ClassSpellSelection, FeatureWithRelations } from '@shared/schema';
import { EntityAppliesToType } from '@shared/static-data';

import { characterService } from '../character/characterService';
import { ResolvedFeatureService } from './resolvedFeatureService';

/**
 * Filters out entities with invalid appliesTo values from features.
 * This prevents validation errors when returning data to the frontend.
 * 
 * Logs warnings for each filtered entity to help identify database records that need fixing.
 * 
 * @param features - Array of feature features to filter
 * @returns Filtered features with only valid entities
 */
export function filterInvalidAppliesToEntities(features: FeatureWithRelations[]): FeatureWithRelations[] {
    const validAppliesToValues = new Set(Object.values(EntityAppliesToType));
    return features.map(feature => {
        if (!feature.entities || feature.entities.length === 0) {
            return feature;
        }

        const validEntities: typeof feature.entities = [];
        const invalidEntities: typeof feature.entities = [];

        for (const entity of feature.entities) {
            if (validAppliesToValues.has(entity.appliesTo)) {
                validEntities.push(entity);
            } else {
                invalidEntities.push(entity);
            }
        }

        // Log warnings for invalid entities
        if (invalidEntities.length > 0) {
            for (const entity of invalidEntities) {
                console.warn(
                    `[Character Resolution] Filtered entity with invalid appliesTo value:`,
                    {
                        featureId: feature.id,
                        entityId: entity.id,
                        invalidAppliesTo: entity.appliesTo,
                        entityType: entity.type,
                        appliesToId: entity.appliesToId,
                        validAppliesToValues: Array.from(validAppliesToValues).sort((a, b) => a - b)
                    }
                );
            }
        }

        return {
            ...feature,
            entities: validEntities
        };
    });
}

/**
 * Calculate spell selection data for all spellcasting classes in a character.
 * 
 * This function iterates through all classes the character has (from advancements)
 * and calculates spell selection data for each spellcasting class using resolved features.
 * 
 * @param characterId - The character ID
 * @param character - The character data with advancements
 * @param resolvedProgressions - The resolved feature features
 * @returns Record mapping classId (as string) to ClassSpellSelection data
 */
export async function calculateSpellSelection(
    characterId: number,
    character: CharacterWithAllDetailsResponse,
    resolvedProgressions: FeatureWithRelations[]
): Promise<Record<string, ClassSpellSelection>> {
    const spellSelection: Record<string, ClassSpellSelection> = {};

    if (!character.advancements || character.advancements.length === 0) {
        return spellSelection;
    }

    // Get all unique class IDs from advancements (including secondary classes)
    const classIds = new Set<number>();
    for (const adv of character.advancements) {
        if (adv.classId) {
            classIds.add(adv.classId);
        }
        if (adv.secondaryClassId) {
            classIds.add(adv.secondaryClassId);
        }
    }

    // Pre-compute class levels for the character (including secondary classes)
    const classLevels = new Map<number, number>();
    for (const adv of character.advancements) {
        if (adv.classId) {
            classLevels.set(adv.classId, (classLevels.get(adv.classId) ?? 0) + 1);
        }
        if (adv.secondaryClassId) {
            classLevels.set(adv.secondaryClassId, (classLevels.get(adv.secondaryClassId) ?? 0) + 1);
        }
    }

    // For each class, check if it's spellcasting and calculate spell selection data
    for (const classId of classIds) {
        try {
            const spellData = await characterService.getAvailableSpellsForClass(
                characterId,
                classId,
                resolvedProgressions,
                characterId < 1 ? character : undefined
            );

            // Only include if the class has spells or is a spellcasting class
            if (spellData.spells.length > 0 || spellData.domainSpells.length > 0 || spellData.availableFreeSpells !== undefined) {
                // Transform to match schema format
                const spells = spellData.spells.map(s => ({
                    ...s.spell,
                    classSpellLevel: s.classSpellLevel,
                    isKnown: s.isKnown,
                }));

                const domainSpells = spellData.domainSpells.map(ds => ({
                    ...ds.spell,
                    classSpellLevel: ds.classSpellLevel,
                    isKnown: ds.isKnown,
                    domainId: ds.domainId,
                    domainName: ds.domainName,
                    domainSpellLevel: ds.spellLevel,
                }));

                // Derive feature-based spells-known limits for SpellsKnown classes, if any.
                const classLevel = classLevels.get(classId) ?? 0;
                let maxSpellsKnownByLevel: Record<string, number> | undefined;
                if (classLevel > 0) {
                    const spellsKnownByLevel = ResolvedFeatureService.getSpellsKnownByLevelFromFeaturesForClass(
                        resolvedProgressions,
                        classId,
                        classLevel,
                        character
                    );
                    if (Object.keys(spellsKnownByLevel).length > 0) {
                        maxSpellsKnownByLevel = {};
                        for (const [levelStr, value] of Object.entries(spellsKnownByLevel)) {
                            maxSpellsKnownByLevel[levelStr] = value;
                        }
                    }
                }

                spellSelection[classId.toString()] = {
                    spells,
                    ...(domainSpells.length > 0 && { domainSpells }),
                    ...(spellData.availableFreeSpells !== undefined && { availableFreeSpells: spellData.availableFreeSpells }),
                    ...(maxSpellsKnownByLevel && { maxSpellsKnownByLevel }),
                };
            }
        } catch (error) {
            // Log error but don't fail resolution if spell selection calculation fails
            console.error(`Failed to calculate spell selection for class ${classId}:`, error);
        }
    }

    return spellSelection;
}
