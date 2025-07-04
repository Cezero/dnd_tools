import { ColumnDefinition } from '@/components/generic-list';
import { RouteConfig } from '@/types';
import { ABILITY_SELECT_LIST } from '@shared/static-data';

import { SkillDetail } from './SkillDetail';
import { SkillEdit } from './SkillEdit';
import { SkillList } from './SkillList';

export const routes: RouteConfig[] = [
    { path: 'skills', component: SkillList, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'skills/:id', component: SkillDetail, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'skills/:id/edit', component: SkillEdit, exact: true, requireAuth: true, requireAdmin: true },
];

export const COLUMN_DEFINITIONS: Record<string, ColumnDefinition> = {
    name: {
        label: 'Skill Name',
        sortable: true,
        isRequired: true,
        isDefault: true,
        filterConfig: {
            type: 'text-input',
            props: { placeholder: 'Filter by name...' }
        }
    },
    abilityId: {
        label: 'Ability Score',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: 'single-select',
            props: {
                options: ABILITY_SELECT_LIST,
                className: 'w-32'
            }
        }
    },
    trainedOnly: {
        label: 'Trained Only',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: 'boolean'
        }
    },
    affectedByArmor: {
        label: 'Armor Check Penalty',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: 'boolean'
        }
    },
    checkDescription: {
        label: 'Skill Check',
    },
    actionDescription: {
        label: 'Action',
    },
    retryTypeId: {
        label: 'Try Again',
        sortable: true,
    },
    retryDescription: {
        label: 'Try Again Desc',
    },
    specialNotes: {
        label: 'Special',
    },
    synergyNotes: {
        label: 'Synergy',
    },
    untrainedNotes: {
        label: 'Untrained Desc',
    },
    description: {
        label: 'Description',
        isDefault: true,
    }
};
