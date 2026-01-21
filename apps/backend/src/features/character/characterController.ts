import { Response, NextFunction } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types'
import { PrismaClient } from '@shared/prisma-client';
import {
    CharacterIdParamRequest,
    AdvancementIdParamRequest,
    SpellPreparationParamRequest,
    AbilityIdParamRequest,
    CreateCharacterRequest,
    Character,
    GetAllCharactersResponse,
    GetAllCharactersAdminResponse,
    CharacterWithAllDetailsResponse,
    // New types for advancement and spell preparation
    CreateAdvancementRequest,
    UpdateAdvancementRequest,
    CharacterAdvancementWithDetailsResponse,
    CreateSpellPreparationRequest,
    UpdateSpellPreparationRequest,
    CharacterSpellPreparationResponse,
    CreateCharacterAbilityScoreRequest,
    UpdateCharacterAbilityScoreRequest,
    CharacterAbilityScoreResponse,
    UpsertCharacterAbilityScoresRequest,
    SaveCharacterRequest,
    // NEW: Character disallowed source types
    CreateCharacterDisallowedSourceRequest,
    CharacterDisallowedSource,
    RemoveDisallowedSourceParamRequest,
    // NEW: Character attack definition types
    CreateCharacterAttackDefinitionRequest,
    UpdateCharacterAttackDefinitionRequest,
    CharacterAttackDefinition,
    CharacterAttackIdParamRequest,
    ReorderAttackDefinitionsRequest,
    // NEW: Spell selection types
    CharacterSpellSelectionResponse,
    AddSpellKnownRequest,
    RemoveSpellKnownRequest,
    CharacterSpellSelectionParamRequest,
    // NEW: Character detail types
    CharacterFeatureUses,
    UpdateFeatureUsesRequest,
    UpdateMoneyRequest,
    AddItemRequest,
    UpdateWoundsRequest,
    UpdateNotesRequest,
    SyncItemsRequest,
    SyncSpellPreparationsRequest,
    SyncSpellsKnownRequest,
    SyncSpellsKnownParamRequest,
    SpellCastParamRequest,
} from '@shared/schema';

import { characterService } from './characterService';

const prisma = new PrismaClient();

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

export async function GetAllCharactersAdmin(req: ValidatedNoInput<GetAllCharactersAdminResponse>, res: Response, _next: NextFunction) {
    const result = await characterService.getAllCharactersAdmin();
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

export async function SaveCharacter(req: ValidatedBodyT<SaveCharacterRequest>, res: Response, _next: NextFunction) {
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

    const result = await characterService.saveCharacter(null, saveData);
    res.status(201).json(result);
}

export async function UpdateCharacter(req: ValidatedParamsBodyT<CharacterIdParamRequest, SaveCharacterRequest>, res: Response, _next: NextFunction) {
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

    const result = await characterService.saveCharacter(req.params.id, saveData);

    res.json(result);
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

export async function GetCharacterAdvancements(req: ValidatedParamsT<CharacterIdParamRequest, CharacterAdvancementWithDetailsResponse[]>, res: Response, _next: NextFunction) {
    const advancements = await characterService.getCharacterAdvancements(req.params.id);
    res.json(advancements);
}

// Spell preparation methods
export async function CreateSpellPreparation(req: ValidatedParamsBodyT<CharacterIdParamRequest, CreateSpellPreparationRequest>, res: Response, _next: NextFunction) {
    const result = await characterService.createSpellPreparation(req.params.id, req.body);
    res.status(201).json(result);
}

export async function UpdateSpellPreparation(req: ValidatedParamsBodyT<SpellPreparationParamRequest, UpdateSpellPreparationRequest>, res: Response, _next: NextFunction) {
    await characterService.updateSpellPreparation(req.params.preparationId, req.body);
    res.json({ message: 'Spell preparation updated successfully' });
}

export async function DeleteSpellPreparation(req: ValidatedParamsT<SpellPreparationParamRequest>, res: Response, _next: NextFunction) {
    await characterService.deleteSpellPreparation(req.params.preparationId);
    res.json({ message: 'Spell preparation deleted successfully' });
}

export async function GetCharacterSpellPreparations(req: ValidatedParamsT<CharacterIdParamRequest, CharacterSpellPreparationResponse[]>, res: Response, _next: NextFunction) {
    const preparations = await characterService.getCharacterSpellPreparations(req.params.id);
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

export async function GetCharacterAbilityScores(req: ValidatedParamsT<CharacterIdParamRequest, CharacterAbilityScoreResponse[]>, res: Response, _next: NextFunction) {
    const abilities = await characterService.getCharacterAbilityScores(req.params.id);
    res.json(abilities);
}

export async function UpsertCharacterAbilityScores(req: ValidatedParamsBodyT<CharacterIdParamRequest, Omit<UpsertCharacterAbilityScoresRequest, 'characterId'>>, res: Response, _next: NextFunction) {
    await characterService.upsertCharacterAbilityScores({
        characterId: req.params.id,
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

export async function RemoveDisallowedSource(req: ValidatedParamsT<RemoveDisallowedSourceParamRequest>, res: Response, _next: NextFunction) {
    const { id, sourceBookId } = req.params;

    await characterService.removeDisallowedSource(id, sourceBookId);
    res.json({ message: 'Disallowed source removed successfully' });
}

export async function GetDisallowedSources(req: ValidatedParamsT<CharacterIdParamRequest, CharacterDisallowedSource[]>, res: Response, _next: NextFunction) {
    const disallowedSources = await characterService.getDisallowedSources(req.params.id);
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

export async function UpdateCharacterAttackDefinition(req: ValidatedParamsBodyT<CharacterAttackIdParamRequest, UpdateCharacterAttackDefinitionRequest>, res: Response, _next: NextFunction) {
    try {
        await characterService.updateCharacterAttackDefinition(req.params.id, req.params.attackId, req.body);
        res.json({ message: 'Attack definition updated successfully' });
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export async function DeleteCharacterAttackDefinition(req: ValidatedParamsT<CharacterAttackIdParamRequest>, res: Response, _next: NextFunction) {
    try {
        await characterService.deleteCharacterAttackDefinition(req.params.id, req.params.attackId);
        res.json({ message: 'Attack definition deleted successfully' });
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export async function ReorderCharacterAttackDefinitions(req: ValidatedParamsBodyT<CharacterIdParamRequest, ReorderAttackDefinitionsRequest>, res: Response, _next: NextFunction) {
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

/**
 * Get character spell selection data for a specific class.
 * 
 * **DEPRECATED**: This endpoint is deprecated. Spell selection data is now included in the
 * resolved character response (ResolvedCharacterResult) as part of character resolution.
 * 
 * Spell selection data depends on resolved features, class choices, domain choices, and
 * feat choices - all of which are part of the resolved character. Using the resolved character
 * response is architecturally correct and eliminates the need for this separate API call.
 * 
 * @deprecated Use resolved character response (ResolvedCharacterResult.spellSelection) instead.
 * This endpoint may be removed in a future version.
 */
export async function GetCharacterSpellSelection(req: ValidatedParamsT<CharacterSpellSelectionParamRequest, CharacterSpellSelectionResponse>, res: Response, _next: NextFunction) {
    try {
        const classId = req.params.classId;
        // Note: This endpoint is deprecated. Spell selection data should come from resolved character response.
        // Passing undefined for resolved features - this endpoint should not be used for new code.
        const result = await characterService.getAvailableSpellsForClass(req.params.id, classId, undefined);

        // Transform to response format
        const spells = result.spells.map(s => ({
            ...s.spell,
            classSpellLevel: s.classSpellLevel,
            isKnown: s.isKnown,
            isFreeGrant: s.isFreeGrant
        }));

        const domainSpells = result.domainSpells.map(ds => ({
            ...ds.spell,
            classSpellLevel: ds.classSpellLevel,
            isKnown: ds.isKnown,
            domainId: ds.domainId,
            domainName: ds.domainName,
            domainSpellLevel: ds.spellLevel
        }));

        res.json({
            total: spells.length + domainSpells.length,
            results: [...domainSpells, ...spells],
            domainSpells,
            ...(result.availableFreeSpells !== undefined && { availableFreeSpells: result.availableFreeSpells })
        });
    } catch (error) {
        console.error('Error in GetCharacterSpellSelection:', error);
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export async function AddSpellKnown(req: ValidatedBodyT<AddSpellKnownRequest>, res: Response, _next: NextFunction) {
    try {
        // TODO: Fetch resolved features if needed for spellbook class validation
        // For now, pass undefined - frontend should provide resolved features for free grant validation
        const result = await characterService.addSpellKnown(
            req.body.characterId,
            req.body.classId,
            req.body.spellId,
            req.body.advancementId,
            req.body.isFreeGrant ?? false,
            undefined // resolvedProgressions - should be fetched if isFreeGrant is true
        );
        res.json(result);
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export async function RemoveSpellKnown(req: ValidatedBodyT<RemoveSpellKnownRequest>, res: Response, _next: NextFunction) {
    try {
        const result = await characterService.removeSpellKnown(
            req.body.characterId,
            req.body.spellId,
            req.body.advancementId
        );
        res.json(result);
    } catch (error) {
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}

// Character detail methods (uses tracking, money, items, wounds, spell cast)
export async function GetCharacterUses(req: ValidatedParamsT<CharacterIdParamRequest, CharacterFeatureUses[]>, res: Response, _next: NextFunction) {
    const uses = await characterService.getCharacterUses(req.params.id);
    res.json(uses);
}

export async function UpdateFeatureUses(req: ValidatedParamsBodyT<CharacterIdParamRequest & { featureId: number; entityId: number }, UpdateFeatureUsesRequest>, res: Response, _next: NextFunction) {
    const result = await characterService.updateFeatureUses(req.params.id, req.params.featureId, req.params.entityId, req.body.delta);
    res.json(result);
}

export async function ResetDailyUses(req: ValidatedParamsT<CharacterIdParamRequest>, res: Response, _next: NextFunction) {
    await characterService.resetDailySpellPreparations(req.params.id);
    await characterService.resetDailyUses(req.params.id);
    res.json({ message: 'Daily uses reset successfully' });
}

export async function ResetAllUses(req: ValidatedParamsT<CharacterIdParamRequest>, res: Response, _next: NextFunction) {
    await characterService.resetAllUses(req.params.id);
    res.json({ message: 'All uses reset successfully' });
}

export async function UpdateMoney(req: ValidatedParamsBodyT<CharacterIdParamRequest, UpdateMoneyRequest>, res: Response, _next: NextFunction) {
    await characterService.updateMoney(req.params.id, req.body);
    res.json({ message: 'Money updated successfully' });
}

export async function AddItem(req: ValidatedParamsBodyT<CharacterIdParamRequest, AddItemRequest>, res: Response, _next: NextFunction) {
    const result = await characterService.addItem(req.params.id, req.body);
    res.status(201).json(result);
}

export async function RemoveItem(req: ValidatedParamsT<CharacterIdParamRequest & { itemId: number }>, res: Response, _next: NextFunction) {
    const result = await characterService.removeItem(req.params.id, req.params.itemId);
    res.json(result);
}

export async function UpdateWounds(req: ValidatedParamsBodyT<CharacterIdParamRequest, UpdateWoundsRequest>, res: Response, _next: NextFunction) {
    await characterService.updateWounds(req.params.id, req.body);
    res.json({ message: 'Wounds updated successfully' });
}

export async function UpdateNotes(req: ValidatedParamsBodyT<CharacterIdParamRequest, UpdateNotesRequest>, res: Response, _next: NextFunction) {
    await characterService.updateNotes(req.params.id, req.body);
    res.json({ message: 'Notes updated successfully' });
}

export async function SyncItems(req: ValidatedParamsBodyT<CharacterIdParamRequest, SyncItemsRequest>, res: Response, _next: NextFunction) {
    await characterService.syncItems(req.params.id, req.body.items);
    res.json({ message: 'Items synced successfully' });
}

export async function SyncSpellPreparations(req: ValidatedParamsBodyT<CharacterIdParamRequest, SyncSpellPreparationsRequest>, res: Response, _next: NextFunction) {
    await characterService.syncSpellPreparations(req.params.id, req.body.spellPreparations);
    res.json({ message: 'Spell preparations synced successfully' });
}

export async function SyncSpellsKnown(req: ValidatedParamsBodyT<SyncSpellsKnownParamRequest, SyncSpellsKnownRequest>, res: Response, _next: NextFunction) {
    await characterService.syncSpellsKnown(req.params.id, req.params.advancementId, req.body.spellsKnown);
    res.json({ message: 'Spells known synced successfully' });
}

export async function CastSpell(req: ValidatedParamsT<SpellCastParamRequest>, res: Response, _next: NextFunction) {
    await characterService.castSpell(req.params.id, req.params.preparationId);
    res.json({ message: 'Spell cast successfully' });
}

export async function UncastSpell(req: ValidatedParamsT<SpellCastParamRequest>, res: Response, _next: NextFunction) {
    await characterService.uncastSpell(req.params.id, req.params.preparationId);
    res.json({ message: 'Spell uncast successfully' });
}

export async function ResetDailySpellPreparations(req: ValidatedParamsT<CharacterIdParamRequest>, res: Response, _next: NextFunction) {
    await characterService.resetDailySpellPreparations(req.params.id);
    res.json({ message: 'Daily spell preparations reset successfully' });
}
