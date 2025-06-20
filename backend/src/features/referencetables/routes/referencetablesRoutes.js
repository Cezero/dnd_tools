import express from 'express';
import { getReferenceTables, getReferenceTable, createReferenceTable, updateReferenceTable, deleteReferenceTable } from '../controllers/referencetablesController.js';
import { requireAdmin } from '../../../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', getReferenceTables);
router.get('/:identifier', getReferenceTable);
router.post('/', requireAdmin, createReferenceTable);
router.put('/:id', requireAdmin, updateReferenceTable);
router.delete('/:id', requireAdmin, deleteReferenceTable);

export default router; 