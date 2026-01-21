import { useCallback } from 'react';

import { displayStrategyFactory } from '@/lib/formatters';
import type { FeatureEntity } from '@shared/schema';
import { DisplayType, FeatureSourceType } from '@shared/static-data';

export function useFormulaPreview() {
    // Generate formula preview for an entity
    const generateFormulaPreview = useCallback((
        item: FeatureEntity,
        featureLevel: number,
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
            // FeatureWithRelations is now the unified Feature model
            const mockFeature = {
                id: 0,
                slug: 'preview-feature',
                name: featureName || 'Preview Feature',
                description: '',
                displayInCharacterSheet: true,
                sourceType: FeatureSourceType.Class,
                level: featureLevel,
                entities: [item]
            };

            // Use Display Strategy to properly orchestrate the 6-layer formatting process
            const editStrategy = displayStrategyFactory.createStrategy(DisplayType.Edit);

            const displayResult = editStrategy.format(
                mockFeature,
                {
                    currentLevel: featureLevel,
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
