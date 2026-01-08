import ordinal from 'ordinal';

// Note: This utility function now requires the cache function to be passed as a parameter
import { displayStrategyFactory } from '@/lib/formatters';
import { FeatPrerequisiteMap, FeatBenefitMap, FeatureEntity, FeatureProgression } from '@shared/schema';
import { DisplayType, SAVING_THROW_LIST, PROFICIENCY_TYPE_LIST, SKILL_LIST, FeatBenefitType, FeatPrerequisiteType, ABILITY_LIST, FEAT_PREREQ_BY_ID, CoreComponent, EditionId, SIZE_LIST, ATTACK_TYPE_LIST, EntityAppliesToType, EntityType, FeatureSourceType } from '@shared/static-data';

export const FeatOptions = (benefitType: number): CoreComponent[] => {
    switch (benefitType) {
        case FeatBenefitType.SKILL:
            return SKILL_LIST;
        case FeatBenefitType.PROFICIENCY:
            return PROFICIENCY_TYPE_LIST;
        case FeatBenefitType.SAVE:
            return SAVING_THROW_LIST;
        case FeatBenefitType.ATTACK_BONUS:
        case FeatBenefitType.DAMAGE_BONUS:
            return ATTACK_TYPE_LIST;
        case FeatBenefitType.TWO_WEAPON_MAIN_HAND:
        case FeatBenefitType.TWO_WEAPON_OFF_HAND:
            // These benefit types don't need reference options
            return [];
        default:
            return [];
    }
}

export const PrereqOptions = async (prereqType: number, cacheService?: { getClassNameById: (id: number) => CoreComponent | undefined; getBaseClassSelectByEdition: (editionId: number) => CoreComponent[] }): Promise<CoreComponent[]> => {
    switch (prereqType) {
        case FeatPrerequisiteType.ABILITY:
            return ABILITY_LIST;
        case FeatPrerequisiteType.SKILL:
            return SKILL_LIST;
        case FeatPrerequisiteType.FEAT:
            // This will be populated dynamically
            return [];
        case FeatPrerequisiteType.CLASSLEVEL: {
            const baseClasses = cacheService?.getBaseClassSelectByEdition(EditionId.DND_3x) || [];
            return [
                { id: -1, name: 'Character Level' },
                ...baseClasses
            ];
        }
        case FeatPrerequisiteType.CLASSFEATURE:
            // This will be populated dynamically
            return [];
        case FeatPrerequisiteType.SIZE:
            return SIZE_LIST;
        case FeatPrerequisiteType.BAB:
        case FeatPrerequisiteType.SPELLCASTING:
        case FeatPrerequisiteType.SPECIAL:
        case FeatPrerequisiteType.PROFICIENCY:
            // These don't need reference options
            return [];
        default:
            return [];
    }
}

export const getPrereqDisplayText = async (prereq: FeatPrerequisiteMap, getFeatNameById: (id: number) => Promise<{ name?: string } | undefined>, getFeatureNameById?: (id: number) => Promise<{ name?: string } | undefined>): Promise<string> => {
    const typeName = FEAT_PREREQ_BY_ID[prereq.typeId] || '';
    const getAmountText = (amount: number | null) => amount && amount > 0 ? ` +${amount}` : amount ? ` ${amount}` : '';

    switch (prereq.typeId) {
        case FeatPrerequisiteType.FEAT: {
            if (prereq.referenceId) {
                try {
                    const feat = await getFeatNameById(prereq.referenceId);
                    const featName = feat?.name || `Feat ID ${prereq.referenceId}`;
                    return `${typeName}: ${featName}${getAmountText(prereq.amount)}`;
                } catch (_error) {
                    return `${typeName}: Feat ID ${prereq.referenceId}${getAmountText(prereq.amount)}`;
                }
            }
            return typeName;
        }

        case FeatPrerequisiteType.BAB:
        case FeatPrerequisiteType.SPECIAL:
            return `${typeName}${getAmountText(prereq.amount)}`;

        case FeatPrerequisiteType.SPELLCASTING:
            return prereq.amount ? `${typeName} ${ordinal(prereq.amount)}` : typeName;

        case FeatPrerequisiteType.CLASSLEVEL: {
            if (prereq.referenceId === -1) {
                return `Character Level: ${prereq.amount || 0}`;
            } else {
                const options = await PrereqOptions(prereq.typeId);
                const className = options.find(option => option.id === prereq.referenceId)?.name || '';
                return `${className} Level: ${prereq.amount || 0}`;
            }
        }

        case FeatPrerequisiteType.ABILITY: {
            // For ABILITY, use the reference lookup without + prefix
            const options = await PrereqOptions(prereq.typeId);
            const abilityName = options.find(option => option.id === prereq.referenceId)?.name || '';
            const abilityAmountText = prereq.amount ? ` ${prereq.amount}` : '';
            return `${typeName}: ${abilityName}${abilityAmountText}`;
        }

        case FeatPrerequisiteType.CLASSFEATURE: {
            if (prereq.referenceId && getFeatureNameById) {
                try {
                    const feature = await getFeatureNameById(prereq.referenceId);
                    const featureName = feature?.name || `Feature ID ${prereq.referenceId}`;
                    return `${typeName}: ${featureName}${getAmountText(prereq.amount)}`;
                } catch (_error) {
                    return `${typeName}: Feature ID ${prereq.referenceId}${getAmountText(prereq.amount)}`;
                }
            }
            return typeName;
        }

        case FeatPrerequisiteType.SIZE: {
            const options = await PrereqOptions(prereq.typeId);
            const sizeName = options.find(option => option.id === prereq.referenceId)?.name || '';
            if (!sizeName) return typeName;

            // amount: 0 = exact, 1 = or larger, 2 = or smaller
            if (prereq.amount === 0) {
                return `${typeName}: ${sizeName}`;
            } else if (prereq.amount === 1) {
                return `${typeName}: ${sizeName} or larger`;
            } else if (prereq.amount === 2) {
                return `${typeName}: ${sizeName} or smaller`;
            }
            return `${typeName}: ${sizeName}`;
        }

        default: {
            // For SKILL, use the reference lookup with + prefix
            const options = await PrereqOptions(prereq.typeId);
            const referenceName = options.find(option => option.id === prereq.referenceId)?.name || '';
            return `${typeName}: ${referenceName}${getAmountText(prereq.amount)}`;
        }
    }
};

/**
 * Convert FeatBenefitMap to FeatureEntity for use with the formatting system
 */
function featBenefitToFeatureEntity(benefit: FeatBenefitMap): FeatureEntity {
    // Determine appliesTo based on benefit type
    let appliesTo: EntityAppliesToType;
    if (benefit.typeId === FeatBenefitType.SKILL) {
        appliesTo = EntityAppliesToType.Skill;
    } else if (benefit.typeId === FeatBenefitType.SAVE) {
        appliesTo = EntityAppliesToType.SavingThrow;
    } else if (benefit.typeId === FeatBenefitType.PROFICIENCY) {
        appliesTo = EntityAppliesToType.Feat;
    } else if (benefit.typeId === FeatBenefitType.ATTACK_BONUS) {
        appliesTo = EntityAppliesToType.Attack;
    } else if (benefit.typeId === FeatBenefitType.DAMAGE_BONUS) {
        appliesTo = EntityAppliesToType.Damage;
    } else if (benefit.typeId === FeatBenefitType.INITIATIVE) {
        appliesTo = EntityAppliesToType.Initiative;
    } else if (benefit.typeId === FeatBenefitType.CASTER_LEVEL) {
        appliesTo = EntityAppliesToType.CasterLevel;
    } else if (benefit.typeId === FeatBenefitType.DIFFICULTY_CLASS) {
        appliesTo = EntityAppliesToType.SpellSvDC;
    } else {
        appliesTo = EntityAppliesToType.Other;
    }

    // Determine entity type based on benefit type
    let entityType: EntityType;
    if (benefit.typeId === FeatBenefitType.PROFICIENCY) {
        entityType = EntityType.Proficiency; // Proficiencies use EntityType.Proficiency
    } else {
        entityType = EntityType.Bonus; // Most feat benefits are bonuses
    }

    return {
        id: 0,
        progressionId: 0,
        type: entityType,
        appliesTo,
        appliesToId: benefit.referenceId || null,
        appliesToSubId: null,
        value: benefit.amount || null,
        bonusType: null,
        formulaParamsId: null,
        groupingId: 0,
        displayInDetail: true,
        filterType: null,
        conditions: undefined, // Feat benefits don't have conditions
        formulaParams: null,
    };
}

/**
 * Format a feat benefit using the display strategy system
 * Creates a mock FeatureProgression and uses the display strategy to format it properly
 */
export const formatFeatBenefit = (benefit: FeatBenefitMap): string => {
    try {
        // Convert feat benefit to FeatureEntity
        const entity = featBenefitToFeatureEntity(benefit);

        // Create a mock FeatureProgression (similar to useFormulaPreview.ts)
        const mockProgression: FeatureProgression = {
            id: 0,
            sourceType: FeatureSourceType.Class,
            classId: null,
            raceId: null,
            level: 1,
            featureId: 0,
            feature: {
                id: 0,
                name: 'Feat Benefit',
                description: '',
                slug: 'feat-benefit',
                displayInCharacterSheet: true,
            },
            entities: [entity],
        };

        // Use Display Strategy to properly orchestrate the formatting process
        const detailStrategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
        const displayResult = detailStrategy.format(mockProgression, {
            currentLevel: 1,
            showBreakdown: false,
        });

        // Extract the formatted entity value from levelEntries (not the full progression formattedValue)
        if (displayResult.levelEntries && displayResult.levelEntries.length > 0) {
            const firstLevelEntry = displayResult.levelEntries[0];
            if (firstLevelEntry.items && firstLevelEntry.items.length > 0) {
                return firstLevelEntry.items[0].formattedValue || '';
            }
        }

        // Fallback to formattedValue if levelEntries structure is different
        return displayResult.formattedValue || '';
    } catch (error) {
        console.error('Error formatting feat benefit:', error);
        return 'Error formatting benefit';
    }
};

/**
 * Format a FeatureEntity using the display strategy system
 * Uses the actual FeatureProgression to ensure proper context (sourceType, featId, etc.)
 */
export const formatFeatureEntity = (entity: FeatureEntity, progression: FeatureProgression): string => {
    try {
        // Create a progression with just this entity for formatting
        const entityProgression: FeatureProgression = {
            ...progression,
            entities: [entity],
        };

        // Use Display Strategy to properly orchestrate the formatting process
        const detailStrategy = displayStrategyFactory.createStrategy(DisplayType.Detail);
        const displayResult = detailStrategy.format(entityProgression, {
            currentLevel: progression.level || 1,
            showBreakdown: false,
        });

        // Extract the formatted entity value from levelEntries
        if (displayResult.levelEntries && displayResult.levelEntries.length > 0) {
            const firstLevelEntry = displayResult.levelEntries[0];
            if (firstLevelEntry.items && firstLevelEntry.items.length > 0) {
                return firstLevelEntry.items[0].formattedValue || '';
            }
        }

        // Fallback to formattedValue if levelEntries structure is different
        return displayResult.formattedValue || '';
    } catch (error) {
        console.error('Error formatting feature entity:', error);
        return 'Error formatting entity';
    }
};
