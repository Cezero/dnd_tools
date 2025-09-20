import ordinal from 'ordinal';

import { FeatPrerequisiteMap } from '@shared/schema';
import { SAVING_THROW_LIST, PROFICIENCY_TYPE_LIST, SKILL_LIST, FeatBenefitType, FeatPrerequisiteType, ABILITY_LIST, FEAT_PREREQ_BY_ID, CoreComponent } from '@shared/static-data';

import { FeatApi } from './FeatApi';
import { getBaseClassesForEdition } from '../class/ClassUtils';

export const FeatOptions = (benefitType: number): CoreComponent[] => {
    switch (benefitType) {
        case FeatBenefitType.SKILL:
            return SKILL_LIST;
        case FeatBenefitType.PROFICIENCY:
            return PROFICIENCY_TYPE_LIST;
        case FeatBenefitType.SAVE:
            return SAVING_THROW_LIST;
        default:
            return [];
    }
}

export const PrereqOptions = async (prereqType: number): Promise<CoreComponent[]> => {
    switch (prereqType) {
        case FeatPrerequisiteType.ABILITY:
            return ABILITY_LIST;
        case FeatPrerequisiteType.SKILL:
            return SKILL_LIST;
        case FeatPrerequisiteType.FEAT:
            // This will be populated dynamically
            return [];
        case FeatPrerequisiteType.CLASSLEVEL: {
            // Get base classes for edition 4 (D&D 3.5) and add character level option
            const baseClasses = await getBaseClassesForEdition(4);
            return [
                { id: -1, name: 'Character Level' },
                ...baseClasses
            ];
        }
        case FeatPrerequisiteType.CLASSFEATURE:
            // This will be populated dynamically
            return [];
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

export const getPrereqDisplayText = async (prereq: FeatPrerequisiteMap): Promise<string> => {
    const typeName = FEAT_PREREQ_BY_ID[prereq.typeId] || '';
    const getAmountText = (amount: number | null) => amount && amount > 0 ? ` +${amount}` : amount ? ` ${amount}` : '';

    switch (prereq.typeId) {
        case FeatPrerequisiteType.FEAT: {
            if (prereq.referenceId) {
                try {
                    const feat = await FeatApi.getFeatById(undefined, { id: prereq.referenceId });
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

        default: {
            // For SKILL, use the reference lookup with + prefix
            const options = await PrereqOptions(prereq.typeId);
            const referenceName = options.find(option => option.id === prereq.referenceId)?.name || '';
            return `${typeName}: ${referenceName}${getAmountText(prereq.amount)}`;
        }
    }
};
