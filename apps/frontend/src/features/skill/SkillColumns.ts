import { ColumnDef } from '@tanstack/react-table';

import { createContainsFilter, createEqualsFilter } from '@/components/generic-list/filterFunctions';
import { Skill } from '@shared/schema';
import { ABILITY_LIST, ABILITY_MAP, FilterType, BooleanFilter, BOOLEAN_FILTER_LIST } from '@shared/static-data';

export const SKILL_COLUMNS: ColumnDef<Skill, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Skill Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 150,
        filterFn: createContainsFilter<Skill>(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by name...'
        },
    },
    {
        accessorKey: 'abilityId',
        header: 'Ability Score',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createEqualsFilter<Skill>(),
        cell: info => {
            const abilityId = info.getValue() as number;
            return ABILITY_MAP[abilityId]?.abbreviation || '';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: ABILITY_LIST,
        },
    },
    {
        accessorKey: 'trainedOnly',
        header: 'Trained Only',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: (row, columnId, filterValue) => {
            const trainedOnly = row.getValue(columnId) as boolean;
            if (filterValue === BooleanFilter.TRUE) {
                return trainedOnly;
            } else if (filterValue === BooleanFilter.FALSE) {
                return !trainedOnly;
            }
            return true;
        },
        cell: info => {
            const trainedOnly = info.getValue() as boolean;
            return trainedOnly ? 'Yes' : 'No';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: BOOLEAN_FILTER_LIST,
        },
    },
    {
        accessorKey: 'affectedByArmor',
        header: 'Armor Check Penalty',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: (row, columnId, filterValue) => {
            const affectedByArmor = row.getValue(columnId) as boolean;
            if (filterValue === BooleanFilter.TRUE) {
                return affectedByArmor;
            } else if (filterValue === BooleanFilter.FALSE) {
                return !affectedByArmor;
            }
            return true;
        },
        cell: info => {
            const affectedByArmor = info.getValue() as boolean;
            return affectedByArmor ? 'Yes' : 'No';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: BOOLEAN_FILTER_LIST,
        },
    },
    {
        accessorKey: 'checkDescription',
        header: 'Skill Check',
        enableResizing: true,
        size: 200,
        meta: {
            isMarkdown: true,
            truncate: 200,
        }
    },
    {
        accessorKey: 'actionDescription',
        header: 'Action',
        enableResizing: true,
        size: 150,
        meta: {
            isMarkdown: true,
            truncate: 200,
        }
    },
    {
        accessorKey: 'retryTypeId',
        header: 'Retry',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createEqualsFilter<Skill>(),
        cell: info => {
            const retryTypeId = info.getValue() as number;
            const retryTypes = {
                0: 'No',
                1: 'Yes',
                2: 'Special'
            };
            return retryTypes[retryTypeId as keyof typeof retryTypes] || 'Unknown';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: [
                { value: 0, label: 'No' },
                { value: 1, label: 'Yes' },
                { value: 2, label: 'Special' }
            ]
        },
    },
    {
        accessorKey: 'retryDescription',
        header: 'Try Again Desc',
        enableResizing: true,
        size: 150,
        meta: {
            isMarkdown: true,
            truncate: 200,
        }
    },
    {
        accessorKey: 'specialNotes',
        header: 'Special',
        enableResizing: true,
        size: 150,
        meta: {
            isMarkdown: true,
            truncate: 200,
        }
    },
    {
        accessorKey: 'synergyNotes',
        header: 'Synergy',
        enableResizing: true,
        size: 150,
        meta: {
            isMarkdown: true,
            truncate: 200,
        }
    },
    {
        accessorKey: 'untrainedNotes',
        header: 'Untrained Desc',
        enableResizing: true,
        size: 150,
        meta: {
            isMarkdown: true,
            truncate: 200,
        }
    },
    {
        accessorKey: 'description',
        header: 'Description',
        enableResizing: true,
        size: 300,
        meta: {
            isMarkdown: true,
            truncate: 200,
        }
    }
]; 
