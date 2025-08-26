import { ColumnDef } from '@tanstack/react-table';

import { FeatureDetail, FeatureEdit } from '@/components/feature-system';
import { createContainsFilter } from '@/components/generic-list/filterFunctions';
import { RouteConfig, NavigationItem } from '@/types';
import { FeatureInQueryResponse } from '@shared/schema';
import { FilterType } from '@shared/static-data';

import FeatureList from './FeatureList';

export const FEATURE_COLUMNS: ColumnDef<FeatureInQueryResponse>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 200,
        filterFn: createContainsFilter(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by name...'
        },
    },
    {
        accessorKey: 'slug',
        header: 'Slug',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 150,
        filterFn: createContainsFilter(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by slug...'
        },
    },
    {
        accessorKey: 'description',
        header: 'Description',
        enableResizing: true,
        size: 300,
        cell: ({ getValue }) => {
            const description = getValue() as string;
            return description ? (description.length > 200 ? `${description.substring(0, 200)}...` : description) : 'No description';
        },
        meta: {
            truncate: 200,
            isMarkdown: true,
        },
    },
];

export const routes: RouteConfig[] = [
    { path: 'features', component: FeatureList, exact: true, requireAuth: true, requireAdmin: true, routeType: 'list' },
    { path: 'features/:id/edit', component: FeatureEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
    { path: 'features/:id', component: FeatureDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
];

export const navigation: NavigationItem = {
    label: "Features",
    path: "/features",
};
