import { ColumnDef } from '@tanstack/react-table';

import { createContainsFilter, createArrayIdFilter } from '@/components/generic-list/filterFunctions';
import { FeatInQueryResponse } from '@shared/schema';
import { FEAT_TYPE_LIST, FilterType, BooleanFilter, BOOLEAN_FILTER_LIST } from '@shared/static-data';

export const FEAT_COLUMNS: ColumnDef<FeatInQueryResponse, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Feat Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 150,
        filterFn: createContainsFilter<FeatInQueryResponse>(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by name...'
        },
    },
    {
        accessorKey: 'typeId',
        header: 'Feat Type',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createArrayIdFilter<FeatInQueryResponse>('typeId'),
        cell: info => {
            const typeId = info.getValue() as number;
            return FEAT_TYPE_LIST.find(type => type.id === typeId)?.name || typeId;
        },
        meta: {
            filterType: FilterType.MULTI_SELECT,
            options: FEAT_TYPE_LIST,
        },
    },
    {
        accessorKey: 'description',
        header: 'Description',
        enableResizing: true,
        size: 200,
        meta: {
            isMarkdown: true,
            truncate: 200,
        },
    },
    {
        accessorKey: 'benefit',
        header: 'Benefit',
        enableResizing: true,
        size: 200,
        meta: {
            isMarkdown: true,
            truncate: 200,
        },
    },
    {
        accessorKey: 'normalEffect',
        header: 'Normal',
        enableResizing: true,
        size: 150,
        meta: {
            isMarkdown: true,
            truncate: 200,
        },
    },
    {
        accessorKey: 'specialEffect',
        header: 'Special',
        enableResizing: true,
        size: 150,
        meta: {
            isMarkdown: true,
            truncate: 200,
        },
    },
    {
        accessorKey: 'prerequisites',
        header: 'Prerequisite',
        enableResizing: true,
        size: 150,
        meta: {
            isMarkdown: true,
            truncate: 200,
        },
    },
    {
        accessorKey: 'repeatable',
        header: 'Multi-Times',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: (row, columnId, filterValue) => {
            const repeatable = row.getValue(columnId) as boolean;
            if (filterValue === BooleanFilter.TRUE) {
                return repeatable;
            } else if (filterValue === BooleanFilter.FALSE) {
                return !repeatable;
            }
            return true;
        },
        cell: info => {
            const repeatable = info.getValue() as boolean;
            return repeatable ? 'Yes' : 'No';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: BOOLEAN_FILTER_LIST,
        },
    }
]; 
