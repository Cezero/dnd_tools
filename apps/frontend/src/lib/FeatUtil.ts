import { FEAT_BENEFIT_TYPES, SAVING_THROW_LIST, PROFICIENCY_TYPE_LIST, SKILL_LIST } from '@shared/static-data';

interface FeatOption {
    id: number;
    name: string;
}

class _FeatOptions {
    get(benefitType: number): FeatOption[] {
        console.log('[FeatUtil] get() called. benefit_type:', benefitType);
        switch (benefitType) {
            case FEAT_BENEFIT_TYPES.SKILL.id:
                return SKILL_LIST;
            case FEAT_BENEFIT_TYPES.PROFICIENCY.id:
                return PROFICIENCY_TYPE_LIST;
            case FEAT_BENEFIT_TYPES.SAVE.id:
                return SAVING_THROW_LIST;
            default:
                return [];
        }
    }
}

export const FeatOptions = new _FeatOptions(); 