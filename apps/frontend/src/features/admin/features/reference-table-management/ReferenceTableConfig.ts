import { ColumnDefinition } from '@/components/generic-list';
import { ReferenceTableEditor } from '@/features/admin/features/reference-table-management/ReferenceTableEditor';
import { ReferenceTablesList } from '@/features/admin/features/reference-table-management/ReferenceTablesList';
import { ReferenceTableViewer } from '@/features/admin/features/reference-table-management/ReferenceTableViewer';
import { RouteConfig } from '@/types';

export const routes: RouteConfig[] = [
    { path: 'referencetables', component: ReferenceTablesList, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'referencetables/:identifier', component: ReferenceTableViewer, exact: true, requireAuth: true, requireAdmin: true },
    { path: 'referencetables/:identifier/edit', component: ReferenceTableEditor, exact: true, requireAuth: true, requireAdmin: true },
];

export const COLUMN_DEFINITIONS: Record<string, ColumnDefinition> = {
    name: {
        label: 'Name',
        sortable: true,
        isRequired: true,
        isDefault: true,
        filterConfig: {
            type: 'text-input',
            props: { placeholder: 'Filter by name...' }
        }
    },
    slug: {
        label: 'Slug',
        sortable: true,
        isRequired: true,
        isDefault: true,
        filterConfig: {
            type: 'text-input',
            props: { placeholder: 'Filter by slug...' }
        }
    },
    description: {
        label: 'Description',
        isDefault: true,
    },
    rows: {
        label: 'Rows',
        sortable: true,
        isDefault: true,
    },
    columns: {
        label: 'Columns',
        sortable: true,
        isDefault: true,
    }
};
