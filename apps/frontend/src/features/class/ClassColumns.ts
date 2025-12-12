import { ColumnDef } from '@tanstack/react-table';

import { createContainsFilter, createEqualsFilter, createArrayIdFilter } from '@/components/generic-list/filterFunctions';
import { ClassSummary } from '@shared/schema';
import {
    RPG_DICE_LIST,
    ABILITY_LIST,
    EDITION_LIST,
    RPG_DICE,
    EDITION_MAP,
    ABILITY_MAP,
    FilterType,
    SourceType,
    EditionId,
    ClassType,
    BOOLEAN_FILTER_LIST,
    CLASS_TYPE_LIST
} from '@shared/static-data';
import { GetSourceDisplay, isVariantId, GetSourceBookTypeList } from '@shared/utils';

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
        filterFn: (row, columnId, filterValue) => {
            const id = row.getValue(columnId) as number;
            const isVariant = isVariantId(id);

            if (filterValue === ClassType.VARIANT) {
                return isVariant;
            } else if (filterValue === ClassType.BASE) {
                return !isVariant;
            }
            return true;
        },
        cell: info => {
            const id = info.getValue() as number;
            return isVariantId(id) ? 'Variant' : 'Base';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: CLASS_TYPE_LIST
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
            options: EDITION_LIST,
        },
    },
    {
        accessorKey: 'isPrestige',
        header: 'Prestige Class',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: (row, columnId, filterValue) => {
            const isPrestige = row.getValue(columnId) as boolean;
            if (filterValue === 1) { // TRUE
                return isPrestige;
            } else if (filterValue === 0) { // FALSE
                return !isPrestige;
            }
            return true;
        },
        cell: info => {
            const isPrestige = info.getValue() as boolean;
            return isPrestige ? 'Yes' : 'No';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: BOOLEAN_FILTER_LIST
        },
    },
    {
        accessorKey: 'canCastSpells',
        header: 'Caster',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: (row, columnId, filterValue) => {
            const canCastSpells = row.getValue(columnId) as boolean;
            if (filterValue === 1) { // TRUE
                return canCastSpells;
            } else if (filterValue === 0) { // FALSE
                return !canCastSpells;
            }
            return true;
        },
        cell: info => {
            const canCastSpells = info.getValue() as boolean;
            return canCastSpells ? 'Yes' : 'No';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: BOOLEAN_FILTER_LIST
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
            options: RPG_DICE_LIST,
        },
    },
    {
        accessorKey: 'isVisible',
        header: 'Display',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: (row, columnId, filterValue) => {
            const isVisible = row.getValue(columnId) as boolean;
            if (filterValue === 1) { // TRUE
                return isVisible;
            } else if (filterValue === 0) { // FALSE
                return !isVisible;
            }
            return true;
        },
        cell: info => {
            const isVisible = info.getValue() as boolean;
            return isVisible ? 'Yes' : 'No';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: BOOLEAN_FILTER_LIST
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
            options: ABILITY_LIST,
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
            options: (currentFilters: Array<{ id: string; value: unknown }>) => {
                const editionFilter = currentFilters.find(f => f.id === 'editionId');
                const editionId = editionFilter?.value as EditionId;
                return GetSourceBookTypeList(SourceType.Classes, editionId);
            },
        },
    },

]; 
