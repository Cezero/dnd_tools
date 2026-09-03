import { Response } from 'express';

import { BadRequestError } from '@/errors/BadRequestError';
import { prisma } from '@/lib/prisma';
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
    CompanionCacheResponse,
    GetResolvedCharacterCompanionsResponse,
} from '@shared/schema';

import { companionService } from './companionService.js';

/**
 * Fetches all companions from the database.
 */
export async function GetAllCompanions(req: ValidatedNoInput<GetAllCompanionsResponse>, res: Response) {
    const companions = await companionService.getAllCompanions();
    res.json(companions);
}

/**
 * Handles requests for cached companion data.
 * 
 * Returns lightweight companion data optimized for dropdowns and select components,
 * including companion ID, type, monster ID, minimum level, and monster name.
 * 
 * Request: No parameters
 * Response: CompanionCacheResponse with cached companion data
 * Authentication: Public (no authentication required)
 */
export async function GetCompanionCache(req: ValidatedNoInput<CompanionCacheResponse>, res: Response) {
    const companions = await companionService.getCompanionCache();
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
 * Fetches resolved companions with computed stat blocks for a character.
 */
export async function GetResolvedCharacterCompanions(req: ValidatedParamsT<{ characterId: number }, GetResolvedCharacterCompanionsResponse>, res: Response) {
    const companions = await companionService.getResolvedCharacterCompanions(req.params.characterId);
    res.json(companions);
}

/**
 * Creates a new character companion with ownership validation.
 * 
 * Verifies that the authenticated user owns the character before allowing companion creation.
 * This ensures users can only create companions for their own characters.
 * 
 * Authentication: Requires authentication (user must be logged in)
 * Ownership Validation:
 * 1. Verifies user is authenticated (returns 401 if not)
 * 2. Queries character to verify ownership
 * 3. Returns 404 if character not found
 * 4. Returns 403 if character does not belong to user
 * 5. Proceeds with creation if ownership verified
 * 
 * @param req - Request with CreateCharacterCompanionRequest body
 * @param res - Response object
 */
export async function CreateCharacterCompanion(req: ValidatedBodyT<CreateCharacterCompanionRequest, GetAllCharacterCompanionsResponse>, res: Response) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
    }

    // Verify that the character belongs to the authenticated user
    const character = await prisma.character.findUnique({
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

    try {
        const companion = await companionService.createCharacterCompanion(req.body);
        res.status(201).json(companion);
    } catch (error) {
        if (error instanceof BadRequestError) {
            res.status(400).json({ error: error.message });
            return;
        }
        throw error;
    }
}

/**
 * Updates an existing character companion with ownership validation.
 * 
 * Verifies that the authenticated user owns the character companion before allowing update.
 * Queries character companion with character relationship to verify ownership through
 * the character relationship.
 * 
 * Authentication: Requires authentication (user must be logged in)
 * Ownership Validation:
 * 1. Verifies user is authenticated (returns 401 if not)
 * 2. Queries character companion with character relationship
 * 3. Verifies character ownership through relationship
 * 4. Returns 404 if companion not found
 * 5. Returns 403 if character does not belong to user
 * 6. Proceeds with update if ownership verified
 * 
 * @param req - Request with character companion ID in params and UpdateCharacterCompanionRequest in body
 * @param res - Response object
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

    try {
        const companion = await companionService.updateCharacterCompanion(req.body, req.params);
        res.json(companion);
    } catch (error) {
        if (error instanceof BadRequestError) {
            res.status(400).json({ error: error.message });
            return;
        }
        throw error;
    }
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

