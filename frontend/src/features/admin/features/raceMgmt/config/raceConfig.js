import RaceList from '@/features/admin/features/raceMgmt/components/raceList';
import RaceDetail from '@/features/admin/features/raceMgmt/components/raceDetail';
import RaceEdit from '@/features/admin/features/raceMgmt/components/raceEdit';

export const routes = [
    { path: 'races', component: RaceList, exact: true },
    { path: 'races/:id', component: RaceDetail, exact: true },
    { path: 'races/:id/edit', component: RaceEdit, exact: true },
];
export const COLUMN_DEFINITIONS = {
    name: { label: 'Race Name', type: 'text', sortable: true, filterable: true, filterType: 'input', paramName: 'name' },
    abbr: { label: 'Abbreviation', type: 'text', sortable: true, filterable: false },
    edition_id: { label: 'Edition', type: 'text', sortable: true, filterable: true, filterType: 'multi-select' },
    display: { label: 'Display', type: 'boolean', sortable: true, filterable: true, filterType: 'boolean' },
};

export const DEFAULT_COLUMNS = ['name', 'abbr', 'edition_id', 'display'];

