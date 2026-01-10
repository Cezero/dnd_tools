import { RouteConfig } from '@/types';

import { CharacterExplorerDetail } from './CharacterExplorerDetail';
import { CharacterExplorerList } from './CharacterExplorerList';

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

