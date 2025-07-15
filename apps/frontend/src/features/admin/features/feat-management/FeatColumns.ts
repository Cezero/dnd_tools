import { ColumnDef } from '@tanstack/react-table';
import { FilterType } from '@/components/generic-list/types';
import { FeatInQueryResponse } from '@shared/schema';
import { FEAT_TYPE_SELECT_LIST } from '@shared/static-data';
import { createContainsFilter, createEqualsFilter, createArrayIdFilter } from '@/components/generic-list/filterFunctions';

export const FEAT_COLUMNS: ColumnDef<FeatInQueryResponse, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Feat Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 150,
        filterFn: createContainsFilter(),
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
        filterFn: createArrayIdFilter('typeId'),
        cell: info => {
            const typeId = info.getValue() as number;
            return FEAT_TYPE_SELECT_LIST.find(type => type.value === typeId)?.label || typeId;
        },
        meta: {
            filterType: FilterType.MULTI_SELECT,
            options: FEAT_TYPE_SELECT_LIST,
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
        filterFn: createEqualsFilter(),
        cell: info => {
            const repeatable = info.getValue() as boolean;
            return repeatable ? 'Yes' : 'No';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: [
                { value: true, label: 'Yes' },
                { value: false, label: 'No' }
            ]
        },
    }
]; 
