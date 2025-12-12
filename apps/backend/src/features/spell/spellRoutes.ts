import { buildValidatedRouter } from '@/lib/buildValidatedRouter';
import { requireAdmin } from '@/middleware/authMiddleware';
import {
    SpellIdParamSchema,
    SpellClassParamSchema,
    UpdateSpellSchema
} from '@shared/schema';

import { GetSpellById, UpdateSpell, DeleteSpell, GetAllSpells, GetSpellsForClass, GetSpellCache } from './spellController';

const { router: SpellRouter, get, put, delete: deleteRoute } = buildValidatedRouter();


get('/', {}, GetAllSpells);
get('/cache', {}, GetSpellCache);
get('/class/:classId', { params: SpellClassParamSchema }, GetSpellsForClass);
get('/:id', { params: SpellIdParamSchema }, GetSpellById);
put('/:id', requireAdmin, { params: SpellIdParamSchema, body: UpdateSpellSchema }, UpdateSpell);
deleteRoute('/:id', requireAdmin, { params: SpellIdParamSchema }, DeleteSpell);

export { SpellRouter };
