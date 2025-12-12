import { ColumnDef } from '@tanstack/react-table';

import { createArrayIdFilter, createContainsFilter, createEqualsFilter } from '@/components/generic-list/filterFunctions';
import { DeityInQueryResponse } from '@shared/schema';
import { EDITION_LIST, ALIGNMENT_LIST, FilterType, EDITION_MAP, PANTHEON_MAP, PANTHEON_LIST, SourceType, EditionId } from '@shared/static-data';
import { GetSourceDisplay, GetSourceBookTypeList } from '@shared/utils';

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
            options: PANTHEON_LIST,
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
            return ALIGNMENT_LIST.find(alignment => alignment.id === alignmentId)?.name || alignmentId;
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: ALIGNMENT_LIST,
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
            options: EDITION_LIST,
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
            options: (currentFilters: Array<{ id: string; value: unknown }>) => {
                const editionFilter = currentFilters.find(f => f.id === 'editionId');
                const editionId = editionFilter?.value as EditionId;
                return GetSourceBookTypeList(SourceType.Deities, editionId);
            },
        },
    },
];
