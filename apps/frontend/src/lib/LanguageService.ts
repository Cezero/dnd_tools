import { CreateFeatureRequest } from '@shared/schema';
import {
    EntityAppliesToType,
    EntityType,
    FeatureSourceType
} from '@shared/static-data';

// Type definitions for feature features with relations
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
interface FeatureWithRelations {
    id: number;
    sourceType: number;
    level: number;
    featureId: number;
    // Note: Uses normal features with EntityType.Base entities
    entities?: FeatureEntity[];
    effects?: unknown[];
}

export class LanguageService {
    /**
     * Extract automatic languages from feature features
     * @param features Array of feature features
     * @returns Array of language IDs that are automatically granted
     */
    static getAutomaticLanguages(features: FeatureWithRelations[] | CreateFeatureRequest[]): number[] {
        return features
            .flatMap(prog =>
                prog.entities
                    ?.filter(entity => entity.appliesTo === EntityAppliesToType.AutomaticLanguage && entity.appliesToId)
                    .map(entity => entity.appliesToId!) || []
            )
            .filter(id => id > 0);
    }

    /**
     * Extract available bonus languages from feature features
     * @param features Array of feature features
     * @returns Array of language IDs available as bonus languages
     */
    static getBonusLanguages(features: FeatureWithRelations[] | CreateFeatureRequest[]): number[] {
        return features
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
     * Extract class-granted bonus languages from feature features
     * @param features Array of feature features
     * @returns Array of language IDs granted by classes as bonus languages
     */
    static getClassBonusLanguages(features: FeatureWithRelations[] | CreateFeatureRequest[]): number[] {
        return features
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
     * Get bonus language choice configuration from feature features
     * @param features Array of feature features
     * @returns Array of feature choices for bonus languages
     */
    static getBonusLanguageChoices(features: FeatureWithRelations[]): FeatureEntity[] {
        return features
            .filter(prog =>
                prog.entities?.some(e =>
                    e.type === EntityType.Base &&
                    e.appliesTo === EntityAppliesToType.BonusLanguage
                )
            )
            .flatMap(prog => prog.entities || []);
    }

    /**
     * Extract class-granted automatic languages from feature features
     * @param features Array of feature features
     * @returns Array of language IDs granted by classes as automatic languages
     */
    static getClassAutomaticLanguages(features: FeatureWithRelations[] | CreateFeatureRequest[]): number[] {
        return features
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
     * Check if a feature feature is a class language feature (automatic or bonus)
     * @param feature Feature feature to check
     * @returns True if this is a class language feature
     */
    static isClassLanguageFeature(feature: FeatureWithRelations | CreateFeatureRequest): boolean {
        if (feature.sourceType !== FeatureSourceType.Class) {
            return false;
        }
        // Both FeatureWithRelations and CreateFeatureRequest have optional entities
        // Both entity types have type and appliesTo as numbers
        if (!feature.entities || feature.entities.length === 0) {
            return false;
        }
        return feature.entities.some(e =>
            e.type === EntityType.Base &&
            (e.appliesTo === EntityAppliesToType.AutomaticLanguage ||
                e.appliesTo === EntityAppliesToType.BonusLanguage)
        );
    }

    /**
     * Check if a feature feature is a class bonus language feature
     * @param feature Feature feature to check
     * @returns True if this is a class bonus language feature
     */
    static isClassBonusLanguageFeature(feature: FeatureWithRelations | CreateFeatureRequest): boolean {
        return this.isClassLanguageFeature(feature) &&
            feature.entities?.some(entity => entity.appliesTo === EntityAppliesToType.BonusLanguage);
    }

    /**
     * Get all available bonus languages (racial + class) for a character
     * @param raceProgressions Race feature features
     * @param classProgressions Class feature features
     * @param intModifier Character's Intelligence modifier
     * @returns Array of unique language IDs available as bonus languages
     */
    static getCombinedBonusLanguages(
        raceProgressions: FeatureWithRelations[] | CreateFeatureRequest[],
        classProgressions: FeatureWithRelations[] | CreateFeatureRequest[]
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
     * @param raceProgressions Race feature features
     * @param classProgressions Class feature features
     * @param intModifier Character's Intelligence modifier
     * @returns Object with automatic and bonus language arrays
     */
    static getAllAvailableLanguages(
        raceProgressions: FeatureWithRelations[] | CreateFeatureRequest[],
        classProgressions: FeatureWithRelations[] | CreateFeatureRequest[],
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
