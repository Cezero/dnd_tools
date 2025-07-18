import { SAVING_THROW_SELECT_LIST, PROFICIENCY_TYPE_SELECT_LIST, SKILL_SELECT_LIST, FeatBenefitType, SelectOption, FeatPrerequisiteType, ABILITY_SELECT_LIST, FEAT_PREREQ_BY_ID } from '@shared/static-data';
import { FeatService } from './FeatService';
import ordinal from 'ordinal';

export const FeatOptions = (benefitType: number): SelectOption[] => {
    switch (benefitType) {
        case FeatBenefitType.SKILL:
            return SKILL_SELECT_LIST;
        case FeatBenefitType.PROFICIENCY:
            return PROFICIENCY_TYPE_SELECT_LIST;
        case FeatBenefitType.SAVE:
            return SAVING_THROW_SELECT_LIST;
        default:
            return [];
    }
}

export const PrereqOptions = (prereqType: number): SelectOption[] => {
    switch (prereqType) {
        case FeatPrerequisiteType.ABILITY:
            return ABILITY_SELECT_LIST;
        case FeatPrerequisiteType.SKILL:
            return SKILL_SELECT_LIST;
        case FeatPrerequisiteType.FEAT:
            // This will be populated dynamically
            return [];
        case FeatPrerequisiteType.BAB:
        case FeatPrerequisiteType.SPELLCASTING:
        case FeatPrerequisiteType.SPECIAL:
            // These don't need reference options
            return [];
        default:
            return [];
    }
}

export const getPrereqDisplayText = async (prereq: { typeId: number; referenceId: number | null; amount: number | null }): Promise<string> => {
    const typeName = FEAT_PREREQ_BY_ID[prereq.typeId] || '';
    const getAmountText = (amount: number | null) => amount && amount > 0 ? ` +${amount}` : amount ? ` ${amount}` : '';
    const getCasterLevelText = (amount: number | null) => amount ? ` ${amount}` : '';

    switch (prereq.typeId) {
        case FeatPrerequisiteType.FEAT:
            if (prereq.referenceId) {
                try {
                    const feat = await FeatService.getFeatById(undefined, { id: prereq.referenceId });
                    const featName = feat?.name || `Feat ID ${prereq.referenceId}`;
                    return `${typeName}: ${featName}${getAmountText(prereq.amount)}`;
                } catch (error) {
                    return `${typeName}: Feat ID ${prereq.referenceId}${getAmountText(prereq.amount)}`;
                }
            }
            return typeName;

        case FeatPrerequisiteType.BAB:
        case FeatPrerequisiteType.SPECIAL:
            return `${typeName}${getAmountText(prereq.amount)}`;

        case FeatPrerequisiteType.SPELLCASTING:
            return prereq.amount ? `${typeName} ${ordinal(prereq.amount)}` : typeName;

        case FeatPrerequisiteType.ABILITY:
            // For ABILITY, use the reference lookup without + prefix
            const abilityName = PrereqOptions(prereq.typeId).find(option => option.value === prereq.referenceId)?.label || '';
            const abilityAmountText = prereq.amount ? ` ${prereq.amount}` : '';
            return `${typeName}: ${abilityName}${abilityAmountText}`;

        default:
            // For SKILL, use the reference lookup with + prefix
            const referenceName = PrereqOptions(prereq.typeId).find(option => option.value === prereq.referenceId)?.label || '';
            return `${typeName}: ${referenceName}${getAmountText(prereq.amount)}`;
    }
};
