import { CreateFeatureProgressionRequest } from '@shared/schema';
import {
    SpecialFeatureId,
    ModifierAppliesToType
} from '@shared/static-data';

// Type definitions for feature progressions with relations
interface FeatureModifier {
    id: number;
    type: number;
    value: number;
    appliesTo: number | null;
    appliesToId: number | null;
    bonusType: number | null;
    appliesIfChoiceKey: string | null;
    appliesIfChoiceValue: string | null;
    conditions?: FeatureModifierCondition[];
}

interface FeatureModifierCondition {
    id: number;
    type: number;
    conditionValue: string | null;
}

interface FeatureChoice {
    id: number;
    type: string;
    behavior: string;
    // REMOVED: appliesToType - not used in FeatureChoice
    label: string | null;
    pickCount: number | null;
}

interface FeatureProgressionWithRelations {
    id: number;
    sourceType: number;
    level: number;
    featureId: number;
    // REMOVED: appliesToType and appliesTo - redundant with SpecialFeatureId
    modifiers?: FeatureModifier[];
    choices?: FeatureChoice[];
    effects?: unknown[];
}

export class LanguageService {
    /**
     * Extract automatic languages from feature progressions
     * @param progressions Array of feature progressions
     * @returns Array of language IDs that are automatically granted
     */
    static getAutomaticLanguages(progressions: FeatureProgressionWithRelations[] | CreateFeatureProgressionRequest[]): number[] {
        return progressions
            .flatMap(prog =>
                prog.modifiers
                    ?.filter(mod => mod.appliesTo === ModifierAppliesToType.AutomaticLanguage && mod.appliesToId)
                    .map(mod => mod.appliesToId!) || []
            )
            .filter(id => id > 0);
    }

    /**
     * Extract available bonus languages from feature progressions
     * @param progressions Array of feature progressions
     * @returns Array of language IDs available as bonus languages
     */
    static getBonusLanguages(progressions: FeatureProgressionWithRelations[] | CreateFeatureProgressionRequest[]): number[] {
        return progressions
            .flatMap(prog =>
                prog.modifiers
                    ?.filter(mod =>
                        mod.appliesTo === ModifierAppliesToType.BonusLanguage &&
                        mod.appliesToId
                    )
                    .map(mod => mod.appliesToId!) || []
            )
            .filter(id => id > 0);
    }

    /**
     * Extract class-granted bonus languages from feature progressions
     * @param progressions Array of feature progressions
     * @returns Array of language IDs granted by classes as bonus languages
     */
    static getClassBonusLanguages(progressions: FeatureProgressionWithRelations[] | CreateFeatureProgressionRequest[]): number[] {
        return progressions
            .filter(prog => this.isClassBonusLanguageFeature(prog))
            .flatMap(prog =>
                prog.modifiers
                    ?.filter(mod =>
                        mod.appliesTo === ModifierAppliesToType.BonusLanguage &&
                        mod.appliesToId
                    )
                    .map(mod => mod.appliesToId!) || []
            )
            .filter(id => id > 0);
    }

    /**
     * Get bonus language choice configuration from feature progressions
     * @param progressions Array of feature progressions
     * @returns Array of feature choices for bonus languages
     */
    static getBonusLanguageChoices(progressions: FeatureProgressionWithRelations[]): FeatureChoice[] {
        return progressions
            .filter(prog => prog.featureId === SpecialFeatureId.BonusLanguage)
            .flatMap(prog => prog.choices || []);
    }

    /**
     * Extract class-granted automatic languages from feature progressions
     * @param progressions Array of feature progressions
     * @returns Array of language IDs granted by classes as automatic languages
     */
    static getClassAutomaticLanguages(progressions: FeatureProgressionWithRelations[] | CreateFeatureProgressionRequest[]): number[] {
        return progressions
            .filter(prog => this.isClassLanguageFeature(prog))
            .flatMap(prog =>
                prog.modifiers
                    ?.filter(mod =>
                        mod.appliesTo === ModifierAppliesToType.AutomaticLanguage &&
                        mod.appliesToId
                    )
                    .map(mod => mod.appliesToId!) || []
            )
            .filter(id => id > 0);
    }

    /**
     * Check if a feature progression is a class language feature (automatic or bonus)
     * @param progression Feature progression to check
     * @returns True if this is a class language feature
     */
    static isClassLanguageFeature(progression: FeatureProgressionWithRelations | CreateFeatureProgressionRequest): boolean {
        return progression.sourceType === 1 && // FeatureSourceType.Class
            (progression.featureId === SpecialFeatureId.AutomaticLanguage || progression.featureId === SpecialFeatureId.BonusLanguage);
    }

    /**
     * Check if a feature progression is a class bonus language feature
     * @param progression Feature progression to check
     * @returns True if this is a class bonus language feature
     */
    static isClassBonusLanguageFeature(progression: FeatureProgressionWithRelations | CreateFeatureProgressionRequest): boolean {
        return this.isClassLanguageFeature(progression) &&
            progression.modifiers?.some(mod => mod.appliesTo === ModifierAppliesToType.BonusLanguage);
    }

    /**
     * Get all available bonus languages (racial + class) for a character
     * @param raceProgressions Race feature progressions
     * @param classProgressions Class feature progressions
     * @param intModifier Character's Intelligence modifier
     * @returns Array of unique language IDs available as bonus languages
     */
    static getCombinedBonusLanguages(
        raceProgressions: FeatureProgressionWithRelations[] | CreateFeatureProgressionRequest[],
        classProgressions: FeatureProgressionWithRelations[] | CreateFeatureProgressionRequest[]
    ): number[] {
        // Get racial bonus languages
        const racialLanguages = this.getBonusLanguages(raceProgressions);

        // Get class-granted bonus languages
        const classLanguages = this.getClassBonusLanguages(classProgressions);

        // Combine and remove duplicates
        const allLanguages = [...racialLanguages, ...classLanguages];
        return Array.from(new Set(allLanguages));
    }



    /**
     * Calculate the number of bonus language choices available based on INT modifier
     * @param intModifier Character's Intelligence modifier
     * @returns Number of bonus language choices available
     */
    static calculateBonusLanguageChoices(intModifier: number): number {
        return Math.max(0, intModifier);
    }

    /**
     * Get all languages available to a character (automatic + bonus)
     * @param raceProgressions Race feature progressions
     * @param classProgressions Class feature progressions
     * @param intModifier Character's Intelligence modifier
     * @returns Object with automatic and bonus language arrays
     */
    static getAllAvailableLanguages(
        raceProgressions: FeatureProgressionWithRelations[] | CreateFeatureProgressionRequest[],
        classProgressions: FeatureProgressionWithRelations[] | CreateFeatureProgressionRequest[],
        intModifier: number
    ): {
        automatic: number[];
        bonus: number[];
        totalChoices: number;
    } {
        const raceAutomatic = this.getAutomaticLanguages(raceProgressions);
        const classAutomatic = this.getClassAutomaticLanguages(classProgressions);
        const automatic = [...raceAutomatic, ...classAutomatic];

        const bonus = this.getCombinedBonusLanguages(raceProgressions, classProgressions);
        const totalChoices = this.calculateBonusLanguageChoices(intModifier);

        return {
            automatic,
            bonus,
            totalChoices
        };
    }
}
