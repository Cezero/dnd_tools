import { buildValidatedRouter } from '@/lib/buildValidatedRouter';
import { requireAdmin } from '@/middleware/authMiddleware';
import {
    MonsterIdParamSchema,
    GetAllMonstersQuerySchema,
    UpdateMonsterSchema,
} from '@shared/schema';

import {
    GetAllMonsters,
    GetMonsterById,
    UpdateMonster,
    DeleteMonster,
    GetMonsterCache,
} from './monsterController';

const { router: MonsterRouter, get, put, delete: deleteRoute } = buildValidatedRouter();

get('/', { query: GetAllMonstersQuerySchema }, GetAllMonsters);
get('/cache', {}, GetMonsterCache);
get('/:id', { params: MonsterIdParamSchema }, GetMonsterById);
put('/:id', requireAdmin, { params: MonsterIdParamSchema, body: UpdateMonsterSchema }, UpdateMonster);
deleteRoute('/:id', requireAdmin, { params: MonsterIdParamSchema }, DeleteMonster);

export { MonsterRouter };

