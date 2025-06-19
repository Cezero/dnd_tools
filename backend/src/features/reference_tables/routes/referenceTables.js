import express from 'express';
import { getReferenceTables, getReferenceTable, createReferenceTable, updateReferenceTable, deleteReferenceTable, resolveReferenceTables } from '../controllers/referenceTableController.js';
import { requireAdmin } from '../../../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', getReferenceTables);
router.get('/:identifier', getReferenceTable);
router.post('/resolve', resolveReferenceTables);
router.post('/', requireAdmin, createReferenceTable);
router.put('/:id', requireAdmin, updateReferenceTable);
router.delete('/:id', requireAdmin, deleteReferenceTable);

export default router; 