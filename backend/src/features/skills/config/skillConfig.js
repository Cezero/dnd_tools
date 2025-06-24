export const skillFilterConfig = {
    base: {
        table: 'skills',
        sort: 'skill_name',
        groupColumn: 'skill_id',
    },
    skill_name: {
        column: 'skill_name',
        isSearch: true,
        operator: 'LIKE',
        dataType: 'string'
    },
    skill_description: {
        column: 'skill_description',
    },
    ability_id: {
        column: 'ability_id',
    },
    trained_only: {
        dataType: 'boolean',
        column: 'trained_only'
    },
    skill_armor_check_penalty: {
        dataType: 'boolean',
        column: 'skill_armor_check_penalty'
    },
    skill_check: {
        column: 'skill_check',
        dataType: 'string'
    },
    skill_action: {
        column: 'skill_action',
        dataType: 'string'
    },
    skill_try_again: {
        dataType: 'boolean',
        column: 'skill_try_again'
    },
    skill_try_again_desc: {
        column: 'skill_try_again_desc',
        dataType: 'string'
    },
    skill_special: {
        column: 'skill_special',
        dataType: 'string'
    },
    skill_synergy_desc: {
        column: 'skill_synergy_desc',
        dataType: 'string'
    },
    untrained_desc: {
        column: 'untrained_desc',
        dataType: 'string'
    },
}; 