import { ColumnDef } from '@tanstack/react-table';

import { createContainsFilter, createEqualsFilter, createArrayIdFilter } from '@/components/generic-list/filterFunctions';
import { ClassSummary } from '@shared/schema';
import {
    RPG_DICE_SELECT_LIST,
    ABILITY_SELECT_LIST,
    EDITION_SELECT_LIST_FULL,
    SOURCE_BOOK_WITH_CLASSES_SELECT_LIST,
    SOURCE_BOOK_MAP,
    RPG_DICE,
    EDITION_MAP,
    ABILITY_MAP,
    GetSourceDisplay,
    FilterType
} from '@shared/static-data';

// Function to get source book options filtered by current edition selection
const getSourceBookOptionsForEdition = (currentFilters: Array<{ id: string; value: unknown }>) => {
    // Find the current edition filter
    const editionFilter = currentFilters.find(f => f.id === 'editionId');
    let selectedEditionIds: number[] = [];

    if (editionFilter) {
        if (editionFilter.value && typeof editionFilter.value === 'object' && 'values' in editionFilter.value) {
            selectedEditionIds = (editionFilter.value as { values: number[] }).values;
        } else if (Array.isArray(editionFilter.value)) {
            selectedEditionIds = editionFilter.value as number[];
        } else if (editionFilter.value) {
            selectedEditionIds = [editionFilter.value as number];
        }
    }

    // If no edition is selected, show all source books with classes
    if (selectedEditionIds.length === 0) {
        return SOURCE_BOOK_WITH_CLASSES_SELECT_LIST;
    }

    // Filter source books to only include those that:
    // 1. Have classes (hasClasses: true)
    // 2. Match the selected edition(s)
    const filteredSourceBooks = Object.values(SOURCE_BOOK_MAP).filter(book =>
        book.hasClasses && selectedEditionIds.includes(book.editionId)
    );

    return filteredSourceBooks.map(book => ({
        value: book.id,
        label: `${book.name}`
    }));
};

export const CLASS_COLUMNS: ColumnDef<ClassSummary, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 150,
        filterFn: createContainsFilter<ClassSummary>(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by name...'
        },
    },
    {
        accessorKey: 'abbreviation',
        header: 'Abbreviation',
        enableSorting: true,
        enableResizing: true,
        size: 100,
    },
    {
        accessorKey: 'editionId',
        header: 'Edition',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createArrayIdFilter<ClassSummary>('editionId'),
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
        accessorKey: 'isPrestige',
        header: 'Prestige Class',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createEqualsFilter<ClassSummary>(),
        cell: info => {
            const isPrestige = info.getValue() as boolean;
            return isPrestige ? 'Yes' : 'No';
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
        accessorKey: 'canCastSpells',
        header: 'Caster',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createEqualsFilter<ClassSummary>(),
        cell: info => {
            const canCastSpells = info.getValue() as boolean;
            return canCastSpells ? 'Yes' : 'No';
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
        accessorKey: 'hitDie',
        header: 'Hit Die',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createEqualsFilter<ClassSummary>(),
        cell: info => {
            const hitDie = info.getValue() as number;
            return RPG_DICE[hitDie]?.name || 'Unknown';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: RPG_DICE_SELECT_LIST,
        },
    },
    {
        accessorKey: 'isVisible',
        header: 'Display',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createEqualsFilter<ClassSummary>(),
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
        accessorKey: 'skillPoints',
        header: 'Skill Points',
        enableSorting: true,
        enableResizing: true,
        size: 100,
    },
    {
        accessorKey: 'castingAbilityId',
        header: 'Casting Ability',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createEqualsFilter<ClassSummary>(),
        cell: info => {
            const castingAbilityId = info.getValue() as number | null;
            return castingAbilityId ? ABILITY_MAP[castingAbilityId]?.name || 'Unknown' : 'None';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: ABILITY_SELECT_LIST,
        },
    },
    {
        accessorKey: 'description',
        header: 'Description',
        enableResizing: true,
        size: 200,
        meta: {
            truncate: 200,
        },
    },
    {
        accessorKey: 'sourceBookInfo',
        header: 'Source',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 150,
        filterFn: createArrayIdFilter<ClassSummary>('sourceBookId'),
        cell: info => {
            const sourceBookInfo = info.getValue() as { sourceBookId: number; pageNumber: number }[];
            if (sourceBookInfo && sourceBookInfo.length > 0) {
                return GetSourceDisplay(sourceBookInfo.map(s => ({ bookId: s.sourceBookId, pageNumber: s.pageNumber })), true);
            }
            return '';
        },
        meta: {
            filterType: FilterType.MULTI_SELECT,
            options: getSourceBookOptionsForEdition,
        },
    },

]; 
