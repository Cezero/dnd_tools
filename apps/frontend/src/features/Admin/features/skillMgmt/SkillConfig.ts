import { SkillList } from './SkillList';
import { SkillDetail } from './SkillDetail';
import { SkillEdit } from './SkillEdit';
import { TextInput, BooleanInput, SingleSelect } from '@/components/GenericList';
import { ABILITY_MAP } from '@shared/static-data';
import { RouteConfig } from '@/types';

export const routes: RouteConfig[] = [
    { path: 'skills', component: SkillList, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'skills/:id', component: SkillDetail, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'skills/:id/edit', component: SkillEdit, exact: true, requireAuth: true, requireAdmin: true },
];

interface SkillColumnDefinition {
    label: string;
    type: 'text' | 'boolean';
    sortable: boolean;
    filterable: boolean;
    filterType?: 'input' | 'single-select' | 'boolean';
}

interface SkillFilterOption {
    component: React.ComponentType<any>;
    props?: Record<string, any>;
}

export const COLUMN_DEFINITIONS: Record<string, SkillColumnDefinition> = {
    name: {
        label: 'Skill Name',
        type: 'text',
        sortable: true,
        filterable: true,
        filterType: 'input'
    },
    abilityId: {
        label: 'Ability Score',
        type: 'text',
        sortable: true,
        filterable: true,
        filterType: 'single-select'
    },
    trainedOnly: {
        label: 'Trained Only',
        type: 'boolean',
        sortable: true,
        filterable: true,
        filterType: 'boolean'
    },
    affectedByArmor: {
        label: 'Armor Check Penalty',
        type: 'boolean',
        sortable: true,
        filterable: true,
        filterType: 'boolean'
    },
    checkDescription: {
        label: 'Skill Check',
        type: 'text',
        sortable: false,
        filterable: false
    },
    actionDescription: {
        label: 'Action',
        type: 'text',
        sortable: false,
        filterable: false
    },
    retryTypeId: {
        label: 'Try Again',
        type: 'boolean',
        sortable: true,
        filterable: false
    },
    retryDescription: {
        label: 'Try Again Desc',
        type: 'text',
        sortable: false,
        filterable: false
    },
    specialNotes: {
        label: 'Special',
        type: 'text',
        sortable: false,
        filterable: false
    },
    synergyNotes: {
        label: 'Synergy',
        type: 'text',
        sortable: false,
        filterable: false
    },
    untrainedNotes: {
        label: 'Untrained Desc',
        type: 'text',
        sortable: false,
        filterable: false,
    },
    description: {
        label: 'Description',
        type: 'text',
        sortable: false,
        filterable: false
    }
};

export const SkillFilterOptions: Record<string, SkillFilterOption> = {
    name: { component: TextInput, props: { type: 'text', placeholder: 'Filter by name...' } },
    abilityId: {
        component: SingleSelect,
        props: {
            options: Object.values(ABILITY_MAP),
            displayKey: 'abbr',
            valueKey: 'id',
            className: 'w-32'
        }
    },
    trainedOnly: { component: BooleanInput },
    affectedByArmor: { component: BooleanInput },
};

export const DEFAULT_COLUMNS: string[] = ['name', 'abilityId', 'trainedOnly', 'affectedByArmor', 'description']; 