import { RouteConfig } from '@/types';

import { FeatureDetail } from './FeatureDetail';
import { FeatureEdit } from './FeatureEdit';

export const routes: RouteConfig[] = [
    { path: 'features/:slug', component: FeatureDetail, exact: true, requireAuth: true, requireAdmin: true, routeType: 'detail' },
    { path: 'features/:slug/edit', component: FeatureEdit, exact: true, requireAuth: true, requireAdmin: true, routeType: 'edit' },
]; 
