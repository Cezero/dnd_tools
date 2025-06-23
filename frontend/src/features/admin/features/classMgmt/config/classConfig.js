import ClassList from '@/features/admin/features/classMgmt/components/classList';
import ClassDetail from '@/features/admin/features/classMgmt/components/classDetail';
import ClassEdit from '@/features/admin/features/classMgmt/components/classEdit';
import Input from '@/components/GenericList/Input';
import MultiSelect from '@/components/GenericList/MultiSelect';
import BooleanInput from '@/components/GenericList/BooleanInput';
import SingleSelect from '@/components/GenericList/SingleSelect';
import LookupService from '@/services/LookupService';
import { RPG_DICE } from 'shared-data/src/commonData';

export const routes = [
    { path: 'classes', component: ClassList, exact: true },
    { path: 'classes/:id', component: ClassDetail, exact: true },
    { path: 'classes/:id/edit', component: ClassEdit, exact: true },
];

export const COLUMN_DEFINITIONS = {
    class_name: {
        label: 'Class Name',
        type: 'text',
        sortable: true,
        filterable: true,
        filterType: 'input'
    },
    class_abbr: {
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
    is_prestige_class: {
        label: 'Prestige Class',
        type: 'boolean',
        sortable: true,
        filterable: true,
        filterType: 'boolean'
    },
    caster: {
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

export const classFilterOptions = (lookupsInitialized) => ({
    class_name: { component: Input, props: { type: 'text', placeholder: 'Filter by name...' } },
    edition_id: {
        component: MultiSelect,
        props: {
            options: lookupsInitialized ? LookupService.getAll('editions') : [],
            displayKey: 'edition_abbrev',
            valueKey: 'edition_id',
            className: 'w-32'
        }
    },
    is_prestige_class: { component: BooleanInput },
    display: { component: BooleanInput },
    caster: { component: BooleanInput },
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
            options: lookupsInitialized ? LookupService.getAll('sources').sort((a, b) => {
                if (a.sort_order !== 999 && b.sort_order !== 999) {
                    return a.sort_order - b.sort_order;
                } else if (a.sort_order !== 999) {
                    return -1;
                } else if (b.sort_order !== 999) {
                    return 1;
                } else {
                    return a.book_id - b.book_id;
                }
            }) : [],
            displayKey: 'title',
            valueKey: 'book_id',
            placeholder: 'Select Sources',
            className: 'w-52'
        }
    },
});

export const DEFAULT_COLUMNS = ['class_name', 'class_abbr', 'edition_id', 'is_prestige_class', 'source', 'caster', 'hit_die'];