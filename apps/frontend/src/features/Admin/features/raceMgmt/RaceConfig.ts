import { RaceList } from '@/features/admin/features/raceMgmt/components/RaceList';
import { RaceDetail } from '@/features/admin/features/raceMgmt/components/RaceDetail';
import { RaceEdit } from '@/features/admin/features/raceMgmt/components/RaceEdit';
import { RaceTraitDetail } from '@/features/admin/features/raceMgmt/components/RaceTraitDetail';
import { RaceTraitEdit } from '@/features/admin/features/raceMgmt/components/RaceTraitEdit';
import { TextInput, MultiSelect, BooleanInput } from '@/components/GenericList';
import { EDITION_LIST } from '@shared/static-data';

export const routes = [
    { path: 'races', component: RaceList, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'races/:id', component: RaceDetail, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'races/:id/edit', component: RaceEdit, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'races/traits/:slug', component: RaceTraitDetail, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'races/traits/:slug/edit', component: RaceTraitEdit, exact: true, requireAuth: true, requireAdmin: true },
];
export const COLUMN_DEFINITIONS = {
    name: {
        label: 'Name',
        type: 'text',
        sortable: true,
        filterable: true,
        filterType: 'input'
    },
    edition_id: {
        label: 'Edition',
        type: 'text',
        sortable: true, filterable: true, filterType: 'multi-select'
    },
    display: {
        label: 'Display',
        type: 'boolean',
        sortable: true,
        filterable: true,
        filterType: 'boolean'
    },
    desc: {
        label: 'Description',
        type: 'text',
        sortable: false,
        filterable: false,
        textArea: true
    },
    size_id: {
        label: 'Size',
        type: 'select',
        sortable: true,
        filterable: true,
        filterType: 'select'
    },
    speed: {
        label: 'Speed',
        type: 'number',
        sortable: true,
        filterable: true,
        filterType: 'input'
    },
    favored_class_id: {
        label: 'Favored Class',
        type: 'select',
        sortable: true,
        filterable: true,
        filterType: 'select'
    }
};

export const RaceFilterOptions = (lookupsInitialized, classes, memoizedSizeMapOptions) => ({
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
    display: { component: BooleanInput },
    size_id: {
        component: MultiSelect,
        props: {
            options: lookupsInitialized ? memoizedSizeMapOptions : [],
            displayKey: 'name',
            valueKey: 'id',
            className: 'w-32'
        }
    },
    speed: { component: TextInput, props: { type: 'number', placeholder: 'Filter by speed...' } },
    favored_class_id: {
        component: MultiSelect,
        props: {
            options: lookupsInitialized ? classes : [],
            displayKey: 'class_name',
            valueKey: 'class_id',
            className: 'w-32'
        }
    }
});

export const DEFAULT_COLUMNS = ['name', 'edition_id', 'display', 'size_id', 'speed', 'favored_class_id'];

