import { ColumnDef } from '@tanstack/react-table';

import { createEqualsFilter, createContainsFilter } from '@/components/generic-list/filterFunctions';
import { CompanionWithRelations } from '@shared/schema';
import { FilterType, COMPANION_TYPE_LIST, COMPANION_TYPE_MAP } from '@shared/static-data';

export const COMPANION_COLUMNS: ColumnDef<CompanionWithRelations, unknown>[] = [
    {
        id: 'monster',
        accessorKey: 'monster.name',
        header: 'Monster',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 250,
        filterFn: createContainsFilter<CompanionWithRelations>(),
        cell: ({ row }) => {
            return row.original.monster?.name || '';
        },
        meta: {
            required: true,
        },
    },
    {
        id: 'type',
        accessorKey: 'type',
        header: 'Type',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 200,
        filterFn: createEqualsFilter<CompanionWithRelations>(),
        cell: ({ row }) => {
            const type = row.original.type;
            const typeName = COMPANION_TYPE_MAP[type]?.name;
            return typeName || String(type);
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: COMPANION_TYPE_LIST,
        },
    },
    {
        id: 'minLevel',
        accessorKey: 'minLevel',
        header: 'Minimum Level',
        enableSorting: true,
        enableColumnFilter: false,
        enableResizing: true,
        size: 120,
        cell: ({ row }) => {
            const minLevel = row.original.minLevel;
            return minLevel ? minLevel.toString() : '-';
        },
    },
];

