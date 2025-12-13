import { ColumnDef } from '@tanstack/react-table';

import { createArrayIdFilter, createEqualsFilter, createContainsFilter } from '@/components/generic-list/filterFunctions';
import { Monster } from '@shared/schema';
import {
    MONSTER_TYPE_LIST,
    MONSTER_SUBTYPE_LIST,
    SIZE_LIST,
    EDITION_LIST,
    EDITION_MAP,
    SIZE_MAP,
    FilterType,
    SourceType,
    EditionId,
    SOURCE_BOOK_MAP,
} from '@shared/static-data';
import { GetSourceDisplay } from '@shared/utils';

export const useMonsterColumns = (): ColumnDef<Monster, unknown>[] => {
    return [
        {
            accessorKey: 'name',
            header: 'Name',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 150,
            filterFn: createContainsFilter<Monster>(),
            meta: {
                required: true,
                filterType: FilterType.TEXT_INPUT,
                placeholder: 'Filter by name...',
            },
        },
        {
            accessorKey: 'editionId',
            header: 'Edition',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 100,
            filterFn: createEqualsFilter<Monster>(),
            cell: info => {
                const editionId = info.getValue() as number;
                return EDITION_MAP[editionId]?.abbreviation || '';
            },
            meta: {
                filterType: FilterType.MULTI_SELECT,
                options: EDITION_LIST,
            },
        },
        {
            accessorKey: 'sizeId',
            header: 'Size',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 80,
            filterFn: createEqualsFilter<Monster>(),
            cell: info => {
                const sizeId = info.getValue() as number | null;
                return sizeId ? SIZE_MAP[sizeId]?.name || '' : '';
            },
            meta: {
                filterType: FilterType.SINGLE_SELECT,
                options: SIZE_LIST,
            },
        },
        {
            accessorKey: 'types',
            header: 'Types',
            enableColumnFilter: true,
            enableResizing: true,
            size: 150,
            filterFn: createArrayIdFilter<Monster>('typeId'),
            cell: info => {
                const types = info.getValue() as { typeId: number }[] | null;
                if (!types || types.length === 0) return '';
                return types.map(t => MONSTER_TYPE_LIST.find(type => type.id === t.typeId)?.name || '').join(', ');
            },
            meta: {
                filterType: FilterType.MULTI_SELECT,
                options: MONSTER_TYPE_LIST,
            },
        },
        {
            accessorKey: 'subtypes',
            header: 'Subtypes',
            enableColumnFilter: true,
            enableResizing: true,
            size: 150,
            filterFn: createArrayIdFilter<Monster>('subtypeId'),
            cell: info => {
                const subtypes = info.getValue() as { subtypeId: number }[] | null;
                if (!subtypes || subtypes.length === 0) return '';
                return subtypes.map(s => MONSTER_SUBTYPE_LIST.find(subtype => subtype.id === s.subtypeId)?.name || '').join(', ');
            },
            meta: {
                filterType: FilterType.MULTI_SELECT,
                options: MONSTER_SUBTYPE_LIST,
            },
        },
        {
            accessorKey: 'challengeRating',
            header: 'CR',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 60,
            filterFn: createContainsFilter<Monster>(),
            meta: {
                filterType: FilterType.TEXT_INPUT,
                placeholder: 'Filter by CR...',
            },
        },
        {
            accessorKey: 'hitDiceQty',
            header: 'HD',
            enableSorting: true,
            enableResizing: true,
            size: 80,
            cell: info => {
                const qty = info.row.original.hitDiceQty;
                const type = info.row.original.hitDiceType;
                if (qty === null || qty === undefined) return '';
                const diceType = type ? `d${type}` : '';
                return `${qty}${diceType}`;
            },
        },
        {
            accessorKey: 'armorClass',
            header: 'AC',
            enableSorting: true,
            enableResizing: true,
            size: 60,
        },
        {
            accessorKey: 'touchAC',
            header: 'Touch',
            enableSorting: true,
            enableResizing: true,
            size: 60,
        },
        {
            accessorKey: 'flatFootedAC',
            header: 'Flat-Footed',
            enableSorting: true,
            enableResizing: true,
            size: 100,
        },
        {
            accessorKey: 'baseSpeed',
            header: 'Speed',
            enableSorting: true,
            enableResizing: true,
            size: 80,
            cell: info => {
                const speed = info.getValue() as number | null;
                return speed !== null ? `${speed} ft.` : '';
            },
        },
        {
            accessorKey: 'sourceBookInfo',
            header: 'Sources',
            enableColumnFilter: true,
            enableResizing: true,
            size: 150,
            filterFn: createArrayIdFilter<Monster>('sourceBookId'),
            cell: info => {
                const sources = info.getValue() as { sourceBookId: number; pageNumber: number | null }[] | null;
                if (!sources || sources.length === 0) return '';
                return GetSourceDisplay(sources, true);
            },
            meta: {
                filterType: FilterType.MULTI_SELECT,
                options: (currentFilters: Array<{ id: string; value: unknown }>) => {
                    const editionFilter = currentFilters.find(f => f.id === 'editionId');
                    const editionId = editionFilter?.value as EditionId;
                    // Return all source books for the edition since monsters can come from any source
                    if (editionId) {
                        return Object.values(SOURCE_BOOK_MAP).filter(book => 
                            book.editionId === editionId && book.isVisible !== false
                        );
                    }
                    return Object.values(SOURCE_BOOK_MAP).filter(book => book.isVisible !== false);
                },
            },
        },
        {
            accessorKey: 'isVisible',
            header: 'Visible',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 80,
            filterFn: createEqualsFilter<Monster>(),
            cell: info => {
                const isVisible = info.getValue() as boolean;
                return isVisible ? 'Yes' : 'No';
            },
            meta: {
                filterType: FilterType.SINGLE_SELECT,
                options: [
                    { id: 'true', name: 'Yes' },
                    { id: 'false', name: 'No' },
                ],
            },
        },
    ];
};

