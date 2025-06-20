import express from 'express';
import { getAllCharacters, getCharacterById, createCharacter, updateCharacter, deleteCharacter } from '../controllers/charactersController.js';

const router = express.Router();

router.get('/', getAllCharacters);
router.get('/:id', getCharacterById);
router.post('/', createCharacter);
router.put('/:id', updateCharacter);
router.delete('/:id', deleteCharacter);

export default router; 