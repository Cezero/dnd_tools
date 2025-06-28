import { FEAT_BENEFIT_TYPES } from '@shared/static-data/FeatData';
import { SAVING_THROW_LIST } from '@shared/static-data/AbilityData';
import { PROFICIENCY_TYPE_LIST } from '@shared/static-data/ItemData';
import { SKILL_LIST } from '@shared/static-data/SkillData';

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