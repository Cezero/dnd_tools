import { ColumnDef } from '@tanstack/react-table';
import { FilterType } from '@/components/generic-list/types';
import { ReferenceTableSummary } from '@shared/schema';
import { createContainsFilter } from '@/components/generic-list/filterFunctions';

export const REFERENCE_TABLE_COLUMNS: ColumnDef<ReferenceTableSummary, unknown>[] = [
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
    },
    {
        accessorKey: 'rows',
        header: 'Rows',
        enableSorting: true,
        enableResizing: true,
        size: 100,
    },
    {
        accessorKey: 'columns',
        header: 'Columns',
        enableSorting: true,
        enableResizing: true,
        size: 100,
    }
]; 
