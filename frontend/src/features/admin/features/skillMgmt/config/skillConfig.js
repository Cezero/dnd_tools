import SkillList from '@/features/admin/features/skillMgmt/components/skillList';
import SkillDetail from '@/features/admin/features/skillMgmt/components/skillDetail';
import SkillEdit from '@/features/admin/features/skillMgmt/components/skillEdit';
import Input from '@/components/GenericList/Input';
import BooleanInput from '@/components/GenericList/BooleanInput';
import SingleSelect from '@/components/GenericList/SingleSelect';
import { ABILITY_MAP } from 'shared-data/src/abilityData';

export const routes = [
    { path: 'skills', component: SkillList, exact: true },
    { path: 'skills/:id', component: SkillDetail, exact: true },
    { path: 'skills/:id/edit', component: SkillEdit, exact: true },
];

export const COLUMN_DEFINITIONS = {
    skill_name: {
        label: 'Skill Name',
        type: 'text',
        sortable: true,
        filterable: true,
        filterType: 'input'
    },
    ability_id: {
        label: 'Ability Score',
        type: 'text',
        sortable: true,
        filterable: true,
        filterType: 'single-select'
    },
    trained_only: {
        label: 'Trained Only',
        type: 'boolean',
        sortable: true,
        filterable: true,
        filterType: 'boolean'
    },
    skill_armor_check_penalty: {
        label: 'Armor Check Penalty',
        type: 'boolean',
        sortable: true,
        filterable: true,
        filterType: 'boolean'
    },
    skill_check: {
        label: 'Skill Check',
        type: 'text',
        sortable: false,
        filterable: false
    },
    skill_action: {
        label: 'Action',
        type: 'text',
        sortable: false,
        filterable: false
    },
    skill_try_again: {
        label: 'Try Again',
        type: 'boolean',
        sortable: true,
        filterable: false
    },
    skill_try_again_desc: {
        label: 'Try Again Desc',
        type: 'text',
        sortable: false,
        filterable: false
    },
    skill_special: {
        label: 'Special',
        type: 'text',
        sortable: false,
        filterable: false
    },
    skill_synergy_desc: {
        label: 'Synergy',
        type: 'text',
        sortable: false,
        filterable: false
    },
    untrained_desc: {
        label: 'Untrained Desc',
        type: 'text',
        sortable: false,
        filterable: false,
    },
    skill_description: {
        label: 'Description',
        type: 'text',
        sortable: false,
        filterable: false
    }
};

export const skillFilterOptions = (lookupsInitialized) => ({
    skill_name: { component: Input, props: { type: 'text', placeholder: 'Filter by name...' } },
    ability_id: {
        component: SingleSelect,
        props: {
            options: Object.values(ABILITY_MAP),
            displayKey: 'abbr',
            valueKey: 'id',
            className: 'w-32'
        }
    },
    trained_only: { component: BooleanInput },
    skill_armor_check_penalty: { component: BooleanInput },
});

export const DEFAULT_COLUMNS = ['skill_name', 'ability_id', 'trained_only', 'armor_check_penalty', 'skill_description']; 