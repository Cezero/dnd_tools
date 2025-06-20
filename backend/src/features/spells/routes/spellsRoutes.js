import express from 'express';
import { getSpells, getSpellById, updateSpell } from '../controllers/spellsController.js';
import { requireAdmin } from '../../../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', getSpells);
router.get('/:id', getSpellById);
router.put('/:id', requireAdmin, updateSpell);

export default router;
