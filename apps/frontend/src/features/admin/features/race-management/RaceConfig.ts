import React from 'react';

import { ColumnDefinition } from '@/components/generic-list';
import { RaceDetail } from '@/features/admin/features/race-management/RaceDetail';
import { RaceEdit } from '@/features/admin/features/race-management/RaceEdit';
import { RaceList } from '@/features/admin/features/race-management/RaceList';
import { RaceTraitDetail } from '@/features/admin/features/race-management/RaceTraitDetail';
import { RaceTraitEdit } from '@/features/admin/features/race-management/RaceTraitEdit';
import { EDITION_SELECT_LIST, CLASS_SELECT_LIST, SIZE_SELECT_LIST } from '@shared/static-data';

export const routes = [
    { path: 'races', component: RaceList, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'races/:id', component: RaceDetail, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'races/:id/edit', component: RaceEdit, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'races/traits/:slug', component: RaceTraitDetail, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'races/traits/:slug/edit', component: RaceTraitEdit, exact: true, requireAuth: true, requireAdmin: true },
];

export const COLUMN_DEFINITIONS: Record<string, ColumnDefinition> = {
    name: {
        label: 'Name',
        sortable: true,
        isRequired: true,
        isDefault: true,
        filterConfig: {
            type: 'text-input',
            props: { placeholder: 'Filter by name...' }
        }
    },
    editionId: {
        label: 'Edition',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: 'multi-select',
            props: {
                options: EDITION_SELECT_LIST,
                className: 'w-32'
            }
        }
    },
    isVisible: {
        label: 'Display',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: 'boolean'
        }
    },
    description: {
        label: 'Description',
    },
    sizeId: {
        label: 'Size',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: 'single-select',
            props: {
                options: SIZE_SELECT_LIST,
                className: 'w-32'
            }
        }
    },
    speed: {
        label: 'Speed',
        sortable: true,
        isDefault: true,
    },
    favoredClassId: {
        label: 'Favored Class',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: 'single-select',
            props: {
                options: CLASS_SELECT_LIST,
                className: 'w-32'
            }
        }
    }
};
