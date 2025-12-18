import { Response, NextFunction } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types'
import {
    CharacterIdParamRequest,
    AdvancementIdParamRequest,
    CharacterIdParam2Request,
    SpellPreparationParamRequest,
    AbilityIdParamRequest,
    CreateCharacterRequest,
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
    UpsertCharacterAbilityScoresRequest,
    SaveCharacterRequest,
    // NEW: Character disallowed source types
    CreateCharacterDisallowedSourceRequest,
    CharacterDisallowedSource,
    // NEW: Character attack definition types
    CreateCharacterAttackDefinitionRequest,
    UpdateCharacterAttackDefinitionRequest,
    CharacterAttackDefinition,
} from '@shared/schema';

import { characterService } from './characterService';

// Character methods
export async function GetAllCharacters(req: ValidatedNoInput<GetAllCharactersResponse>, res: Response, _next: NextFunction) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    const result = await characterService.getAllCharacters(userId);
    res.json(result);
}

export async function GetCharacterById(req: ValidatedParamsT<CharacterIdParamRequest, Character>, res: Response, _next: NextFunction) {
    const character = await characterService.getCharacterById(req.params);

    if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
    }

    res.json(character);
}

export async function GetCharacterWithAllDetails(req: ValidatedParamsT<CharacterIdParamRequest, CharacterWithAllDetailsResponse>, res: Response, _next: NextFunction) {
    const character = await characterService.getCharacterWithAllDetails(req.params);

    if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
    }

    res.json(character);
}

export async function CreateCharacter(req: ValidatedBodyT<CreateCharacterRequest>, res: Response, _next: NextFunction) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    // Add the user ID to the character data
    const characterData = { ...req.body, userId };
    const result = await characterService.createCharacter(characterData);
    res.status(201).json(result);
}

export async function SaveCharacter(req: ValidatedParamsBodyT<CharacterIdParamRequest | ValidatedNoInput, SaveCharacterRequest>, res: Response, _next: NextFunction) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    // Ensure userId is set in the request body
    const saveData: SaveCharacterRequest = {
        ...req.body,
        userId,
    };

    const characterId = (req.params as CharacterIdParamRequest)?.id ? parseInt((req.params as CharacterIdParamRequest).id, 10) : null;
    const result = await characterService.saveCharacter(characterId, saveData);
    
    if (characterId) {
        res.json(result);
    } else {
        res.status(201).json(result);
    }
}

export async function DeleteCharacter(req: ValidatedParamsT<CharacterIdParamRequest>, res: Response, _next: NextFunction) {
    await characterService.deleteCharacter(req.params);
    res.json({ message: 'Character deleted successfully' });
}

// Character advancement methods
export async function CreateAdvancement(req: ValidatedBodyT<CreateAdvancementRequest>, res: Response, _next: NextFunction) {
    const result = await characterService.createAdvancement(req.body);
    res.status(201).json(result);
}

export async function UpdateAdvancement(req: ValidatedParamsBodyT<AdvancementIdParamRequest, UpdateAdvancementRequest>, res: Response, _next: NextFunction) {
    await characterService.updateAdvancement(req.params.id, req.body);
    res.json({ message: 'Character advancement updated successfully' });
}

export async function DeleteAdvancement(req: ValidatedParamsT<AdvancementIdParamRequest>, res: Response, _next: NextFunction) {
    await characterService.deleteAdvancement(req.params.id);
    res.json({ message: 'Character advancement deleted successfully' });
}

export async function GetAdvancementById(req: ValidatedParamsT<AdvancementIdParamRequest, CharacterAdvancementWithDetailsResponse>, res: Response, _next: NextFunction) {
    const advancement = await characterService.getAdvancementById(req.params.id);

    if (!advancement) {
        res.status(404).json({ error: 'Character advancement not found' });
        return;
    }

    res.json(advancement);
}

export async function GetCharacterAdvancements(req: ValidatedParamsT<CharacterIdParam2Request, CharacterAdvancementWithDetailsResponse[]>, res: Response, _next: NextFunction) {
    const advancements = await characterService.getCharacterAdvancements(req.params.characterId);
    res.json(advancements);
}

// Spell preparation methods
export async function CreateSpellPreparation(req: ValidatedBodyT<CreateSpellPreparationRequest>, res: Response, _next: NextFunction) {
    const result = await characterService.createSpellPreparation(req.body);
    res.status(201).json(result);
}

export async function UpdateSpellPreparation(req: ValidatedParamsBodyT<SpellPreparationParamRequest, UpdateSpellPreparationRequest>, res: Response, _next: NextFunction) {
    await characterService.updateSpellPreparation(req.params.characterId, req.params.prepKey, req.body);
    res.json({ message: 'Spell preparation updated successfully' });
}

export async function DeleteSpellPreparation(req: ValidatedParamsT<SpellPreparationParamRequest>, res: Response, _next: NextFunction) {
    await characterService.deleteSpellPreparation(req.params.characterId, req.params.prepKey);
    res.json({ message: 'Spell preparation deleted successfully' });
}

export async function GetCharacterSpellPreparations(req: ValidatedParamsT<CharacterIdParam2Request, CharacterSpellPreparationWithMetamagicResponse[]>, res: Response, _next: NextFunction) {
    const preparations = await characterService.getCharacterSpellPreparations(req.params.characterId);
    res.json(preparations);
}

// Character ability score methods
export async function CreateCharacterAbilityScore(req: ValidatedBodyT<CreateCharacterAbilityScoreRequest>, res: Response, _next: NextFunction) {
    const result = await characterService.createCharacterAbilityScore(req.body);
    res.status(201).json(result);
}

export async function UpdateCharacterAbilityScore(req: ValidatedParamsBodyT<AbilityIdParamRequest, UpdateCharacterAbilityScoreRequest>, res: Response, _next: NextFunction) {
    await characterService.updateCharacterAbilityScore(req.params.id, req.body);
    res.json({ message: 'Character ability score updated successfully' });
}

export async function DeleteCharacterAbilityScore(req: ValidatedParamsT<AbilityIdParamRequest>, res: Response, _next: NextFunction) {
    await characterService.deleteCharacterAbilityScore(req.params.id);
    res.json({ message: 'Character ability score deleted successfully' });
}

export async function GetCharacterAbilityScores(req: ValidatedParamsT<CharacterIdParam2Request, CharacterAbilityScoreResponse[]>, res: Response, _next: NextFunction) {
    const abilities = await characterService.getCharacterAbilityScores(req.params.characterId);
    res.json(abilities);
}

export async function UpsertCharacterAbilityScores(req: ValidatedParamsBodyT<CharacterIdParam2Request, Omit<UpsertCharacterAbilityScoresRequest, 'characterId'>>, res: Response, _next: NextFunction) {
    await characterService.upsertCharacterAbilityScores({
        characterId: req.params.characterId,
        abilityScores: req.body.abilityScores,
    });
    res.json({ message: 'Character ability scores updated successfully' });
}

// NEW: Character disallowed sources methods
export async function AddDisallowedSource(req: ValidatedBodyT<CreateCharacterDisallowedSourceRequest>, res: Response, _next: NextFunction) {
    try {
        const disallowedSource = await characterService.addDisallowedSource(req.body);
        res.status(201).json(disallowedSource);
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export async function RemoveDisallowedSource(req: ValidatedParamsT<CharacterIdParam2Request>, res: Response, _next: NextFunction) {
    const { characterId } = req.params;
    const { sourceBookId } = req.body;

    await characterService.removeDisallowedSource(characterId, sourceBookId);
    res.json({ message: 'Disallowed source removed successfully' });
}

export async function GetDisallowedSources(req: ValidatedParamsT<CharacterIdParam2Request, CharacterDisallowedSource[]>, res: Response, _next: NextFunction) {
    const disallowedSources = await characterService.getDisallowedSources(req.params.characterId);
    res.json(disallowedSources);
}

// Character attack definition methods
export async function GetCharacterAttackDefinitions(req: ValidatedParamsT<CharacterIdParamRequest, CharacterAttackDefinition[]>, res: Response, _next: NextFunction) {
    try {
        const attackDefinitions = await characterService.getCharacterAttackDefinitions(req.params.id);
        res.json(attackDefinitions);
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export async function CreateCharacterAttackDefinition(req: ValidatedParamsBodyT<CharacterIdParamRequest, CreateCharacterAttackDefinitionRequest>, res: Response, _next: NextFunction) {
    try {
        const result = await characterService.createCharacterAttackDefinition(req.params.id, req.body);
        res.status(201).json(result);
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export async function UpdateCharacterAttackDefinition(req: ValidatedParamsBodyT<CharacterIdParamRequest & { attackId: string }, UpdateCharacterAttackDefinitionRequest>, res: Response, _next: NextFunction) {
    try {
        const attackId = parseInt(req.params.attackId, 10);
        if (isNaN(attackId)) {
            res.status(400).json({ error: 'Invalid attack definition ID' });
            return;
        }
        await characterService.updateCharacterAttackDefinition(req.params.id, attackId, req.body);
        res.json({ message: 'Attack definition updated successfully' });
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export async function DeleteCharacterAttackDefinition(req: ValidatedParamsT<CharacterIdParamRequest & { attackId: string }>, res: Response, _next: NextFunction) {
    try {
        const attackId = parseInt(req.params.attackId, 10);
        if (isNaN(attackId)) {
            res.status(400).json({ error: 'Invalid attack definition ID' });
            return;
        }
        await characterService.deleteCharacterAttackDefinition(req.params.id, attackId);
        res.json({ message: 'Attack definition deleted successfully' });
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export async function ReorderCharacterAttackDefinitions(req: ValidatedParamsBodyT<CharacterIdParamRequest, { attackDefinitionIds: number[] }>, res: Response, _next: NextFunction) {
    try {
        await characterService.reorderCharacterAttackDefinitions(req.params.id, req.body.attackDefinitionIds);
        res.json({ message: 'Attack definitions reordered successfully' });
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
