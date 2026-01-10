import { Response } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput, ValidatedQueryT } from '@/util/validated-types'
import {
    FeatIdParamRequest,
    CreateFeatRequest,
    UpdateFeatRequest,
    GetAllFeatsResponse,
    FeatQueryRequest,
    FeatQueryResponse,
    GetFeatListResponse,
    Feat,
    FeatCacheResponse,
    GetAllFeatsWithFeatureInfoResponse,
} from '@shared/schema';

import { featService } from './featService.js';

/**
 * Fetches all feats from the database with pagination and filtering.
 */
export async function GetAllFeats(req: ValidatedNoInput<GetAllFeatsResponse>, res: Response) {
    const feats = await featService.getAllFeats();
    res.json(feats);
}

export async function GetFeatQuery(req: ValidatedQueryT<FeatQueryRequest, FeatQueryResponse>, res: Response) {
    const feats = await featService.featQuery(req.query);
    res.json(feats);
}

/**
 * Fetches a list of feats with only id and name for dropdown selection.
 */
export async function GetFeatList(req: ValidatedQueryT<FeatQueryRequest, GetFeatListResponse>, res: Response) {
    const feats = await featService.getFeatList(req.query);
    res.json(feats);
}

/**
 * Fetches a single feat by its ID.
 */
export async function GetFeatById(req: ValidatedParamsT<FeatIdParamRequest, Feat>, res: Response) {
    const feat = await featService.getFeatById(req.params);

    if (!feat) {
        res.status(404).json({ error: 'Feat not found' });
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

/**
 * Fetches all feats for cache (lightweight data).
 */
export async function GetFeatCache(req: ValidatedQueryT<FeatQueryRequest, FeatCacheResponse>, res: Response) {
    const feats = await featService.getFeatCache(req.query);
    res.json(feats);
}

/**
 * Fetches all feats with full data (including feature progressions).
 */
export async function GetAllFeatsFull(req: ValidatedNoInput<FeatQueryResponse>, res: Response) {
    const feats = await featService.getAllFeatsFull();
    res.json(feats);
}

/**
 * Fetches all feats with feature information (description and summary).
 * 
 * This endpoint returns a lightweight schema containing only:
 * - id: from Feat.id
 * - name: from Feat.name
 * - description: from the associated Feature.description (via FeatureProgression)
 * - summary: from the associated Feature.summary (via FeatureProgression)
 * 
 * IMPORTANT: This is a composite response where:
 * - id and name come from the Feat table
 * - description and summary come from the associated Feature table
 * 
 * If a feat has no associated feature, description and summary will be null.
 * If a feat has multiple feature progressions, the first one's feature is used.
 * 
 * This endpoint is optimized for list views where full feat data and progressions
 * are not needed, but feature description/summary are required for display.
 */
export async function GetAllFeatsWithFeatureInfo(req: ValidatedNoInput<GetAllFeatsWithFeatureInfoResponse>, res: Response) {
    const feats = await featService.getAllFeatsWithFeatureInfo();
    res.json(feats);
} 
