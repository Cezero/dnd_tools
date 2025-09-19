import { ColumnDef } from '@tanstack/react-table';

import { createContainsFilter, createArrayIdFilter } from '@/components/generic-list/filterFunctions';
import { getSourceBookOptionsForDomains } from '@/utils';
import { DomainSummary } from '@shared/schema';
import { EDITION_SELECT_LIST_FULL, SOURCE_BOOK_WITH_DOMAINS_SELECT_LIST, EDITION_MAP, GetSourceDisplay, FilterType } from '@shared/static-data';

export const DOMAIN_COLUMNS: ColumnDef<DomainSummary, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Domain Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 150,
        filterFn: createContainsFilter<DomainSummary>(),
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
        filterFn: createArrayIdFilter<DomainSummary>('editionId'),
        cell: info => {
            const editionId = info.getValue() as number;
            return EDITION_MAP[editionId]?.abbreviation || '';
        },
        meta: {
            filterType: FilterType.MULTI_SELECT,
            options: EDITION_SELECT_LIST_FULL,
        },
    },
    {
        accessorKey: 'sourceBookInfo',
        header: 'Source',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 150,
        filterFn: createArrayIdFilter<DomainSummary>('sourceBookId'),
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
                getSourceBookOptionsForDomains(currentFilters, SOURCE_BOOK_WITH_DOMAINS_SELECT_LIST),
        },
    },
];
