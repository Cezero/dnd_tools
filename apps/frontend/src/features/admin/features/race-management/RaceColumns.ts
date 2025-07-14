import { ColumnDef } from '@tanstack/react-table';
import { FilterType } from '@/components/generic-list/types';
import { RaceInQueryResponse } from '@shared/schema';
import {
    EDITION_SELECT_LIST,
    CLASS_SELECT_LIST,
    SIZE_SELECT_LIST,
    EDITION_MAP,
    CLASS_MAP,
    SIZE_MAP
} from '@shared/static-data';
import { createContainsFilter, createEqualsFilter } from '@/components/generic-list/filterFunctions';
import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';

export const RACE_COLUMNS: ColumnDef<RaceInQueryResponse, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
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
        accessorKey: 'editionId',
        header: 'Edition',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createEqualsFilter(),
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
        filterFn: createEqualsFilter(),
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
        cell: info => {
            const description = info.getValue() as string;
            return <ProcessMarkdown id={ `race-${info.row.original.id}-description` } markdown = { description || ''
        } />;
        },
    },
{
    accessorKey: 'sizeId',
        header: 'Size',
            enableSorting: true,
                enableColumnFilter: true,
                    enableResizing: true,
                        size: 100,
                            filterFn: createEqualsFilter(),
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
                            filterFn: createEqualsFilter(),
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
