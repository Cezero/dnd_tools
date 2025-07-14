import { Response } from 'express';

import { ValidatedQueryT, ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types'
import {
    CharacterQueryRequest,
    CharacterIdParamRequest,
    CreateCharacterRequest,
    UpdateCharacterRequest,
    CharacterResponse,
    CharacterQueryResponse,
    GetAllCharactersResponse
} from '@shared/schema';

import { characterService } from './characterService';


export async function GetAllCharacters(req: ValidatedNoInput<GetAllCharactersResponse>, res: Response) {
    const result = await characterService.getAllCharacters();
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
    await characterService.createCharacter(req.body);
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
