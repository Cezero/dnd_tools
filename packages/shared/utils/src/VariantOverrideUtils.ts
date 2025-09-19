import {
    FeatureProgression,
    FeatureEntity,
    ClassVariantFeatureProgressionOverride,
    ClassSpellListEntry
} from '@shared/schema';

/**
 * Shared utility functions for applying variant overrides to base class data.
 * This ensures consistent logic between frontend editing and backend resolution.
 */

/**
 * Apply feature progression overrides to base class features using new resolution logic
 */
export function applyFeatureProgressionOverrides(
    baseFeatures: FeatureProgression[],
    featureOverrides: ClassVariantFeatureProgressionOverride[]
): FeatureProgression[] {
    if (!featureOverrides || featureOverrides.length === 0) {
        return baseFeatures;
    }

    let result = [...baseFeatures];

    // Apply each feature progression override
    featureOverrides.forEach(override => {
        if (override.originalFeatureProgressionId === null) {
            // Add new feature progression
            if (override.replacementFeatureProgression && override.replacementFeatureProgression.length > 0) {
                result.push(...override.replacementFeatureProgression);
            }
        } else {
            // Find the original feature progression
            const originalIndex = result.findIndex(feature => feature.id === override.originalFeatureProgressionId);

            if (originalIndex !== -1) {
                if (override.replacementFeatureProgression === null) {
                    // Remove original feature progression
                    result.splice(originalIndex, 1);
                } else if (override.replacementFeatureProgression.length > 0 || (override.removeEntities && override.removeEntities.length > 0)) {
                    // Check if we're replacing with a different feature
                    const originalFeatureProgression = result[originalIndex];

                    if (override.replacementFeatureProgression.length > 0) {
                        const replacementFeatureProgression = override.replacementFeatureProgression[0];

                        if (replacementFeatureProgression.featureId !== originalFeatureProgression.featureId) {
                            // Remove original and add replacement
                            result.splice(originalIndex, 1);
                            result.push(replacementFeatureProgression);
                        } else {
                            // Same feature, modify entities
                            let modifiedEntities = [...(originalFeatureProgression.entities || [])];

                            // Remove entities specified in removeEntities
                            if (override.removeEntities && override.removeEntities.length > 0) {
                                const removeEntityIds = override.removeEntities.map(re => re.featureEntityId);
                                modifiedEntities = modifiedEntities.filter(entity => !removeEntityIds.includes(entity.id));
                            }

                            // Add entities from replacement progression
                            if (replacementFeatureProgression.entities && replacementFeatureProgression.entities.length > 0) {
                                modifiedEntities.push(...replacementFeatureProgression.entities);
                            }

                            // Update the original feature progression
                            result[originalIndex] = {
                                ...originalFeatureProgression,
                                entities: modifiedEntities
                            };
                        }
                    } else {
                        // No replacement feature progression, but we have entities to remove
                        let modifiedEntities = [...(originalFeatureProgression.entities || [])];

                        // Remove entities specified in removeEntities
                        if (override.removeEntities && override.removeEntities.length > 0) {
                            const removeEntityIds = override.removeEntities.map(re => re.featureEntityId);
                            modifiedEntities = modifiedEntities.filter(entity => !removeEntityIds.includes(entity.id));
                        }

                        // Update the original feature progression
                        result[originalIndex] = {
                            ...originalFeatureProgression,
                            entities: modifiedEntities
                        };
                    }
                }
            }
        }
    });

    return result;
}

export function applySpellOverrides(
    baseSpells: ClassSpellListEntry[],
    spellOverrides: ClassSpellListEntry[]
): ClassSpellListEntry[] {
    // Start with base class spell list
    let result = [...baseSpells];

    // Apply additions (level > 0)
    const additions = spellOverrides.filter(override => override.level > 0);
    additions.forEach(addition => {
        // Check if spell already exists at this level
        const existingIndex = result.findIndex(spell =>
            spell.spellId === addition.spellId && spell.level === addition.level
        );

        if (existingIndex === -1) {
            // Add new spell entry
            result.push({
                spellId: addition.spellId,
                level: addition.level
            });
        }
    });

    // Apply removals (level = -1)
    const removals = spellOverrides.filter(override => override.level === -1);
    const removalSpellIds = removals.map(r => r.spellId);
    result = result.filter(spell => !removalSpellIds.includes(spell.spellId));

    return result;
}

export function generateFeatureProgressionOverrides(
    baseFeatures: FeatureProgression[],
    currentFeatures: FeatureProgression[]
): ClassVariantFeatureProgressionOverride[] {
    const overrides: ClassVariantFeatureProgressionOverride[] = [];

    // Create maps for easier comparison
    const baseFeatureMap = new Map();
    const currentFeatureMap = new Map();

    // Index base features by featureId + level
    baseFeatures.forEach(feature => {
        const key = `${feature.featureId}-${feature.level}`;
        baseFeatureMap.set(key, feature);
    });

    // Index current features by featureId + level (include all features, including those with temporary IDs)
    currentFeatures.forEach(feature => {
        const key = `${feature.featureId}-${feature.level}`;
        currentFeatureMap.set(key, feature);
    });

    // Find removed features (in base but not in current)
    for (const [key, baseFeature] of baseFeatureMap) {
        if (!currentFeatureMap.has(key)) {
            overrides.push({
                id: 0, // Will be set by database
                variantId: 0, // Will be set by database
                originalFeatureProgressionId: baseFeature.id,
                replacementFeatureProgression: null,
                removeEntities: null
            } as ClassVariantFeatureProgressionOverride);
        }
    }

    // Find added features (in current but not in base)
    for (const [key, currentFeature] of currentFeatureMap) {
        if (!baseFeatureMap.has(key)) {
            // Include all entities, including those with temporary IDs (new entities)
            overrides.push({
                id: 0, // Will be set by database
                variantId: 0, // Will be set by database
                originalFeatureProgressionId: null,
                replacementFeatureProgression: [{
                    ...currentFeature,
                    entities: currentFeature.entities || []
                }],
                removeEntities: null
            } as ClassVariantFeatureProgressionOverride);
        }
    }

    // Find modified features (same feature but different entities)
    for (const [key, currentFeature] of currentFeatureMap) {
        const baseFeature = baseFeatureMap.get(key);
        if (baseFeature) {
            // Include all current entities (both existing and new with temporary IDs)
            const currentEntities = currentFeature.entities || [];

            // Find entities to remove (in base but not in current)
            const baseEntityIds = (baseFeature.entities || []).map((e: FeatureEntity) => e.id);
            const currentEntityIds = currentEntities.map((e: FeatureEntity) => e.id);
            const removedEntityIds = baseEntityIds.filter((id: number) => !currentEntityIds.includes(id));

            // Find entities to add (in current but not in base - includes entities with temporary IDs)
            const addedEntities = currentEntities.filter((entity: FeatureEntity) =>
                !baseEntityIds.includes(entity.id)
            );

            if (removedEntityIds.length > 0 || addedEntities.length > 0) {
                overrides.push({
                    id: 0, // Will be set by database
                    variantId: 0, // Will be set by database
                    originalFeatureProgressionId: baseFeature.id,
                    replacementFeatureProgression: addedEntities.length > 0 ? [{
                        ...currentFeature,
                        entities: addedEntities
                    }] : null,
                    removeEntities: removedEntityIds.length > 0 ? removedEntityIds.map((id: number) => ({
                        classVariantFeatureProgressionOverrideId: 0, // Will be set by database
                        featureEntityId: id
                    })) : null
                } as ClassVariantFeatureProgressionOverride);
            }
        }
    }

    return overrides;
}
