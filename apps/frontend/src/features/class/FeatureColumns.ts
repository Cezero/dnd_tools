import { ColumnDef } from '@tanstack/react-table';

import { createContainsFilter } from '@/components/generic-list/filterFunctions';
import { Feature } from '@shared/schema';
import { FilterType } from '@shared/static-data';

export const FEATURE_COLUMNS: ColumnDef<Feature, unknown>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 80,
        filterFn: createContainsFilter<Feature>(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by ID...'
        },
    },
    {
        accessorKey: 'slug',
        header: 'Feature Slug',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 200,
        filterFn: createContainsFilter<Feature>(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by slug...'
        },
    },
    {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 200,
        filterFn: createContainsFilter<Feature>(),
    },
    {
        accessorKey: 'description',
        header: 'Description',
        enableResizing: true,
        size: 300,
        meta: {
            truncate: 200,
            isMarkdown: true,
        },
    }
]; 
