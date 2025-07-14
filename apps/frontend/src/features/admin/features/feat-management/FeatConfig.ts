import React from 'react';

import { ColumnDefinition } from '@/components/generic-list';
import { FeatDetail } from '@/features/admin/features/feat-management/FeatDetail';
import { FeatEdit } from '@/features/admin/features/feat-management/FeatEdit';
import { FeatList } from '@/features/admin/features/feat-management/FeatList';
import { RouteConfig } from '@/types';
import { FEAT_TYPE_SELECT_LIST } from '@shared/static-data';

export const routes: RouteConfig[] = [
    { path: 'feats', component: FeatList, exact: true, requireAuth: true, requireAdmin: true, routeType: 'list' },
    { path: 'feats/:id', component: FeatDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'feats/:id/edit', component: FeatEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
];

export const COLUMN_DEFINITIONS: Record<string, ColumnDefinition> = {
    name: {
        label: 'Feat Name',
        sortable: true,
        isRequired: true,
        isDefault: true,
        filterConfig: {
            type: 'text-input',
            props: { placeholder: 'Filter by name...' }
        }
    },
    typeId: {
        label: 'Feat Type',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: 'multi-select',
            props: {
                options: FEAT_TYPE_SELECT_LIST,
                className: 'w-32'
            }
        }
    },
    description: {
        label: 'Description',
    },
    benefit: {
        label: 'Benefit',
    },
    normalEffect: {
        label: 'Normal',
    },
    specialEffect: {
        label: 'Special',
    },
    prerequisites: {
        label: 'Prerequisite',
    },
    repeatable: {
        label: 'Multi-Times',
        sortable: true,
        isDefault: true,
        filterConfig: {
            type: 'boolean'
        }
    }
};
