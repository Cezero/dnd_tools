import { ColumnDef } from '@tanstack/react-table';

import { EntityLink } from '@/components/entity-link';
import { createArrayIdFilter, createEqualsFilter, createContainsFilter } from '@/components/generic-list/filterFunctions';
import { formatSpellSchool, formatSpellComponents, formatSpellDescriptors } from '@/lib/formatters';
import { useCacheFunctions, getSourceDisplay, getSourceBooksByType } from '@/services/cache';
import { Spell } from '@shared/schema/spell';
import {
    SPELL_SCHOOL_LIST,
    SPELL_DESCRIPTOR_LIST,
    SPELL_COMPONENT_LIST,
    FilterType,
    SourceType,
    EditionId,
    EDITION_LIST,
    EDITION_MAP
} from '@shared/static-data';

import { AsyncClassDisplay } from './AsyncClassDisplay';

export const useSpellColumns = (): ColumnDef<Spell, unknown>[] => {
    const { getClassSelectByEdition, getClassSummaryById: _getClassSummaryById } = useCacheFunctions();
    return [
        {
            accessorKey: 'name',
            header: 'Name',
            enableSorting: true,
            enableColumnFilter: true,
            enableResizing: true,
            size: 100,
            filterFn: createContainsFilter<Spell>(),
            cell: info => {
                const spell = info.row.original;
                const spellName = String(info.getValue());
                return (
                    <EntityLink
                        entityType="spell"
                        entityId={spell.id}
                        href={`/spells/${spell.id}`}
                    >
                        {spellName}
                    </EntityLink>
                );
            },
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
            filterFn: createArrayIdFilter<Spell>('editionId'),
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
            accessorKey: 'baseLevel',
            header: 'Level',
            enableSorting: true,
            enableResizing: true,
            enableColumnFilter: true,
            size: 40,
            filterFn: createEqualsFilter<Spell>(),
            meta: {
                filterType: FilterType.SINGLE_SELECT,
                options: [...Array(10).keys()].map(level => ({
                    id: level,
                    name: level.toString()
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
            filterFn: createArrayIdFilter<Spell>('schoolId'),
            cell: info => {
                const spell = info.row.original;
                return formatSpellSchool(spell, { useAbbreviation: true, includeBrackets: true });
            },
            meta: {
                filterType: FilterType.MULTI_SELECT,
                options: SPELL_SCHOOL_LIST,
            },
        },
        {
            accessorKey: 'descriptorIds',
            header: 'Descriptors',
            enableColumnFilter: true,
            enableResizing: true,
            filterFn: createArrayIdFilter<Spell>('descriptorId'),
            cell: info => {
                const spell = info.row.original;
                return formatSpellDescriptors(spell);
            },
            meta: {
                filterType: FilterType.MULTI_SELECT,
                options: SPELL_DESCRIPTOR_LIST,
            },
        },
        {
            accessorKey: 'componentIds',
            header: 'Components',
            enableColumnFilter: true,
            enableResizing: true,
            size: 100,
            filterFn: createArrayIdFilter<Spell>('componentId'),
            cell: info => {
                const spell = info.row.original;
                return formatSpellComponents(spell);
            },
            meta: {
                filterType: FilterType.MULTI_SELECT,
                options: SPELL_COMPONENT_LIST,
            },
        },
        {
            accessorKey: 'sourceBookInfo',
            header: 'Sources',
            enableColumnFilter: true,
            enableResizing: true,
            size: 100,
            filterFn: createArrayIdFilter<Spell>('sourceBookId'),
            cell: info => {
                const sources = info.getValue() as { sourceBookId: number, pageNumber: number }[];
                const labels = getSourceDisplay(sources, true);
                return labels;
            },
            meta: {
                filterType: FilterType.MULTI_SELECT,
                options: (currentFilters: Array<{ id: string; value: unknown }>) => {
                    const editionFilter = currentFilters.find(f => f.id === 'editionId');
                    const editionId = editionFilter?.value as EditionId;
                    return getSourceBooksByType(SourceType.Spells, editionId);
                },
            },
        },
        {
            accessorKey: 'levelMapping',
            header: 'Classes',
            enableColumnFilter: true,
            enableResizing: true,
            filterFn: createArrayIdFilter<Spell>('classId'),
            cell: info => {
                const mappings = info.getValue() as { classId: number; level: number }[];
                return <AsyncClassDisplay mappings={mappings} baseLevel={info.row.original.baseLevel} />;
            },
            meta: {
                filterType: FilterType.MULTI_SELECT,
                options: async (currentFilters: Array<{ id: string; value: unknown }>) => {
                    const editionFilter = currentFilters.find(f => f.id === 'editionId');
                    const editionId = editionFilter?.value as EditionId || EditionId.DND_3x;

                    const classes = getClassSelectByEdition(editionId);
                    return classes;
                },
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
};
