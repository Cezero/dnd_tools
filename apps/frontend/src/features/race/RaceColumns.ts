import { ColumnDef } from '@tanstack/react-table';

import { createContainsFilter, createEqualsFilter, createArrayIdFilter } from '@/components/generic-list/filterFunctions';
import { RaceSummary } from '@shared/schema';
import {
    EDITION_SELECT_LIST,
    CLASS_SELECT_LIST,
    SIZE_SELECT_LIST,
    EDITION_MAP,
    CLASS_MAP,
    SIZE_MAP,
    FilterType
} from '@shared/static-data';

export const RACE_COLUMNS: ColumnDef<RaceSummary, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 150,
        filterFn: createContainsFilter<RaceSummary>(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by name...'
        },
    },
    {
        accessorKey: 'editionId',
        header: 'Edition',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createArrayIdFilter<RaceSummary>('editionId'),
        cell: info => {
            const editionId = info.getValue() as number;
            return EDITION_MAP[editionId]?.abbreviation || '';
        },
        meta: {
            filterType: FilterType.MULTI_SELECT,
            options: EDITION_SELECT_LIST,
        },
    },
    {
        accessorKey: 'isVisible',
        header: 'Display',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createEqualsFilter<RaceSummary>(),
        cell: info => {
            const isVisible = info.getValue() as boolean;
            return isVisible ? 'Yes' : 'No';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: [
                { value: true, label: 'Yes' },
                { value: false, label: 'No' }
            ]
        },
    },
    {
        accessorKey: 'description',
        header: 'Description',
        enableResizing: true,
        size: 200,
        meta: {
            truncate: 200,
            isMarkdown: true,
        },
    },
    {
        accessorKey: 'sizeId',
        header: 'Size',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createEqualsFilter<RaceSummary>(),
        cell: info => {
            const sizeId = info.getValue() as number;
            return SIZE_MAP[sizeId]?.name || '';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: SIZE_SELECT_LIST,
        },
    },
    {
        accessorKey: 'speed',
        header: 'Speed',
        enableSorting: true,
        enableResizing: true,
        size: 100,
    },
    {
        accessorKey: 'favoredClassId',
        header: 'Favored Class',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createEqualsFilter<RaceSummary>(),
        cell: info => {
            const favoredClassId = info.getValue() as number;
            if (favoredClassId === -1) {
                return 'Any';
            }
            return CLASS_MAP[favoredClassId]?.name || '';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: CLASS_SELECT_LIST,
        },
    }
]; 
