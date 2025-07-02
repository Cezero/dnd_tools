import { Response } from 'express';

import { ValidatedQueryT, ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT } from '@/util/validated-types'
import {
    CharacterQueryRequest,
    CharacterIdParamRequest,
    CreateCharacterRequest,
    UpdateCharacterRequest,
    CharacterResponse,
    CharacterQueryResponse
} from '@shared/schema';

import { characterService } from './characterService';


export async function GetAllCharacters(req: ValidatedQueryT<CharacterQueryRequest, CharacterQueryResponse>, res: Response) {
    const result = await characterService.getCharacters(req.query);
    res.json(result);
}

export async function GetCharacterById(req: ValidatedParamsT<CharacterIdParamRequest, CharacterResponse>, res: Response) {
    const character = await characterService.getCharacterById(req.params);

    if (!character) {
        res.status(404).send('Character not found');
        return;
    }

    res.json(character);
}

export async function CreateCharacter(req: ValidatedBodyT<CreateCharacterRequest>, res: Response) {
    const newCharacter = req.body;

    const result = await characterService.createCharacter(newCharacter);
    res.status(201).json(result);
}

export async function UpdateCharacter(req: ValidatedParamsBodyT<CharacterIdParamRequest, UpdateCharacterRequest>, res: Response) {
    const result = await characterService.updateCharacter(req.params, req.body);
    res.json(result);
}

export async function DeleteCharacter(req: ValidatedParamsT<CharacterIdParamRequest>, res: Response) {
    const result = await characterService.deleteCharacter(req.params);
    res.json(result);
}
