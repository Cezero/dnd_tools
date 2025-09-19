import { ColumnDef } from '@tanstack/react-table';

import { createArrayIdFilter, createContainsFilter, createEqualsFilter } from '@/components/generic-list/filterFunctions';
import { getSourceBookOptionsForDeities } from '@/utils';
import { DeityInQueryResponse } from '@shared/schema';
import { EDITION_SELECT_LIST, ALIGNMENT_SELECT_LIST, FilterType, EDITION_MAP, GetSourceDisplay, SOURCE_BOOK_WITH_DEITIES_SELECT_LIST, PANTHEON_MAP, PANTHEON_SELECT_LIST } from '@shared/static-data';

export const DEITY_COLUMNS: ColumnDef<DeityInQueryResponse, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Deity Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 150,
        filterFn: createContainsFilter<DeityInQueryResponse>(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by name...'
        },
    },
    {
        accessorKey: 'title',
        header: 'Title',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
    },
    {
        accessorKey: 'pantheonId',
        header: 'Pantheon',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        cell: info => {
            const pantheonId = info.getValue() as number;
            return PANTHEON_MAP[pantheonId]?.name || pantheonId;
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: PANTHEON_SELECT_LIST,
        },
    },
    {
        accessorKey: 'alignmentId',
        header: 'Alignment',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 40,
        filterFn: createEqualsFilter<DeityInQueryResponse>(),
        cell: info => {
            const alignmentId = info.getValue() as number;
            return ALIGNMENT_SELECT_LIST.find(alignment => alignment.value === alignmentId)?.label || alignmentId;
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: ALIGNMENT_SELECT_LIST,
        },
    },
    {
        accessorKey: 'editionId',
        header: 'Edition',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 60,
        filterFn: createEqualsFilter<DeityInQueryResponse>(),
        cell: info => {
            const editionId = info.getValue() as number;
            return EDITION_MAP[editionId]?.abbreviation || editionId;
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: EDITION_SELECT_LIST,
        },
    },
    {
        accessorKey: 'sourceBookInfo',
        header: 'Source',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 150,
        filterFn: createArrayIdFilter<DeityInQueryResponse>('sourceBookId'),
        cell: info => {
            const sourceBookInfo = info.getValue() as { sourceBookId: number; pageNumber: number }[];
            if (sourceBookInfo && sourceBookInfo.length > 0) {
                return GetSourceDisplay(sourceBookInfo, true);
            }
            return '';
        },
        meta: {
            filterType: FilterType.MULTI_SELECT,
            options: (currentFilters: Array<{ id: string; value: unknown }>) =>
                getSourceBookOptionsForDeities(currentFilters, SOURCE_BOOK_WITH_DEITIES_SELECT_LIST),
        },
    },
];
