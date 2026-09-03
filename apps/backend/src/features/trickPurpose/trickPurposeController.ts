import { Response } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types';
import {
    TrickPurposeIdParamRequest,
    CreateTrickPurposeRequest,
    UpdateTrickPurposeRequest,
    GetAllTrickPurposesResponse,
    GetTrickPurposeResponse,
    TrickPurposeCacheResponse,
} from '@shared/schema';

import { trickPurposeService } from './trickPurposeService.js';

/**
 * GET /api/trick-purposes
 */
export async function GetAllTrickPurposes(req: ValidatedNoInput<GetAllTrickPurposesResponse>, res: Response) {
    const editionId = req.query?.editionId ? parseInt(req.query.editionId as string, 10) : undefined;
    const purposes = await trickPurposeService.getAllTrickPurposes(editionId);
    res.json(purposes);
}

/**
 * GET /api/trick-purposes/cache
 */
export async function GetTrickPurposeCache(req: ValidatedNoInput<TrickPurposeCacheResponse>, res: Response) {
    const purposes = await trickPurposeService.getTrickPurposeCache();
    res.json(purposes);
}

/**
 * GET /api/trick-purposes/:id
 */
export async function GetTrickPurposeById(req: ValidatedParamsT<TrickPurposeIdParamRequest, GetTrickPurposeResponse>, res: Response) {
    const purpose = await trickPurposeService.getTrickPurposeById(req.params);

    if (!purpose) {
        res.status(404).json({ error: 'Trick purpose not found' });
        return;
    }

    res.json(purpose);
}

/**
 * POST /api/trick-purposes
 */
export async function CreateTrickPurpose(req: ValidatedBodyT<CreateTrickPurposeRequest, GetTrickPurposeResponse>, res: Response) {
    const purpose = await trickPurposeService.createTrickPurpose(req.body);
    res.status(201).json(purpose);
}

/**
 * PUT /api/trick-purposes/:id
 */
export async function UpdateTrickPurpose(req: ValidatedParamsBodyT<TrickPurposeIdParamRequest, UpdateTrickPurposeRequest, GetTrickPurposeResponse>, res: Response) {
    const purpose = await trickPurposeService.updateTrickPurpose(req.body, req.params);
    res.json(purpose);
}

/**
 * DELETE /api/trick-purposes/:id
 */
export async function DeleteTrickPurpose(req: ValidatedParamsT<TrickPurposeIdParamRequest, void>, res: Response) {
    await trickPurposeService.deleteTrickPurpose(req.params);
    res.json({ message: 'Trick purpose deleted successfully' });
}
