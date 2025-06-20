import ReferenceTableList from '@/features/admin/features/ReferenceTableMgmt/components/ReferenceTablesList';
import ReferenceTableDetail from '@/features/admin/features/ReferenceTableMgmt/components/ReferenceTableViewer';
import ReferenceTableEdit from '@/features/admin/features/ReferenceTableMgmt/components/ReferenceTableEditor';

export const routes = [
    { path: 'referencetables', component: ReferenceTableList, exact: true },
    { path: 'referencetables/:id', component: ReferenceTableDetail, exact: true },
    { path: 'referencetables/:id/edit', component: ReferenceTableEdit, exact: true },
];

export const navigation = null;

export const DEFAULT_COLUMNS = ['name', 'slug', 'description', 'row_count', 'column_count'];

export const COLUMN_DEFINITIONS = {
    name: {
        label: 'Name',
        sortable: true,
        filterable: true,
        filterType: 'input'
    },
    slug: {
        label: 'Slug',
        sortable: true,
        filterable: true,
        filterType: 'input'
    },
    description: {
        label: 'Description',
        sortable: true,
        filterable: false,
    },
    row_count: {
        label: 'Rows',
        sortable: true,
        filterable: false,
    },
    column_count: {
        label: 'Columns',
        sortable: true,
        filterable: false,
    }
};