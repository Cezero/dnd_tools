import express, { RequestHandler } from 'express';

import {
    SpellQuerySchema,
    SpellIdParamSchema,
    UpdateSpellSchema
} from '@shared/schema';

import { GetSpells, GetSpellById, UpdateSpell } from './spellController';
import { requireAdmin } from '../../middleware/authMiddleware';
import { validateRequest } from '../../middleware/validateRequest.js';

export const SpellRouter = express.Router();

SpellRouter.get('/', validateRequest({ query: SpellQuerySchema }) as RequestHandler, GetSpells as unknown as RequestHandler);
SpellRouter.get('/:id', validateRequest({ params: SpellIdParamSchema }) as RequestHandler, GetSpellById as unknown as RequestHandler);
SpellRouter.put('/:id', requireAdmin as unknown as RequestHandler, validateRequest({ params: SpellIdParamSchema, body: UpdateSpellSchema }) as RequestHandler, UpdateSpell as unknown as RequestHandler); 