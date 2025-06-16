import express from 'express';
import { getReferenceTables, getReferenceTableById, createReferenceTable, updateReferenceTable, deleteReferenceTable } from '../controllers/referenceTableController.js';
import { requireAdmin } from '../../../middleware/requireAdmin.js';

const router = express.Router();

router.get('/', getReferenceTables);
router.get('/:id', getReferenceTableById);
router.post('/', requireAdmin, createReferenceTable);
router.put('/:id', requireAdmin, updateReferenceTable);
router.delete('/:id', requireAdmin, deleteReferenceTable);

export default router; 