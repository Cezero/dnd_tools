import React from 'react';
import { TextInput, MultiSelect, SingleSelect } from '@/components/generic-list';
import { SPELL_DESCRIPTOR_LIST, SPELL_SCHOOL_LIST, SPELL_COMPONENT_LIST, SOURCE_BOOK_LIST, CLASS_LIST } from '@shared/static-data';
import { RouteConfig, NavigationItem } from '@/types';
import { z } from 'zod';

// Zod validation schemas
export const SpellFilterSchema = z.object({
    name: z.string().optional(),
    baseLevel: z.number().int().min(0).max(20).optional(),
    schoolId: z.number().int().positive().optional(),
    descriptorId: z.number().int().positive().optional(),
    componentId: z.number().int().positive().optional(),
    sourceId: z.number().int().positive().optional(),
    classId: z.number().int().positive().optional(),
});

export const SpellQuerySchema = z.object({
    page: z.string().optional().transform((val) => val ? parseInt(val) : 1),
    limit: z.string().optional().transform((val) => val ? parseInt(val) : 10),
    name: z.string().optional(),
    editionId: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
    baseLevel: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
    schoolId: z.string().optional().transform((val) => val ? parseInt(val) : undefined),
});

export type SpellFilterRequest = z.infer<typeof SpellFilterSchema>;
export type SpellQueryRequest = z.infer<typeof SpellQuerySchema>;

export const routes: RouteConfig[] = [
    { path: '/spells', component: React.lazy(() => import('./spellList').then(m => ({ default: m.SpellList }))), exact: true, requireAuth: true },
    { path: '/spells/:id', component: React.lazy(() => import('./spellDetail').then(m => ({ default: m.SpellDetail }))), exact: true, requireAuth: true },
    { path: '/spells/:id/edit', component: React.lazy(() => import('./spellEdit').then(m => ({ default: m.SpellEdit }))), exact: true, requireAuth: true },
];

export const navigation: NavigationItem = {
    label: "Spells",
    path: "/spells",
};

export const DEFAULT_COLUMNS: string[] = ['name', 'baseLevel', 'summary'];

interface ColumnDefinition {
    label: string;
    sortable: boolean;
    filterable: boolean;
    filterType?: 'input' | 'select' | 'multi-select';
    paramName?: string;
    dynamicFilter?: boolean;
}

interface FilterOption {
    component: React.ComponentType<unknown>;
    props: Record<string, unknown>;
}

export const COLUMN_DEFINITIONS: Record<string, ColumnDefinition> = {
    name: {
        label: 'Name',
        sortable: true,
        filterable: true,
        filterType: 'input',
        paramName: 'name',
        dynamicFilter: true
    },
    baseLevel: {
        label: 'Level',
        sortable: true,
        filterable: true,
        filterType: 'select'
    },
    summary: {
        label: 'Summary',
        sortable: false,
        filterable: false
    },
    school: {
        label: 'School',
        sortable: true,
        filterable: true,
        filterType: 'multi-select'
    },
    descriptors: {
        label: 'Descriptors',
        sortable: false,
        filterable: true,
        filterType: 'multi-select'
    },
    castingTime: {
        label: 'Casting Time',
        sortable: false,
        filterable: false
    },
    range: {
        label: 'Range',
        sortable: false,
        filterable: false
    },
    duration: {
        label: 'Duration',
        sortable: false,
        filterable: false
    },
    components: {
        label: 'Components',
        sortable: false,
        filterable: true,
        filterType: 'multi-select'
    },
    source: {
        label: 'Sources',
        sortable: false,
        filterable: true,
        filterType: 'multi-select'
    },
    class_id: {
        label: 'Classes',
        sortable: false,
        filterable: true,
        filterType: 'multi-select'
    },
    effect: {
        label: 'Effect',
        sortable: false,
        filterable: false
    },
    target: {
        label: 'Target',
        sortable: false,
        filterable: false
    },
    area: {
        label: 'Area',
        sortable: false,
        filterable: false
    },
    savingThrow: {
        label: 'Saving Throw',
        sortable: false,
        filterable: false
    },
    spellResistance: {
        label: 'Spell Resistance',
        sortable: false,
        filterable: false
    }
};

export const SpellFilterOptions: Record<string, FilterOption> = {
    name: {
        component: TextInput,
        props: {
            type: 'text',
            placeholder: 'Filter by name...',
        }
    },
    baseLevel: {
        component: SingleSelect,
        props: {
            options: [...Array(10).keys()].map(level => ({ id: level, name: level.toString() })),
            displayKey: 'name',
            valueKey: 'id',
            placeholder: 'All Levels',
            className: 'w-32',
        }
    },
    school: {
        component: MultiSelect,
        props: {
            options: SPELL_SCHOOL_LIST,
            displayKey: 'name',
            valueKey: 'id',
            placeholder: 'Select Schools',
            className: 'w-48'
        }
    },
    descriptors: {
        component: MultiSelect,
        props: {
            options: SPELL_DESCRIPTOR_LIST,
            displayKey: 'name',
            valueKey: 'id',
            placeholder: 'Select Descriptors',
            className: 'w-48'
        }
    },
    source: {
        component: MultiSelect,
        props: {
            options: SOURCE_BOOK_LIST.filter(source => source.hasSpells),
            displayKey: 'name',
            valueKey: 'id',
            placeholder: 'Select Sources',
            className: 'w-52'
        }
    },
    class_id: {
        component: MultiSelect,
        props: {
            options: CLASS_LIST.filter(dndClass => dndClass.canCastSpells && dndClass.isVisible),
            displayKey: 'name',
            valueKey: 'id',
            placeholder: 'Select Classes',
            className: 'w-52'
        }
    },
    components: {
        component: MultiSelect,
        props: {
            options: SPELL_COMPONENT_LIST,
            displayKey: 'name',
            valueKey: 'id',
            placeholder: 'Select Components',
            className: 'w-48'
        }
    },
};
