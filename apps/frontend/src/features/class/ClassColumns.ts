import { ColumnDef } from '@tanstack/react-table';

import { createContainsFilter, createEqualsFilter, createArrayIdFilter } from '@/components/generic-list/filterFunctions';
import { getSourceBookOptionsForClasses } from '@/utils';
import { ClassSummary } from '@shared/schema';
import {
    RPG_DICE_SELECT_LIST,
    ABILITY_SELECT_LIST,
    EDITION_SELECT_LIST_FULL,
    SOURCE_BOOK_WITH_CLASSES_SELECT_LIST,
    RPG_DICE,
    EDITION_MAP,
    ABILITY_MAP,
    GetSourceDisplay,
    FilterType,
    isVariantId
} from '@shared/static-data';

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
        accessorKey: 'id',
        header: 'Type',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createEqualsFilter<ClassSummary>(),
        cell: info => {
            const id = info.getValue() as number;
            return isVariantId(id) ? 'Variant' : 'Base';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: [
                { value: 'variant', label: 'Variant' },
                { value: 'base', label: 'Base' }
            ]
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
                return GetSourceDisplay(sourceBookInfo, true);
            }
            return '';
        },
        meta: {
            filterType: FilterType.MULTI_SELECT,
            options: (currentFilters: Array<{ id: string; value: unknown }>) =>
                getSourceBookOptionsForClasses(currentFilters, SOURCE_BOOK_WITH_CLASSES_SELECT_LIST),
        },
    },

]; 
