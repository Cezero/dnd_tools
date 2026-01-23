import { Response, NextFunction } from 'express';

import { ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types';
import {
    GetAllFeaturesResponse,
    CreateFeatureBasicRequest,
    UpdateFeatureBasicRequest,
    UpdateFeature,
    FeatureIdParamRequest,
    EditionIdParamRequest,
    FeatureQueryRequest,
    GetFeatureResponse,
    CreateResponse,
    UpdateResponse,
    CreateFeatureRequest,
    UpdateFeaturesRequest,
    GetFeaturesResponse,
    GetFeatureListResponse,
    CloneClassFeaturesRequest,
    ForkFeatureRequest,
    ForkFeatureResponse,
    FeatureCacheResponse,
} from '@shared/schema';
import { DraftType } from '@shared/static-data';

import { featureSystemService } from './featureSystemService.js';
import { DraftLockService } from '../shared/draftState/DraftLockService';


let draftLockServiceInstance: DraftLockService | null = null;

function getDraftLockService(): DraftLockService {
    if (!draftLockServiceInstance) {
        draftLockServiceInstance = new DraftLockService();
    }
    return draftLockServiceInstance;
}

/**
 * Fetches all features from the database.
 */
export async function GetAllFeatures(req: ValidatedBodyT<FeatureQueryRequest, GetAllFeaturesResponse>, res: Response, _next: NextFunction) {
    const features = await featureSystemService.getAllFeatures(req.body.sourceTypes);
    res.json(features);
}

/**
 * Fetches a list of features with only id and name for dropdown selection.
 */
export async function GetFeatureList(req: ValidatedBodyT<FeatureQueryRequest, GetFeatureListResponse>, res: Response, _next: NextFunction) {
    const features = await featureSystemService.getFeatureList(req.body.sourceTypes);
    res.json(features);
}

/**
 * Fetches feature cache (id and name only) for frontend caching.
 */
export async function GetFeatureCache(req: ValidatedNoInput<FeatureCacheResponse>, res: Response, _next: NextFunction) {
    const features = await featureSystemService.getFeatureCache();
    res.json(features);
}

/**
 * Gets the lock status for a feature.
 * 
 * Returns whether the feature is currently locked and, if so, which user holds the lock.
 * This is a read-only operation that doesn't require authentication.
 */
export async function GetFeatureLockStatus(
    req: ValidatedParamsT<FeatureIdParamRequest>,
    res: Response,
    _next: NextFunction
) {
        const lockService = getDraftLockService();
    const lockedBy = await lockService.checkLock(DraftType.Feature, req.params.id);

    if (lockedBy === null) {
        res.json({ locked: false });
    } else {
        res.json({ locked: true, lockedBy });
    }
}

/**
 * Fetches a single feature by its ID.
 */
export async function GetFeatureById(req: ValidatedParamsT<FeatureIdParamRequest, GetFeatureResponse>, res: Response, _next: NextFunction) {
    const feature = await featureSystemService.getFeatureById(req.params);

    if (!feature) {
        res.status(404).json({ error: 'Feature not found' });
        return;
    }

    res.json(feature);
}

/**
 * Creates a new feature.
 * 
 * @deprecated This endpoint bypasses the state system and should not be used for feature editing.
 * Use the feature resolution API (`POST /features/:featureId/start-editing` -> `PUT /features/:featureId/update` -> `POST /features/:featureId/save`) instead.
 * This endpoint is kept for backward compatibility but may be removed in a future version.
 */
export async function CreateFeature(req: ValidatedBodyT<CreateFeatureBasicRequest, CreateResponse>, res: Response, _next: NextFunction) {
    console.warn('[DEPRECATED] CreateFeature endpoint called. This bypasses the state system. Use feature resolution API instead.');
    const result = await featureSystemService.createFeature(req.body);
    res.status(201).json(result);
}

/**
 * Updates an existing feature by ID.
 * 
 * @deprecated This endpoint bypasses the state system and should not be used for feature editing.
 * Use the feature resolution API (`POST /features/:featureId/start-editing` -> `PUT /features/:featureId/update` -> `POST /features/:featureId/save`) instead.
 * This endpoint is kept for backward compatibility but may be removed in a future version.
 */
export async function UpdateFeatureById(req: ValidatedParamsBodyT<FeatureIdParamRequest, UpdateFeature, UpdateResponse>, res: Response, _next: NextFunction) {
    console.warn(`[DEPRECATED] UpdateFeatureById endpoint called for feature ${req.params.id}. This bypasses the state system. Use feature resolution API instead.`);
    const result = await featureSystemService.updateFeature(req.params, req.body);
    res.status(200).json(result);
}

/**
 * Deletes a feature by its slug.
 */
export async function DeleteFeature(req: ValidatedParamsT<FeatureIdParamRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    const result = await featureSystemService.deleteFeature(req.params);
    res.status(200).json(result);
}

/**
 * Deletes a feature by its ID.
 */
export async function DeleteFeatureById(req: ValidatedParamsT<FeatureIdParamRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    const result = await featureSystemService.deleteFeature(req.params);
    res.status(200).json(result);
}

/**
 * Creates features with all related entities.
 * Used for bulk operations when creating/updating classes and races.
 */
export async function CreateFeatureWithRelations(req: ValidatedBodyT<CreateFeatureRequest, CreateResponse>, res: Response, _next: NextFunction) {
    const result = await featureSystemService.createFeatureWithRelations(req.body);
    res.status(201).json(result);
}

/**
 * Updates features for a specific feature.
 */
export async function UpdateFeatures(req: ValidatedParamsBodyT<FeatureIdParamRequest, UpdateFeaturesRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    const result = await featureSystemService.updateFeatures(req.params.id, req.body.features);
    res.status(200).json(result);
}

/**
 * Gets all features for a specific feature.
 */
export async function GetFeatures(req: ValidatedParamsT<FeatureIdParamRequest, GetFeaturesResponse>, res: Response, _next: NextFunction) {
    const features = await featureSystemService.getFeatures(req.params.id);
    res.status(200).json(features);
}

/**
 * Gets features for a specific feat.
 */
export async function GetFeaturesByFeatId(req: ValidatedParamsT<{ id: number }, GetFeaturesResponse>, res: Response, _next: NextFunction) {
    const features = await featureSystemService.getFeaturesByFeatIds([req.params.id]);
    res.status(200).json(features);
}

/**
 * Gets features for a specific edition.
 */
export async function GetFeaturesByEditionId(req: ValidatedParamsT<EditionIdParamRequest, GetFeaturesResponse>, res: Response, _next: NextFunction) {
    const features = await featureSystemService.getFeaturesByEditionId(req.params.editionId);
    res.status(200).json(features);
}

/**
 * Clones features from a source class to a target class.
 * Used for creating variant classes by copying base class features.
 */
export async function CloneClassFeatures(req: ValidatedBodyT<CloneClassFeaturesRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    await featureSystemService.cloneClassFeatures(
        req.body.sourceClassId,
        req.body.targetClassId,
        req.body.forkFeatures ?? false
    );
    res.status(200).json({ message: 'Class features cloned successfully' });
}

/**
 * Forks a shared feature to make it class-specific.
 * Creates a copy of the feature linked directly to the class.
 */
export async function ForkFeatureForClass(req: ValidatedBodyT<ForkFeatureRequest, ForkFeatureResponse>, res: Response, _next: NextFunction) {
    const forkedFeatureId = await featureSystemService.forkFeatureForClass(
        req.body.featureId,
        req.body.classId
    );
    res.status(200).json({ forkedFeatureId });
} 
