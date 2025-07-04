import React from 'react';

import { ColumnDefinition } from '@/components/generic-list';
import { RouteConfig, NavigationItem } from '@/types';
import { SPELL_COMPONENT_SELECT_LIST, SPELL_DESCRIPTOR_SELECT_LIST, SOURCE_BOOK_WITH_SPELLS_SELECT_LIST, CLASS_WITH_SPELLS_SELECT_LIST, SPELL_SCHOOL_SELECT_LIST } from '@shared/static-data';

import { SpellDetail } from './SpellDetail';
import { SpellEdit } from './SpellEdit';
import { SpellList } from './SpellList';

export const routes: RouteConfig[] = [
    { path: 'spells', component: SpellList, exact: true, requireAuth: true },
    { path: 'spells/:id', component: SpellDetail, exact: true, requireAuth: true },
    { path: 'spells/:id/edit', component: SpellEdit, exact: true, requireAuth: true },
];

export const navigation: NavigationItem = {
    label: "Spells",
    path: "/spells",
};

export const COLUMN_DEFINITIONS: Record<string, ColumnDefinition> = {
    name: {
        label: 'Name',
        sortable: true,
        isDefault: true,
        isRequired: true,
        filterConfig: {
            type: 'text-input',
            props: {
                placeholder: 'Filter by name...',
            }
        }
    },
    spellLevel: {
        label: 'Level',
        sortable: true,
        paramName: 'spellLevel',
        isDefault: true,
        filterConfig: {
            type: 'single-select',
            props: {
                options: [...Array(10).keys()].map(level => ({ value: level, label: level.toString() })),
                className: 'w-32',
            }
        }
    },
    summary: {
        label: 'Summary',
        sortable: false,
    },
    schoolId: {
        label: 'School',
        sortable: true,
        filterConfig: {
            type: 'multi-select',
            props: {
                options: SPELL_SCHOOL_SELECT_LIST,
                className: 'w-48'
            }
        }
    },
    subSchoolId: {
        label: 'Sub-School',
        sortable: true,
    },
    descriptorId: {
        label: 'Descriptors',
        filterConfig: {
            type: 'multi-select',
            props: {
                options: SPELL_DESCRIPTOR_SELECT_LIST,
                className: 'w-48'
            }
        }
    },
    castingTime: {
        label: 'Casting Time',
    },
    range: {
        label: 'Range',
    },
    duration: {
        label: 'Duration',
    },
    componentId: {
        label: 'Components',
        filterConfig: {
            type: 'multi-select',
            props: {
                options: SPELL_COMPONENT_SELECT_LIST,
                className: 'w-48'
            }
        }
    },
    sourceId: {
        label: 'Sources',
        filterConfig: {
            type: 'multi-select',
            props: {
                options: SOURCE_BOOK_WITH_SPELLS_SELECT_LIST,
                className: 'w-52'
            }
        }
    },
    classId: {
        label: 'Classes',
        paramName: 'classId',
        isDefault: true,
        filterConfig: {
            type: 'multi-select',
            props: {
                options: CLASS_WITH_SPELLS_SELECT_LIST,
                className: 'w-52'
            }
        }
    },
    effect: {
        label: 'Effect',
    },
    target: {
        label: 'Target',
    },
    area: {
        label: 'Area',
    },
    savingThrow: {
        label: 'Saving Throw',
    },
    spellResistance: {
        label: 'Spell Resistance',
    }
}; 