import ClassList from '@/features/admin/features/classMgmt/components/classList';
import ClassDetail from '@/features/admin/features/classMgmt/components/classDetail';
import ClassEdit from '@/features/admin/features/classMgmt/components/classEdit';
import Input from '@/components/GenericList/Input';
import MultiSelect from '@/components/GenericList/MultiSelect';
import BooleanInput from '@/components/GenericList/BooleanInput';
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
        filterable: true,
        filterType: 'input'
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
    display: {
        label: 'Display',
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
        filterType: 'input'
    }
};

export const classFilterOptions = (lookupsInitialized) => ({
    class_name: { component: Input, props: { type: 'text', placeholder: 'Filter by name...' } },
    class_abbr: { component: Input, props: { type: 'text', placeholder: 'Filter by abbreviation...' } },
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
        component: MultiSelect,
        props: {
            options: Object.values(RPG_DICE),
            displayKey: 'name',
            valueKey: 'value',
            className: 'w-32'
        }
    },
});

export const DEFAULT_COLUMNS = ['class_name', 'class_abbr', 'edition_id', 'is_prestige_class', 'display', 'caster', 'hit_die'];