import { CreateFeatureProgressionRequest } from '@shared/schema';
import {
    SpecialFeatureId,
    EntityAppliesToType
} from '@shared/static-data';

// Type definitions for feature progressions with relations
interface FeatureEntity {
    id: number;
    type: number;
    value: number;
    appliesTo: number | null;
    appliesToId: number | null;
    appliesToSubId: number | null;
    bonusType: number | null;
    filterType: number | null;
    conditions?: FeatureEntityCondition[];
}

interface FeatureEntityCondition {
    id: number;
    type: number;
    conditionValue: string | null;
}
interface FeatureProgressionWithRelations {
    id: number;
    sourceType: number;
    level: number;
    featureId: number;
    // REMOVED: appliesToType and appliesTo - redundant with SpecialFeatureId
    entities?: FeatureEntity[];
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
                prog.entities
                    ?.filter(entity => entity.appliesTo === EntityAppliesToType.AutomaticLanguage && entity.appliesToId)
                    .map(entity => entity.appliesToId!) || []
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
                prog.entities
                    ?.filter(entity =>
                        entity.appliesTo === EntityAppliesToType.BonusLanguage &&
                        entity.appliesToId
                    )
                    .map(entity => entity.appliesToId!) || []
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
                prog.entities
                    ?.filter(entity =>
                        entity.appliesTo === EntityAppliesToType.BonusLanguage &&
                        entity.appliesToId
                    )
                    .map(entity => entity.appliesToId!) || []
            )
            .filter(id => id > 0);
    }

    /**
     * Get bonus language choice configuration from feature progressions
     * @param progressions Array of feature progressions
     * @returns Array of feature choices for bonus languages
     */
    static getBonusLanguageChoices(progressions: FeatureProgressionWithRelations[]): FeatureEntity[] {
        return progressions
            .filter(prog => prog.featureId === SpecialFeatureId.BonusLanguage)
            .flatMap(prog => prog.entities || []);
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
                prog.entities
                    ?.filter(entity =>
                        entity.appliesTo === EntityAppliesToType.AutomaticLanguage &&
                        entity.appliesToId
                    )
                    .map(entity => entity.appliesToId!) || []
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
            progression.entities?.some(entity => entity.appliesTo === EntityAppliesToType.BonusLanguage);
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
