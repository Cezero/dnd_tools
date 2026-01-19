import { getSkillNameFromCache } from '@/services/cache';
import { FeaturePrerequisite } from '@shared/schema';
import {
    FeaturePrerequisiteType,
    ABILITY_MAP,
    SIZE_LIST,
    PROFICIENCY_TYPE_LIST,
} from '@shared/static-data';

/**
 * Format a single FeaturePrerequisite object for display
 */
export const formatFeaturePrerequisite = (
    prereq: FeaturePrerequisite,
    getFeatNameById?: (id: number) => Promise<string | null>,
    getFeatureNameById?: (id: number) => Promise<string | null>
): string => {
    switch (prereq.type) {
        case FeaturePrerequisiteType.SkillRanks: {
            const skillName = prereq.appliesToId
                ? getSkillNameFromCache(prereq.appliesToId) || 'Unknown Skill'
                : 'Skill';
            return `${skillName} ${prereq.minValue} ranks`;
        }
        case FeaturePrerequisiteType.AbilityScore: {
            const abilityName = prereq.appliesToId ? ABILITY_MAP[prereq.appliesToId]?.abbreviation || 'Unknown' : 'Ability';
            return `${abilityName} ${prereq.minValue}+`;
        }
        case FeaturePrerequisiteType.CharacterLevel:
            return `Character Level ${prereq.minValue}+`;
        case FeaturePrerequisiteType.ClassLevel:
            return `Class Level ${prereq.minValue}+`;
        case FeaturePrerequisiteType.BaseAttackBonus:
            return `BAB ${prereq.minValue}+`;
        case FeaturePrerequisiteType.Feat:
            // For Feat prerequisites, we need to resolve the feat name
            if (prereq.appliesToId && getFeatNameById) {
                // Return a promise-based format - caller should handle async
                return `Feat: ${prereq.appliesToId}`; // Will be resolved by caller
            }
            return `Feat ${prereq.appliesToId || ''}`;
        case FeaturePrerequisiteType.ClassFeature:
            // For ClassFeature prerequisites, we need to resolve the feature name
            if (prereq.appliesToId && getFeatureNameById) {
                return `Class Feature: ${prereq.appliesToId}`; // Will be resolved by caller
            }
            return `Class Feature ${prereq.appliesToId || ''}`;
        case FeaturePrerequisiteType.Spellcasting:
            return `Spellcasting`;
        case FeaturePrerequisiteType.Size: {
            // Size prerequisites use appliesToId to reference SIZE_LIST
            const sizeName = prereq.appliesToId ? SIZE_LIST.find(s => s.id === prereq.appliesToId)?.name || 'Unknown Size' : 'Size';
            return `${sizeName}`;
        }
        case FeaturePrerequisiteType.Proficiency: {
            // Proficiency prerequisites use appliesToId to reference proficiency types
            const profName = prereq.appliesToId ? PROFICIENCY_TYPE_LIST.find(p => p.id === prereq.appliesToId)?.name || 'Unknown Proficiency' : 'Proficiency';
            return `${profName}`;
        }
        case FeaturePrerequisiteType.Other:
            return `Other Requirement: ${prereq.minValue || ''}`;
        default:
            return `Requirement: ${prereq.minValue || ''}`;
    }
};

/**
 * Format an array of FeaturePrerequisite objects for display
 * Returns a single comma-separated string (for simple display)
 */
export const formatPrerequisites = (prerequisites: FeaturePrerequisite[]): string => {
    if (!prerequisites || prerequisites.length === 0) return 'None';

    return prerequisites.map((prereq, index) => {
        const text = formatFeaturePrerequisite(prereq);
        return index === prerequisites.length - 1 ? text : text + ', ';
    }).join('');
};

/**
 * Format an array of FeaturePrerequisite objects for display
 * Handles async resolution of Feat and Feature names
 * Returns an array of formatted strings (for individual display)
 */
export const formatFeaturePrerequisites = async (
    prerequisites: FeaturePrerequisite[],
    getFeatNameById?: (id: number) => Promise<string | null>,
    getFeatureNameById?: (id: number) => Promise<string | null>
): Promise<string[]> => {
    const formattedTexts: string[] = [];

    for (const prereq of prerequisites) {
        let text = formatFeaturePrerequisite(prereq, getFeatNameById, getFeatureNameById);

        // Resolve Feat names if needed
        if (prereq.type === FeaturePrerequisiteType.Feat && prereq.appliesToId && getFeatNameById) {
            try {
                const featName = getFeatNameById(prereq.appliesToId);
                text = featName ? `Feat: ${featName}` : `Feat ${prereq.appliesToId}`;
            } catch (error) {
                console.error('Error resolving feat name:', error);
                text = `Feat ${prereq.appliesToId}`;
            }
        }

        // Resolve ClassFeature names if needed
        if (prereq.type === FeaturePrerequisiteType.ClassFeature && prereq.appliesToId && getFeatureNameById) {
            try {
                const featureName = await getFeatureNameById(prereq.appliesToId);
                text = featureName ? `Class Feature: ${featureName}` : `Class Feature ${prereq.appliesToId}`;
            } catch (error) {
                console.error('Error resolving feature name:', error);
                text = `Class Feature ${prereq.appliesToId}`;
            }
        }

        formattedTexts.push(text);
    }

    return formattedTexts;
};

