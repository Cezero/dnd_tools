import { Response } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types';
import {
    TrickIdParamRequest,
    CreateTrickRequest,
    UpdateTrickRequest,
    GetAllTricksResponse,
    GetTrickResponse,
} from '@shared/schema';

import { trickService } from './trickService.js';

/**
 * Fetches all tricks from the database.
 */
export async function GetAllTricks(req: ValidatedNoInput<GetAllTricksResponse>, res: Response) {
    const editionId = req.query?.editionId ? parseInt(req.query.editionId as string) : undefined;
    const tricks = await trickService.getAllTricks(editionId);
    res.json(tricks);
}

/**
 * Fetches a single trick by its ID.
 */
export async function GetTrickById(req: ValidatedParamsT<TrickIdParamRequest, GetTrickResponse>, res: Response) {
    const trick = await trickService.getTrickById(req.params);

    if (!trick) {
        res.status(404).json({ error: 'Trick not found' });
        return;
    }

    res.json(trick);
}

/**
 * Creates a new trick.
 */
export async function CreateTrick(req: ValidatedBodyT<CreateTrickRequest, GetTrickResponse>, res: Response) {
    const trick = await trickService.createTrick(req.body);
    res.status(201).json(trick);
}

/**
 * Updates an existing trick.
 */
export async function UpdateTrick(req: ValidatedParamsBodyT<TrickIdParamRequest, UpdateTrickRequest, GetTrickResponse>, res: Response) {
    const trick = await trickService.updateTrick(req.body, req.params);
    res.json(trick);
}

/**
 * Deletes a trick.
 */
export async function DeleteTrick(req: ValidatedParamsT<TrickIdParamRequest, void>, res: Response) {
    await trickService.deleteTrick(req.params);
    res.status(204).send();
}

