import { buildValidatedRouter } from '@/lib/buildValidatedRouter';
import { requireAdmin } from '@/middleware/authMiddleware';
import {
    SpellQuerySchema,
    SpellIdParamSchema,
    UpdateSpellSchema
} from '@shared/schema';

import { GetSpells, GetSpellById, UpdateSpell, DeleteSpell } from './spellController';

const { router: SpellRouter, get, put, delete: deleteRoute } = buildValidatedRouter();


get('/', { query: SpellQuerySchema }, GetSpells);
get('/:id', { params: SpellIdParamSchema }, GetSpellById);
put('/:id', requireAdmin, { params: SpellIdParamSchema, body: UpdateSpellSchema }, UpdateSpell);
deleteRoute('/:id', requireAdmin, { params: SpellIdParamSchema }, DeleteSpell);

export { SpellRouter };
