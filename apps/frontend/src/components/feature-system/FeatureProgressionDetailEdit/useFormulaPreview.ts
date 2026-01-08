import { useCallback } from 'react';

import { displayStrategyFactory } from '@/lib/formatters';
import type { FeatureEntity } from '@shared/schema';
import { DisplayType, FeatureSourceType } from '@shared/static-data';

export function useFormulaPreview() {
    // Generate formula preview for an entity
    const generateFormulaPreview = useCallback((
        item: FeatureEntity,
        progressionLevel: number,
        featureName?: string
    ): string | null => {
        // All entities are now unified, no need to distinguish between types

        // Get formula ID from the entity
        const formulaId = item.formulaParams?.formulaId;

        if (!formulaId) {
            return null;
        }

        try {
            // Use the standard display strategy for ALL entities
            // Phase 1 now handles formula-determined intervals for all entity types
            const mockProgression = {
                id: 0,
                sourceType: FeatureSourceType.Class,
                classId: 0,
                raceId: null,
                level: progressionLevel,
                featureId: 0,
                feature: {
                    id: 0,
                    name: featureName || 'Preview Feature',
                    description: '',
                    slug: 'preview-feature',
                    displayInCharacterSheet: true
                },
                entities: [item],
                effects: []
            };

            // Use Display Strategy to properly orchestrate the 6-layer formatting process
            const editStrategy = displayStrategyFactory.createStrategy(DisplayType.Edit);

            const displayResult = editStrategy.format(
                mockProgression,
                {
                    currentLevel: progressionLevel,
                    showBreakdown: false
                }
            );

            return displayResult.formattedValue || 'No preview available';
        } catch (error) {
            console.error('Formula Preview Error:', error);
            return `Error generating preview: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }, []);


    // Check if an item has a formula that can be previewed
    const hasPreviewableFormula = useCallback((
        item: FeatureEntity
    ): boolean => {
        const formulaId = item.formulaParams?.formulaId;
        return !!formulaId;
    }, []);

    return {
        generateFormulaPreview,
        hasPreviewableFormula
    };
}
