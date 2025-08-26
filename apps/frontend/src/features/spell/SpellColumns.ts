import { ColumnDef } from '@tanstack/react-table';

import { createArrayIdFilter, createEqualsFilter, createContainsFilter } from '@/components/generic-list/filterFunctions';

import { SpellInQueryResponse } from '@shared/schema/spell';
import {
    SPELL_SCHOOL_SELECT_LIST,
    SPELL_DESCRIPTOR_SELECT_LIST,
    SPELL_COMPONENT_SELECT_LIST,
    CLASS_WITH_SPELLS_SELECT_LIST,
    SOURCE_BOOK_WITH_SPELLS_SELECT_LIST,
    SpellSchoolNameList,
    SpellDescriptorNameList,
    SpellComponentAbbrList,
    GetSourceDisplay,
    FilterType
} from '@shared/static-data';

import { GetClassDisplay } from './spellUtil';

export const SPELL_COLUMNS: ColumnDef<SpellInQueryResponse, unknown>[] = [
    {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: true,
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createContainsFilter(),
        meta: {
            required: true,
            filterType: FilterType.TEXT_INPUT,
            placeholder: 'Filter by name...'
        },
    },
    {
        accessorKey: 'baseLevel',
        header: 'Level',
        enableSorting: true,
        enableResizing: true,
        enableColumnFilter: true,
        size: 40,
        filterFn: createEqualsFilter(),
        meta: {
            filterType: FilterType.SINGLE_SELECT,
            options: [...Array(10).keys()].map(level => ({
                value: level,
                label: level.toString()
            }))
        },
    },
    {
        accessorKey: 'summary',
        header: 'Summary',
        enableSorting: false,
        enableResizing: true,
    },
    {
        accessorKey: 'schoolIds',
        header: 'School',
        enableColumnFilter: true,
        size: 100,
        enableResizing: true,
        filterFn: createArrayIdFilter('schoolId'),
        cell: info => {
            const schools = info.getValue() as { schoolId: number }[];
            const labels = SpellSchoolNameList(schools.map(s => s.schoolId));
            return labels;
        },
        meta: {
            filterType: FilterType.MULTI_SELECT,
            options: SPELL_SCHOOL_SELECT_LIST,
        },
    },
    {
        accessorKey: 'descriptorIds',
        header: 'Descriptors',
        enableColumnFilter: true,
        enableResizing: true,
        filterFn: createArrayIdFilter('descriptorId'),
        cell: info => {
            const descriptors = info.getValue() as { descriptorId: number }[];
            const labels = SpellDescriptorNameList(descriptors.map(d => d.descriptorId));
            return labels;
        },
        meta: {
            filterType: FilterType.MULTI_SELECT,
            options: SPELL_DESCRIPTOR_SELECT_LIST,
        },
    },
    {
        accessorKey: 'componentIds',
        header: 'Components',
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createArrayIdFilter('componentId'),
        cell: info => {
            const components = info.getValue() as { componentId: number }[];
            const labels = SpellComponentAbbrList(components.map(c => c.componentId));
            return labels;
        },
        meta: {
            filterType: FilterType.MULTI_SELECT,
            options: SPELL_COMPONENT_SELECT_LIST,
        },
    },
    {
        accessorKey: 'sourceBookInfo',
        header: 'Sources',
        enableColumnFilter: true,
        enableResizing: true,
        size: 100,
        filterFn: createArrayIdFilter('sourceBookId'),
        cell: info => {
            const sources = info.getValue() as { sourceBookId: number, pageNumber: number }[];
            const labels = GetSourceDisplay(sources.map(s => ({ bookId: s.sourceBookId, pageNumber: s.pageNumber })), true);
            return labels;
        },
        meta: {
            filterType: FilterType.MULTI_SELECT,
            options: SOURCE_BOOK_WITH_SPELLS_SELECT_LIST,
        },
    },
    {
        accessorKey: 'levelMapping',
        header: 'Classes',
        enableColumnFilter: true,
        enableResizing: true,
        filterFn: createArrayIdFilter('classId'),
        cell: info => {
            const mappings = info.getValue() as { classId: number; level: number }[];
            const labels = GetClassDisplay(mappings, info.row.original.baseLevel);
            return labels;
        },
        meta: {
            filterType: FilterType.MULTI_SELECT,
            options: CLASS_WITH_SPELLS_SELECT_LIST,
        },
    },
    {
        accessorKey: 'castingTime',
        header: 'Casting Time',
        enableResizing: true,
        size: 100,
    },
    {
        accessorKey: 'range',
        header: 'Range',
        enableResizing: true,
        size: 100,
    },
    {
        accessorKey: 'duration',
        header: 'Duration',
        enableResizing: true,
        size: 100,
    },
    {
        accessorKey: 'effect',
        header: 'Effect',
        enableResizing: true,
        size: 100,
    },
    {
        accessorKey: 'target',
        header: 'Target',
        enableResizing: true,
        size: 100,
    },
    {
        accessorKey: 'area',
        header: 'Area',
        enableResizing: true,
        size: 100,
    },
    {
        accessorKey: 'savingThrow',
        header: 'Saving Throw',
        enableResizing: true,
        size: 100,
    },
    {
        accessorKey: 'spellResistance',
        header: 'Spell Resistance',
        enableResizing: true,
        size: 100,
    }
];
