import { ColumnDefinition } from '@/components/generic-list';
import ClassDetail from '@/features/admin/features/class-management/ClassDetail';
import ClassEdit from '@/features/admin/features/class-management/ClassEdit';
import ClassList from '@/features/admin/features/class-management/ClassList';
import { ClassFeatureDetail } from '@/features/admin/features/class-management/ClassFeatureDetail';
import { ClassFeatureEdit } from '@/features/admin/features/class-management/ClassFeatureEdit';
import { RPG_DICE_SELECT_LIST, ABILITY_SELECT_LIST, EDITION_SELECT_LIST_FULL, SOURCE_BOOK_WITH_CLASSES_SELECT_LIST } from '@shared/static-data';

export const routes = [
    { path: 'classes', component: ClassList, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'classes/:id', component: ClassDetail, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'classes/:id/edit', component: ClassEdit, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'classes/features/:slug', component: ClassFeatureDetail, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'classes/features/:slug/edit', component: ClassFeatureEdit, exact: true, requireAuth: true, requireAdmin: true },
];

export const COLUMN_DEFINITIONS: Record<string, ColumnDefinition> = {
    name: {
        label: 'Name',
        sortable: true,
        isDefault: true,
        isRequired: true,
        filterConfig: {
            type: 'text-input',
            props: { placeholder: 'Filter by name...' }
        }
    },
    abbreviation: {
        label: 'Abbreviation',
        sortable: true,
        isDefault: true
    },
    editionId: {
        label: 'Edition',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: 'multi-select',
            props: {
                options: EDITION_SELECT_LIST_FULL,
                className: 'w-32'
            }
        }
    },
    isPrestige: {
        label: 'Prestige Class',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: 'boolean'
        }
    },
    canCastSpells: {
        label: 'Caster',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: 'boolean'
        }
    },
    hitDie: {
        label: 'Hit Die',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: 'single-select',
            props: {
                options: RPG_DICE_SELECT_LIST,
                className: 'w-32'
            }
        }
    },
    isVisible: {
        label: 'Display',
        sortable: true,
        filterConfig: {
            type: 'boolean'
        }
    },
    skillPoints: {
        label: 'Skill Points',
        sortable: true,
    },
    castingAbilityId: {
        label: 'Casting Ability',
        sortable: true,
        filterConfig: {
            type: 'single-select',
            props: {
                options: ABILITY_SELECT_LIST,
                className: 'w-32'
            }
        }
    },
    description: {
        label: 'Description',
    },
    sourceId: {
        label: 'Source',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: 'multi-select',
            props: {
                options: SOURCE_BOOK_WITH_CLASSES_SELECT_LIST,
                className: 'w-40'
            }
        }
    }
};