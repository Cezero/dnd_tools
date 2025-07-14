import { RouteConfig } from '@/types';

import { ItemDetail } from './ItemDetail';
import { ItemEdit } from './ItemEdit';
import { ItemList } from './ItemList';

export const routes: RouteConfig[] = [
    { path: 'items', component: ItemList, exact: true, requireAuth: true, requireAdmin: true, routeType: 'list' },
    { path: 'items/:id', component: ItemDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'items/:id/edit', component: ItemEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
]; 
