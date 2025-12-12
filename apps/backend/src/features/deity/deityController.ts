import { Response } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput, ValidatedQueryT } from '@/util/validated-types';
import {
    DeityIdParamRequest,
    CreateDeityRequest,
    UpdateDeityRequest,
    GetAllDeitiesResponse,
    Deity,
    DeityCacheResponse,
} from '@shared/schema';

import { deityService } from './deityService.js';

/**
 * Fetches all deities from the database.
 */
export async function GetAllDeities(req: ValidatedNoInput<GetAllDeitiesResponse>, res: Response) {
    const deities = await deityService.getAllDeities();
    res.json(deities);
}

/**
 * Fetches a single deity by its ID.
 */
export async function GetDeityById(req: ValidatedParamsT<DeityIdParamRequest, Deity>, res: Response) {
    const deity = await deityService.getDeityById(req.params);

    if (!deity) {
        res.status(404).json({ error: 'Deity not found' });
        return;
    }

    res.json(deity);
}

/**
 * Creates a new deity.
 */
export async function CreateDeity(req: ValidatedBodyT<CreateDeityRequest, Deity>, res: Response) {
    const deity = await deityService.createDeity(req.body);
    res.status(201).json(deity);
}

/**
 * Updates an existing deity.
 */
export async function UpdateDeity(req: ValidatedParamsBodyT<DeityIdParamRequest, UpdateDeityRequest, Deity>, res: Response) {
    const deity = await deityService.updateDeity(req.body, req.params);
    res.json(deity);
}

/**
 * Deletes a deity.
 */
export async function DeleteDeity(req: ValidatedParamsT<DeityIdParamRequest, void>, res: Response) {
    await deityService.deleteDeity(req.params);
    res.status(204).send();
}

/**
 * Validates deity selection for a character advancement.
 */
export async function ValidateDeitySelection(req: ValidatedBodyT<unknown, unknown>, res: Response) {
    const body = req.body as { advancementId: number; deityId: number };
    const result = await deityService.validateDeitySelection(body.advancementId, body.deityId);
    res.json(result);
}

/**
 * Fetches all deities for cache (lightweight data).
 */
export async function GetDeityCache(req: ValidatedNoInput<DeityCacheResponse>, res: Response) {
    const deities = await deityService.getDeityCache();
    res.json(deities);
}
