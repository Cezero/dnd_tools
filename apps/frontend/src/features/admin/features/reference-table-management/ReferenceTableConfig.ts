import { ReferenceTableEditor } from '@/features/admin/features/reference-table-management/ReferenceTableEditor';
import { ReferenceTablesList } from '@/features/admin/features/reference-table-management/ReferenceTablesList';
import { ReferenceTableViewer } from '@/features/admin/features/reference-table-management/ReferenceTableViewer';
import { RouteConfig } from '@/types';

export const routes: RouteConfig[] = [
    { path: 'referencetables', component: ReferenceTablesList, exact: true, requireAuth: true, requireAdmin: true, routeType: 'list' },
    { path: 'referencetables/:slug', component: ReferenceTableViewer, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'referencetables/:slug/edit', component: ReferenceTableEditor, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
];
