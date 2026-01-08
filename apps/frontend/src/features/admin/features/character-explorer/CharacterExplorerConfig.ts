import { RouteConfig } from '@/types';

import { CharacterExplorerList } from './CharacterExplorerList';
import { CharacterExplorerDetail } from './CharacterExplorerDetail';

export const routes: RouteConfig[] = [
    {
        path: 'characters',
        component: CharacterExplorerList,
        requireAuth: true,
        requireAdmin: true,
        exact: true,
    },
    {
        path: 'characters/:id',
        component: CharacterExplorerDetail,
        requireAuth: true,
        requireAdmin: true,
    },
];

