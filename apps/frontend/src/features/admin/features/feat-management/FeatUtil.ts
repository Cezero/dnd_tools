import { SAVING_THROW_SELECT_LIST, PROFICIENCY_TYPE_SELECT_LIST, SKILL_SELECT_LIST, FeatBenefitType, SelectOption } from '@shared/static-data';

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
