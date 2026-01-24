import { ColumnDef } from '@tanstack/react-table';

import { createContainsFilter } from '@/components/generic-list/filterFunctions';
import type { OrphanedFeatureListItem } from '@shared/schema';
import { FilterType } from '@shared/static-data';

export const ORPHANED_FEATURE_COLUMNS: ColumnDef<OrphanedFeatureListItem>[] = [
    {
        accessorKey: 'id',
        header: 'ID',
        enableSorting: true,
        size: 80,
        meta: { required: true },
    },
    {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 260,
        filterFn: createContainsFilter<OrphanedFeatureListItem>(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by name...'
        },
    },
    {
        accessorKey: 'sourceType',
        header: 'Source type',
        enableSorting: true,
        size: 140,
        meta: { required: true },
    },
    {
        accessorKey: 'level',
        header: 'Level',
        enableSorting: true,
        size: 90,
        meta: { required: true },
    },
    {
        accessorKey: 'editionId',
        header: 'Edition',
        enableSorting: true,
        size: 100,
        meta: { required: true },
    },
];

