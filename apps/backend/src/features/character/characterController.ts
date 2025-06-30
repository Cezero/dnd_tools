import { Response } from 'express';

import { characterService } from './characterService';
import type { AllCharacterGetRequest, CharacterCreateRequest, CharacterUpdateRequest, CharacterDeleteRequest, CharacterGetRequest } from './types';

export async function GetAllCharacters(req: AllCharacterGetRequest, res: Response): Promise<void> {
    try {
        const result = await characterService.getAllCharacters(req.query);
        res.json(result);
    } catch (error) {
        console.error('Error getting all characters:', error);
        res.status(500).send('Server error');
    }
}

export async function GetCharacterById(req: CharacterGetRequest, res: Response): Promise<void> {
    const { id } = req.params;
    try {
        const character = await characterService.getCharacterById(parseInt(id));

        if (!character) {
            res.status(404).send('Character not found');
            return;
        }

        res.json(character);
    } catch (error) {
        console.error('Error getting character by ID:', error);
        res.status(500).send('Server error');
    }
}

export async function CreateCharacter(req: CharacterCreateRequest, res: Response): Promise<void> {
    const newCharacter = req.body;

    const validationError = characterService.validateCharacterData(newCharacter);
    if (validationError) {
        res.status(400).json({ error: validationError });
        return;
    }

    try {
        const result = await characterService.createCharacter(newCharacter);
        res.status(201).json(result);
    } catch (error) {
        console.error('Error creating character:', error);
        res.status(500).send('Server error');
    }
}

export async function UpdateCharacter(req: CharacterUpdateRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const updatedCharacter = req.body;

    const validationError = characterService.validateCharacterData(updatedCharacter);
    if (validationError) {
        res.status(400).json({ error: validationError });
        return;
    }

    try {
        const result = await characterService.updateCharacter(parseInt(id), updatedCharacter);
        res.json(result);
    } catch (error) {
        console.error('Error updating character:', error);
        res.status(500).send('Server error');
    }
}

export async function DeleteCharacter(req: CharacterDeleteRequest, res: Response): Promise<void> {
    const { id } = req.params;
    try {
        const result = await characterService.deleteCharacter(parseInt(id));
        res.json(result);
    } catch (error) {
        console.error('Error deleting character:', error);
        res.status(500).send('Server error');
    }
}

export async function Resolve(characterNames: string[]) {
    return await characterService.resolve(characterNames);
} 