import { ColumnDef } from '@tanstack/react-table';
import { FilterType } from '@/components/generic-list/types';
import { ItemWithDetails } from '@shared/schema';
import { ITEM_TYPE_SELECT_LIST, ITEM_TYPES } from '@shared/static-data';
import { createContainsFilter, createEqualsFilter } from '@/components/generic-list/filterFunctions';
import { formatCostAsCurrency } from './utils';

export const ITEM_COLUMNS: ColumnDef<ItemWithDetails, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Item Name',
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
        accessorKey: 'typeId',
        header: 'Type',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createEqualsFilter(),
        cell: info => {
            const typeId = info.getValue() as number;
            return ITEM_TYPES[typeId]?.name || typeId;
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: ITEM_TYPE_SELECT_LIST,
        },
    },
    {
        accessorKey: 'cost',
        header: 'Cost',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createContainsFilter(),
        cell: info => {
            const cost = info.getValue() as number;
            return formatCostAsCurrency(cost);
        },
        meta: {
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by cost...'
        },
    },
    {
        accessorKey: 'weight',
        header: 'Weight',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createContainsFilter(),
        cell: info => {
            const weight = info.getValue() as number | null;
            return weight !== null ? `${weight} lbs` : '-';
        },
        meta: {
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by weight...'
        },
    },
    {
        accessorKey: 'description',
        header: 'Description',
        enableResizing: true,
        size: 300,
        cell: info => {
            const description = info.getValue() as string;
            const truncatedDescription = description && description.length > 200
                ? `${description.substring(0, 200)}...`
                : description;
            return truncatedDescription || '';
        },
    }
]; 
