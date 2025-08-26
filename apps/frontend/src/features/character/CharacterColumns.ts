import { ColumnDef } from '@tanstack/react-table';

import { createContainsFilter, createEqualsFilter } from '@/components/generic-list/filterFunctions';
import { CharacterWithRaceResponse } from '@shared/schema';
import { ALIGNMENT_MAP, ALIGNMENT_SELECT_LIST, FilterType } from '@shared/static-data';

export const CHARACTER_COLUMNS: ColumnDef<CharacterWithRaceResponse, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Character Name',
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
        accessorKey: 'race.name',
        header: 'Race',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createContainsFilter(),
        cell: info => {
            const race = info.getValue() as string;
            return race || '-';
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
        filterFn: createEqualsFilter(),
        cell: info => {
            const alignmentId = info.getValue() as number;
            return ALIGNMENT_MAP[alignmentId]?.name || alignmentId;
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: ALIGNMENT_SELECT_LIST,
        },
    },
    {
        accessorKey: 'age',
        header: 'Age',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 80,
        filterFn: createContainsFilter(),
        cell: info => {
            const age = info.getValue() as number | null;
            return age ? age.toString() : '-';
        },
        meta: {
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by age...'
        },
    },
    {
        accessorKey: 'gender',
        header: 'Gender',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createContainsFilter(),
        cell: info => {
            const gender = info.getValue() as string | null;
            return gender || '-';
        },
        meta: {
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by gender...'
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
