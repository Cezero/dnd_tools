import { ColumnDef } from '@tanstack/react-table';

import { createContainsFilter, createEqualsFilter } from '@/components/generic-list/filterFunctions';
import { getRaceNameFromCache } from '@/services/cache';
import { CharacterWithRaceResponse } from '@shared/schema';
import { ALIGNMENT_MAP, ALIGNMENT_LIST, FilterType } from '@shared/static-data';

export const CHARACTER_COLUMNS: ColumnDef<CharacterWithRaceResponse, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Character Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 150,
        filterFn: createContainsFilter<CharacterWithRaceResponse>(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by name...'
        },
    },
    {
        id: 'race',
        accessorFn: (row) => {
            if (!row.raceId) return '';
            return getRaceNameFromCache(row.raceId) || '';
        },
        header: 'Race',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createContainsFilter<CharacterWithRaceResponse>(),
        cell: info => {
            const raceName = info.getValue() as string;
            return raceName || '-';
        },
        meta: {
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by race...'
        },
    },
    {
        accessorKey: 'alignmentId',
        header: 'Alignment',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createEqualsFilter<CharacterWithRaceResponse>(),
        cell: info => {
            const alignmentId = info.getValue() as number;
            return ALIGNMENT_MAP[alignmentId]?.name || alignmentId;
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: ALIGNMENT_LIST,
        },
    },
    {
        accessorKey: 'classLevelString',
        header: 'Class/Level',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 150,
        filterFn: createContainsFilter<CharacterWithRaceResponse>(),
        cell: info => {
            const classLevel = info.getValue() as string;
            return classLevel || '-';
        },
        meta: {
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by class/level...'
        },
    },
    {
        accessorKey: 'characterLevel',
        header: 'Character Level',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createEqualsFilter<CharacterWithRaceResponse>(),
        cell: info => {
            const level = info.getValue() as number;
            return level > 0 ? level.toString() : '-';
        },
        meta: {
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by level...'
        },
    },
    {
        accessorKey: 'notes',
        header: 'Notes',
        enableResizing: true,
        size: 200,
        meta: {
            truncate: 100,
        },
    },
]; 
