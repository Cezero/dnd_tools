import { SPELL_SUBSCHOOL_MAP, SPELL_SUBSCHOOL_BY_SCHOOL_ID_MAP, SpellSchool } from '@shared/static-data';

/**
 * Get spell subschool list by school ID
 */
export function GetSpellSubschoolListBySchoolId(schoolId: SpellSchool) {
    if (SPELL_SUBSCHOOL_BY_SCHOOL_ID_MAP[schoolId].length > 0) {
        return SPELL_SUBSCHOOL_BY_SCHOOL_ID_MAP[schoolId].map(subschool => SPELL_SUBSCHOOL_MAP[subschool]);
    }
    return [];
}
