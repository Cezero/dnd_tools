import RaceList from '@/features/admin/features/raceMgmt/components/raceList';
import RaceDetail from '@/features/admin/features/raceMgmt/components/raceDetail';
import RaceEdit from '@/features/admin/features/raceMgmt/components/raceEdit';
import RaceTraitDetail from '@/features/admin/features/raceMgmt/components/RaceTraitDetail';
import RaceTraitEdit from '@/features/admin/features/raceMgmt/components/RaceTraitEdit';
import Input from '@/components/GenericList/Input';
import MultiSelect from '@/components/GenericList/MultiSelect';
import BooleanInput from '@/components/GenericList/BooleanInput';
import LookupService from '@/services/LookupService';

export const routes = [
    { path: 'races', component: RaceList, exact: true },
    { path: 'races/:id', component: RaceDetail, exact: true },
    { path: 'races/:id/edit', component: RaceEdit, exact: true },
    { path: 'races/traits/:id', component: RaceTraitDetail, exact: true },
    { path: 'races/traits/:id/edit', component: RaceTraitEdit, exact: true },
];
export const COLUMN_DEFINITIONS = {
    race_name: {
        label: 'Race Name',
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
    race_description: {
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
    race_speed: {
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

export const raceFilterOptions = (lookupsInitialized, classes, memoizedSizeMapOptions) => ({
    race_name: { component: Input, props: { type: 'text', placeholder: 'Filter by name...' } },
    edition_id: {
        component: MultiSelect,
        props: {
            options: lookupsInitialized ? LookupService.getAll('editions') : [],
            displayKey: 'edition_abbrev',
            valueKey: 'edition_id',
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
    race_speed: { component: Input, props: { type: 'number', placeholder: 'Filter by speed...' } },
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

export const DEFAULT_COLUMNS = ['race_name', 'edition_id', 'display', 'size_id', 'race_speed', 'favored_class_id'];

