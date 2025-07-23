import { Response } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types'
import {
    CharacterIdParamRequest,
    CreateCharacterRequest,
    UpdateCharacterRequest,
    CharacterResponse,
    GetAllCharactersResponse
} from '@shared/schema';

import { characterService } from './characterService';


export async function GetAllCharacters(req: ValidatedNoInput<GetAllCharactersResponse>, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const result = await characterService.getAllCharacters(userId);
    res.json(result);
}

export async function GetCharacterById(req: ValidatedParamsT<CharacterIdParamRequest, CharacterResponse>, res: Response) {
    const character = await characterService.getCharacterById(req.params);

    if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
    }

    res.json(character);
}

export async function CreateCharacter(req: ValidatedBodyT<CreateCharacterRequest>, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    // Add the user ID to the character data
    const characterData = { ...req.body, userId };
    await characterService.createCharacter(characterData);
    res.status(201).json({ message: 'Character created successfully' });
}

export async function UpdateCharacter(req: ValidatedParamsBodyT<CharacterIdParamRequest, UpdateCharacterRequest>, res: Response) {
    await characterService.updateCharacter(req.params, req.body);
    res.json({ message: 'Character updated successfully' });
}

export async function DeleteCharacter(req: ValidatedParamsT<CharacterIdParamRequest>, res: Response) {
    await characterService.deleteCharacter(req.params);
    res.json({ message: 'Character deleted successfully' });
}
