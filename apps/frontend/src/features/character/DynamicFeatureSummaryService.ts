import { extractRaceMechanics } from '@/lib/feature-extraction/raceMechanicsExtractor';
import { FeatureDisplayFilter } from '@/lib/formatters/FeatureDisplayFilter';
import { FeatureTemplateResolver } from '@/lib/formatters/FeatureTemplateResolver';
import type { DisplayContext, FormattedItemWithLevel, CharacterSheetDisplayResult } from '@/lib/formatters/types';
import type {
    FeatureWithRelations,
    Feature,
    CharacterWithAllDetailsResponse,
    CharacterFeatureChoice,
    CharacterCompanion,
    Monster,
    Deity,
    Domain,
} from '@shared/schema';

import { ClericEnergyChoiceResolver } from './ClericEnergyChoiceResolver';


/**
 * Service for generating dynamic feature summaries using templates
 */
export class DynamicFeatureSummaryService {
    /**
     * Builds extended DisplayContext from character data
     */
    static buildDisplayContext(
        character: CharacterWithAllDetailsResponse,
        choices: CharacterFeatureChoice[],
        companions: CharacterCompanion[],
        deity: Deity | null | undefined,
        domains: Domain[],
        transformationForms: Map<number, Monster[]>,
        resolvedProgressions?: FeatureWithRelations[]
    ): DisplayContext {
        // Group choices by choiceGroupId
        const choicesMap = new Map<string, CharacterFeatureChoice>();
        for (const choice of choices) {
            if (choice.choiceGroupId) {
                choicesMap.set(choice.choiceGroupId, choice);
            }
        }

        // Resolve cleric energy choice
        const clericEnergyChoice = ClericEnergyChoiceResolver.resolveClericEnergyChoice(
            character,
            deity,
            choicesMap
        );

        // Extract sizeId from resolved features
        const raceMechanics = character.raceId && resolvedProgressions
            ? extractRaceMechanics(resolvedProgressions, character.raceId)
            : null;

        return {
            character: {
                abilityScores: this.getAbilityScoresMap(character),
                classLevels: this.getClassLevelsMap(character),
                raceId: character.raceId,
                sizeId: raceMechanics?.sizeId ?? undefined,
            },
            currentLevel: this.getCharacterLevel(character),
            choices: choicesMap,
            companions,
            deity,
            domains,
            transformationForms,
            clericEnergyChoice: clericEnergyChoice || undefined,
        };
    }

    /**
     * Resolves a feature summary, parsing it as a template if it contains placeholders
     * This operates as a final stage after all formatting is complete
     */
    static resolveFeatureSummary(
        baseFeature: Feature,
        featureWithRelations: FeatureWithRelations,
        context: DisplayContext,
        character: CharacterWithAllDetailsResponse,
        resolvedProgressions?: FeatureWithRelations[],
        formattedItems?: FormattedItemWithLevel[],
        formattedCharacterResult?: CharacterSheetDisplayResult
    ): string | null {
        const summary = baseFeature.summary;
        if (!summary) {
            return null;
        }

        // Check if summary contains template placeholders
        const hasPlaceholders = /\{\{([^}]+)\}\}/.test(summary);

        if (hasPlaceholders) {
            // Parse as template
            return FeatureTemplateResolver.resolveTemplate(
                summary,
                context,
                character,
                baseFeature,
                featureWithRelations,
                resolvedProgressions,
                formattedItems,
                formattedCharacterResult
            );
        }

        // Return as static text
        return summary;
    }

    /**
     * Filters features that should be displayed
     */
    static filterDisplayableFeatures(
        features: Array<{ baseFeature: Feature; feature: FeatureWithRelations }>,
        character: CharacterWithAllDetailsResponse
    ): Array<{ baseFeature: Feature; feature: FeatureWithRelations }> {
        return features.filter(({ baseFeature, feature }) =>
            FeatureDisplayFilter.shouldDisplayFeature(baseFeature, feature, character)
        );
    }

    /**
     * Gets ability scores as a map
     */
    private static getAbilityScoresMap(character: CharacterWithAllDetailsResponse): Record<number, number> {
        const map: Record<number, number> = {};
        if (character.abilityScores) {
            for (const score of character.abilityScores) {
                map[score.abilityId] = score.value;
            }
        }
        return map;
    }

    /**
     * Gets class levels as a map
     */
    private static getClassLevelsMap(character: CharacterWithAllDetailsResponse): Record<number, number> {
        const map: Record<number, number> = {};
        if (character.advancements) {
            for (const advancement of character.advancements) {
                if (advancement.classId) {
                    map[advancement.classId] = (map[advancement.classId] || 0) + 1;
                }
            }
        }
        return map;
    }

    /**
     * Gets character's total level
     */
    private static getCharacterLevel(character: CharacterWithAllDetailsResponse): number {
        if (!character.advancements || character.advancements.length === 0) {
            return 0;
        }
        return character.advancements.reduce((max, adv) => Math.max(max, adv.level || 0), 0);
    }
}

