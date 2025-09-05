import { useCallback } from 'react';

import { displayStrategyFactory } from '@/lib/formatters';
import type { FeatureModifier, FeatureChoice } from '@shared/schema';
import { DisplayType, FeatureSourceType } from '@shared/static-data';

export function useFormulaPreview() {
    // Generate formula preview for a modifier or choice
    const generateFormulaPreview = useCallback((
        item: FeatureModifier | FeatureChoice,
        progressionLevel: number,
        featureName?: string
    ): string | null => {
        // Determine if this is a choice by checking for choice-specific properties
        const isChoice = 'behavior' in item;

        // Get formula ID from the appropriate source
        const formulaId = isChoice
            ? (item as FeatureChoice).formulaParams?.formulaId
            : (item as FeatureModifier).formulaParams?.formulaId;

        if (!formulaId) {
            return null;
        }

        try {
            // Create a mock progression for the display strategy to work with
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
                    slug: 'preview-feature'
                },
                modifiers: isChoice ? [] : [item as FeatureModifier],
                choices: isChoice ? [item as FeatureChoice] : [],
                effects: []
            };

            // Use Display Strategy to properly orchestrate the 6-layer formatting process
            const editStrategy = displayStrategyFactory.createStrategy(DisplayType.Edit);
            const displayResult = editStrategy.format(
                mockProgression,
                {
                    displayType: DisplayType.Edit,
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
        item: FeatureModifier | FeatureChoice
    ): boolean => {
        const isChoice = 'behavior' in item;
        const formulaId = isChoice
            ? (item as FeatureChoice).formulaParams?.formulaId
            : (item as FeatureModifier).formulaParams?.formulaId;

        return !!formulaId;
    }, []);

    return {
        generateFormulaPreview,
        hasPreviewableFormula
    };
}
