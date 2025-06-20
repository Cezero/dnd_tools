import RaceList from '@/features/admin/features/raceMgmt/components/raceList';
import RaceDetail from '@/features/admin/features/raceMgmt/components/raceDetail';
import RaceEdit from '@/features/admin/features/raceMgmt/components/raceEdit';

export const routes = [
    { path: 'races', component: RaceList, exact: true },
    { path: 'races/:id', component: RaceDetail, exact: true },
    { path: 'races/:id/edit', component: RaceEdit, exact: true },
];
export const COLUMN_DEFINITIONS = {
    race_name: {
        label: 'Race Name',
        type: 'text',
        sortable: true,
        filterable: true,
        filterType: 'input',
        paramName: 'name'
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
        filterType: 'boolean',
        paramName: 'display'
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
        filterType: 'select',
        paramName: 'sizeId'
    },
    race_speed: {
        label: 'Speed',
        type: 'number',
        sortable: true,
        filterable: true,
        filterType: 'input',
        paramName: 'speed'
    },
    favored_class_id: {
        label: 'Favored Class',
        type: 'select',
        sortable: true,
        filterable: true,
        filterType: 'select',
        paramName: 'favoredClassId'
    }
};

export const DEFAULT_COLUMNS = ['race_name', 'edition_id', 'display', 'size_id', 'race_speed', 'favored_class_id'];

