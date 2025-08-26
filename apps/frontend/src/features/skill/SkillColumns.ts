import { ColumnDef } from '@tanstack/react-table';

import { createContainsFilter, createEqualsFilter } from '@/components/generic-list/filterFunctions';

import { ProcessMarkdown } from '@/components/markdown/ProcessMarkdown';
import { SkillInQueryResponse } from '@shared/schema';
import { ABILITY_SELECT_LIST, ABILITY_MAP, FilterType } from '@shared/static-data';

export const SKILL_COLUMNS: ColumnDef<SkillInQueryResponse, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Skill Name',
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
        accessorKey: 'abilityId',
        header: 'Ability Score',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createEqualsFilter(),
        cell: info => {
            const abilityId = info.getValue() as number;
            return ABILITY_MAP[abilityId]?.abbreviation || '';
        },
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: ABILITY_SELECT_LIST,
        },
    },
    {
        accessorKey: 'trainedOnly',
        header: 'Trained Only',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createEqualsFilter(),
        cell: info => {
            const trainedOnly = info.getValue() as boolean;
            return trainedOnly ? 'Yes' : 'No';
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
        accessorKey: 'affectedByArmor',
        header: 'Armor Check Penalty',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 120,
        filterFn: createEqualsFilter(),
        cell: info => {
            const affectedByArmor = info.getValue() as boolean;
            return affectedByArmor ? 'Yes' : 'No';
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
        header: 'Try Again',
        enableSorting: true,
        enableResizing: true,
        size: 100,
        cell: info => {
            const retryTypeId = info.getValue() as number;
            return retryTypeId ? 'Yes' : 'No';
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
        size: 200,
        meta: {
            isMarkdown: true,
            truncate: 200,
        }
    }
]; 
