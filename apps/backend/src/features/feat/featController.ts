import { Response } from 'express';

import { ValidatedQueryT, ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types'
import {
    FeatIdParamRequest,
    GetFeatResponse,
    FeatQueryResponse,
    FeatQueryRequest,
    CreateFeatRequest,
    UpdateFeatRequest,
    GetAllFeatsResponse,
} from '@shared/schema';

import { featService } from './featService.js';


/**
 * Fetches all feats from the database with pagination and filtering.
 */
export async function GetFeats(req: ValidatedQueryT<FeatQueryRequest, FeatQueryResponse>, res: Response) {
    const result = await featService.getFeats(req.query);
    res.json(result);
}

export async function GetAllFeats(req: ValidatedNoInput<GetAllFeatsResponse>, res: Response) {
    const feats = await featService.getAllFeats();
    res.json(feats);
}

/**
 * Fetches a single feat by its ID.
 */
export async function GetFeatById(req: ValidatedParamsT<FeatIdParamRequest, GetFeatResponse>, res: Response) {
    const feat = await featService.getFeatById(req.params);

    if (!feat) {
        res.status(404).json({error: 'Feat not found'});
        return;
    }

    res.json(feat);
}

/**
 * Creates a new feat.
 */
export async function CreateFeat(req: ValidatedBodyT<CreateFeatRequest>, res: Response) {
    const result = await featService.createFeat(req.body);
    res.status(201).json(result);
}

/**
 * Updates an existing feat.
 */
export async function UpdateFeat(req: ValidatedParamsBodyT<FeatIdParamRequest, UpdateFeatRequest>, res: Response) {
    const result = await featService.updateFeat(req.params, req.body);
    res.status(200).json(result);
}

/**
 * Deletes a feat by its ID.
 */
export async function DeleteFeat(req: ValidatedParamsT<FeatIdParamRequest>, res: Response) {
    const result = await featService.deleteFeat(req.params);
    res.status(200).json(result);
} 