import { buildValidatedRouter } from '@/lib/buildValidatedRouter';
import { requireAdmin } from '@/middleware/authMiddleware';
import {
    SpellQuerySchema,
    SpellIdParamSchema,
    UpdateSpellSchema
} from '@shared/schema';

import { GetSpells, GetSpellById, UpdateSpell, DeleteSpell, GetAllSpells } from './spellController';

const { router: SpellRouter, get, put, delete: deleteRoute, post } = buildValidatedRouter();


get('/', {}, GetAllSpells);
post('/', { body: SpellQuerySchema }, GetSpells);
get('/:id', { params: SpellIdParamSchema }, GetSpellById);
put('/:id', requireAdmin, { params: SpellIdParamSchema, body: UpdateSpellSchema }, UpdateSpell);
deleteRoute('/:id', requireAdmin, { params: SpellIdParamSchema }, DeleteSpell);

export { SpellRouter };
