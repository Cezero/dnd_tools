import { Response } from 'express';

import { PrismaClient } from '@shared/prisma-client';
import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types';
import {
    CompanionIdParamRequest,
    CreateCompanionRequest,
    UpdateCompanionRequest,
    GetAllCompanionsResponse,
    GetCompanionResponse,
    CreateCharacterCompanionRequest,
    UpdateCharacterCompanionRequest,
    GetAllCharacterCompanionsResponse,
} from '@shared/schema';

import { companionService } from './companionService.js';

const prisma = new PrismaClient();

/**
 * Fetches all companions from the database.
 */
export async function GetAllCompanions(req: ValidatedNoInput<GetAllCompanionsResponse>, res: Response) {
    const companions = await companionService.getAllCompanions();
    res.json(companions);
}

/**
 * Fetches a single companion by its ID.
 */
export async function GetCompanionById(req: ValidatedParamsT<CompanionIdParamRequest, GetCompanionResponse>, res: Response) {
    const companion = await companionService.getCompanionById(req.params);

    if (!companion) {
        res.status(404).json({ error: 'Companion not found' });
        return;
    }

    res.json(companion);
}

/**
 * Creates a new companion.
 */
export async function CreateCompanion(req: ValidatedBodyT<CreateCompanionRequest, GetCompanionResponse>, res: Response) {
    const companion = await companionService.createCompanion(req.body);
    res.status(201).json(companion);
}

/**
 * Updates an existing companion.
 */
export async function UpdateCompanion(req: ValidatedParamsBodyT<CompanionIdParamRequest, UpdateCompanionRequest, GetCompanionResponse>, res: Response) {
    const companion = await companionService.updateCompanion(req.body, req.params);
    res.json(companion);
}

/**
 * Deletes a companion.
 */
export async function DeleteCompanion(req: ValidatedParamsT<CompanionIdParamRequest, void>, res: Response) {
    await companionService.deleteCompanion(req.params);
    res.status(204).send();
}

/**
 * Fetches all companions for a character.
 */
export async function GetCharacterCompanions(req: ValidatedParamsT<{ characterId: number }, GetAllCharacterCompanionsResponse>, res: Response) {
    const companions = await companionService.getCharacterCompanions(req.params.characterId);
    res.json(companions);
}

/**
 * Creates a new character companion.
 */
export async function CreateCharacterCompanion(req: ValidatedBodyT<CreateCharacterCompanionRequest, GetAllCharacterCompanionsResponse>, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    // Verify that the character belongs to the authenticated user
    const character = await prisma.userCharacter.findUnique({
        where: { id: req.body.characterId },
        select: { userId: true }
    });

    if (!character) {
        res.status(404).json({ error: 'Character not found' });
        return;
    }

    if (character.userId !== userId) {
        res.status(403).json({ error: 'You do not have permission to create companions for this character' });
        return;
    }

    const companion = await companionService.createCharacterCompanion(req.body);
    res.status(201).json(companion);
}

/**
 * Updates an existing character companion.
 */
export async function UpdateCharacterCompanion(req: ValidatedParamsBodyT<{ id: number }, UpdateCharacterCompanionRequest, GetAllCharacterCompanionsResponse>, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    // Verify that the character companion belongs to the authenticated user
    const characterCompanion = await prisma.characterCompanion.findUnique({
        where: { id: req.params.id },
        include: {
            character: {
                select: { userId: true }
            }
        }
    });

    if (!characterCompanion) {
        res.status(404).json({ error: 'Character companion not found' });
        return;
    }

    if (characterCompanion.character.userId !== userId) {
        res.status(403).json({ error: 'You do not have permission to update this companion' });
        return;
    }

    const companion = await companionService.updateCharacterCompanion(req.body, req.params);
    res.json(companion);
}

/**
 * Deletes a character companion.
 */
export async function DeleteCharacterCompanion(req: ValidatedParamsT<{ id: number }, void>, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    // Verify that the character companion belongs to the authenticated user
    const characterCompanion = await prisma.characterCompanion.findUnique({
        where: { id: req.params.id },
        include: {
            character: {
                select: { userId: true }
            }
        }
    });

    if (!characterCompanion) {
        res.status(404).json({ error: 'Character companion not found' });
        return;
    }

    if (characterCompanion.character.userId !== userId) {
        res.status(403).json({ error: 'You do not have permission to delete this companion' });
        return;
    }

    await companionService.deleteCharacterCompanion(req.params);
    res.status(204).send();
}

