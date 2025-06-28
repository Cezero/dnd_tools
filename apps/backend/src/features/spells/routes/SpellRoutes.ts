import express, { RequestHandler } from 'express';
import { GetSpells, GetSpellById, UpdateSpell } from '../controllers/SpellController';
import { RequireAdmin } from '../../../middleware/RequireAdmin';

export const SpellRouter = express.Router();

SpellRouter.get('/', GetSpells as unknown as RequestHandler);
SpellRouter.get('/:id', GetSpellById as unknown as RequestHandler);
SpellRouter.put('/:id', RequireAdmin as unknown as RequestHandler, UpdateSpell as unknown as RequestHandler); 