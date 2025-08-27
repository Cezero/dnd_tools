import { Response } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types'
import {
    CharacterIdParamRequest,
    CreateCharacterRequest,
    UpdateCharacterRequest,
    Character,
    GetAllCharactersResponse,
    CharacterWithAllDetailsResponse,
    // New types for advancement and spell preparation
    CreateAdvancementRequest,
    UpdateAdvancementRequest,
    CharacterAdvancementWithDetailsResponse,
    CreateSpellPreparationRequest,
    UpdateSpellPreparationRequest,
    CharacterSpellPreparationWithMetamagicResponse,
    CreateCharacterAbilityScoreRequest,
    UpdateCharacterAbilityScoreRequest,
    CharacterAbilityScoreResponse,
} from '@shared/schema';

import { characterService } from './characterService';

// Character methods
export async function GetAllCharacters(req: ValidatedNoInput<GetAllCharactersResponse>, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const result = await characterService.getAllCharacters(userId);
    res.json(result);
}

export async function GetCharacterById(req: ValidatedParamsT<CharacterIdParamRequest, Character>, res: Response) {
    const character = await characterService.getCharacterById(req.params);

    if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
    }

    res.json(character);
}

export async function GetCharacterWithAllDetails(req: ValidatedParamsT<CharacterIdParamRequest, CharacterWithAllDetailsResponse>, res: Response) {
    const character = await characterService.getCharacterWithAllDetails(req.params);

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

// Character advancement methods
export async function CreateAdvancement(req: ValidatedBodyT<CreateAdvancementRequest>, res: Response) {
    const result = await characterService.createAdvancement(req.body);
    res.status(201).json(result);
}

export async function UpdateAdvancement(req: ValidatedParamsBodyT<{ id: string }, UpdateAdvancementRequest>, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid advancement ID' });
        return;
    }

    await characterService.updateAdvancement(id, req.body);
    res.json({ message: 'Character advancement updated successfully' });
}

export async function DeleteAdvancement(req: ValidatedParamsT<{ id: string }>, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid advancement ID' });
        return;
    }

    await characterService.deleteAdvancement(id);
    res.json({ message: 'Character advancement deleted successfully' });
}

export async function GetAdvancementById(req: ValidatedParamsT<{ id: string }, CharacterAdvancementWithDetailsResponse>, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid advancement ID' });
        return;
    }

    const advancement = await characterService.getAdvancementById(id);

    if (!advancement) {
        res.status(404).json({ error: 'Character advancement not found' });
        return;
    }

    res.json(advancement);
}

export async function GetCharacterAdvancements(req: ValidatedParamsT<{ characterId: string }, CharacterAdvancementWithDetailsResponse[]>, res: Response) {
    const characterId = parseInt(req.params.characterId);
    if (isNaN(characterId)) {
        res.status(400).json({ error: 'Invalid character ID' });
        return;
    }

    const advancements = await characterService.getCharacterAdvancements(characterId);
    res.json(advancements);
}

// Spell preparation methods
export async function CreateSpellPreparation(req: ValidatedBodyT<CreateSpellPreparationRequest>, res: Response) {
    const result = await characterService.createSpellPreparation(req.body);
    res.status(201).json(result);
}

export async function UpdateSpellPreparation(req: ValidatedParamsBodyT<{ characterId: string; prepKey: string }, UpdateSpellPreparationRequest>, res: Response) {
    const characterId = parseInt(req.params.characterId);
    if (isNaN(characterId)) {
        res.status(400).json({ error: 'Invalid character ID' });
        return;
    }

    await characterService.updateSpellPreparation(characterId, req.params.prepKey, req.body);
    res.json({ message: 'Spell preparation updated successfully' });
}

export async function DeleteSpellPreparation(req: ValidatedParamsT<{ characterId: string; prepKey: string }>, res: Response) {
    const characterId = parseInt(req.params.characterId);
    if (isNaN(characterId)) {
        res.status(400).json({ error: 'Invalid character ID' });
        return;
    }

    await characterService.deleteSpellPreparation(characterId, req.params.prepKey);
    res.json({ message: 'Spell preparation deleted successfully' });
}

export async function GetCharacterSpellPreparations(req: ValidatedParamsT<{ characterId: string }, CharacterSpellPreparationWithMetamagicResponse[]>, res: Response) {
    const characterId = parseInt(req.params.characterId);
    if (isNaN(characterId)) {
        res.status(400).json({ error: 'Invalid character ID' });
        return;
    }

    const preparations = await characterService.getCharacterSpellPreparations(characterId);
    res.json(preparations);
}

// Character ability score methods
export async function CreateCharacterAbilityScore(req: ValidatedBodyT<CreateCharacterAbilityScoreRequest>, res: Response) {
    const result = await characterService.createCharacterAbilityScore(req.body);
    res.status(201).json(result);
}

export async function UpdateCharacterAbilityScore(req: ValidatedParamsBodyT<{ id: string }, UpdateCharacterAbilityScoreRequest>, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ability score ID' });
        return;
    }

    await characterService.updateCharacterAbilityScore(id, req.body);
    res.json({ message: 'Character ability score updated successfully' });
}

export async function DeleteCharacterAbilityScore(req: ValidatedParamsT<{ id: string }>, res: Response) {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid ability score ID' });
        return;
    }

    await characterService.deleteCharacterAbilityScore(id);
    res.json({ message: 'Character ability score deleted successfully' });
}

export async function GetCharacterAbilityScores(req: ValidatedParamsT<{ characterId: string }, CharacterAbilityScoreResponse[]>, res: Response) {
    const characterId = parseInt(req.params.characterId);
    if (isNaN(characterId)) {
        res.status(400).json({ error: 'Invalid character ID' });
        return;
    }

    const abilities = await characterService.getCharacterAbilityScores(characterId);
    res.json(abilities);
}
