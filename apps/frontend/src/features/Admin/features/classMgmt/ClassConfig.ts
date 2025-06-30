import { ClassList } from '@/features/admin/features/classMgmt/ClassList';
import { ClassDetail } from '@/features/admin/features/classMgmt/ClassDetail';
import { ClassEdit } from '@/features/admin/features/classMgmt/ClassEdit';
import { TextInput, MultiSelect, BooleanInput, SingleSelect } from '@/components/GenericList';
import { RPG_DICE, EDITION_LIST, SOURCE_BOOK_LIST } from '@shared/static-data';

export const routes = [
    { path: 'classes', component: ClassList, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'classes/:id', component: ClassDetail, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'classes/:id/edit', component: ClassEdit, exact: true, requireAuth: true, requireAdmin: true },
];

export const COLUMN_DEFINITIONS = {
    name: {
        label: 'Name',
        type: 'text',
        sortable: true,
        filterable: true,
        filterType: 'input'
    },
    abbr: {
        label: 'Abbreviation',
        type: 'text',
        sortable: true,
        filterable: false
    },
    edition_id: {
        label: 'Edition',
        type: 'text',
        sortable: true,
        filterable: true,
        filterType: 'multi-select'
    },
    is_prestige: {
        label: 'Prestige Class',
        type: 'boolean',
        sortable: true,
        filterable: true,
        filterType: 'boolean'
    },
    can_cast: {
        label: 'Caster',
        type: 'boolean',
        sortable: true,
        filterable: true,
        filterType: 'boolean'
    },
    hit_die: {
        label: 'Hit Die',
        type: 'number',
        sortable: true,
        filterable: true,
        filterType: 'single-select'
    },
    display: {
        label: 'Display',
        type: 'boolean',
        sortable: true,
        filterable: true,
        filterType: 'boolean'
    },
    source: {
        label: 'Sources',
        sortable: false,
        filterable: true,
        filterType: 'multi-select'
    }
};

export const ClassFilterOptions = {
    name: { component: TextInput, props: { type: 'text', placeholder: 'Filter by name...' } },
    edition_id: {
        component: MultiSelect,
        props: {
            options: EDITION_LIST,
            displayKey: 'abbr',
            valueKey: 'id',
            className: 'w-32'
        }
    },
    is_prestige: { component: BooleanInput },
    display: { component: BooleanInput },
    can_cast: { component: BooleanInput },
    hit_die: {
        component: SingleSelect,
        props: {
            options: Object.values(RPG_DICE),
            displayKey: 'name',
            valueKey: 'id',
            className: 'w-32'
        }
    },
    source: {
        component: MultiSelect,
        props: {
            options: SOURCE_BOOK_LIST.sort((a, b) => {
                if (a.sort_order !== 999 && b.sort_order !== 999) {
                    return a.sort_order - b.sort_order;
                } else if (a.sort_order !== 999) {
                    return -1;
                } else if (b.sort_order !== 999) {
                    return 1;
                } else {
                    return a.book_id - b.book_id;
                }
            }),
            displayKey: 'title',
            valueKey: 'book_id',
            placeholder: 'Select Sources',
            className: 'w-52'
        }
    },
};

export const DEFAULT_COLUMNS = ['name', 'abbr', 'edition_id', 'is_prestige', 'source', 'can_cast', 'hit_die'];