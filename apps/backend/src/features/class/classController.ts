import { Response, NextFunction } from 'express';

import {
    ValidatedBodyT,
    ValidatedNoInput,
    ValidatedParamsBodyT,
    ValidatedParamsQueryT,
    ValidatedParamsT,
} from '@/util/validated-types';
import {
    ClassCacheResponse,
    ClassIdQueryRequest,
    CreateClassRequest,
    DnDClass,
    GetAllClassesQuery,
    GetAllClassesResponse,
    GetFeaturesResponse,
    IdParamRequest,
    UpdateClassRequest,
    UpdateResponse,
} from '@shared/schema';
import { DraftType } from '@shared/static-data';

import { classService } from './classService';
import { DraftLockService } from '../shared/draftState/DraftLockService';


let draftLockServiceInstance: DraftLockService | null = null;

function getDraftLockService(): DraftLockService {
    if (!draftLockServiceInstance) {
        draftLockServiceInstance = new DraftLockService();
    }
    return draftLockServiceInstance;
}

/**
 * Fetches all classes from the database with pagination and filtering.
 */
export async function GetAllClasses(req: ValidatedBodyT<GetAllClassesQuery, GetAllClassesResponse>, res: Response, _next: NextFunction) {
    const classes = await classService.getAllClasses(req.body);
    res.json(classes);
}

/**
 * Fetches a single class by its ID (supports both base classes and variants via unified ID system).
 * Optionally accepts character feature choices to enrich features with choice data.
 */
export async function GetClassById(
    req: ValidatedParamsQueryT<IdParamRequest, ClassIdQueryRequest, DnDClass>,
    res: Response,
    _next: NextFunction
) {
    const cls = await classService.getClassById(req.params, req.query.characterFeatureChoices);

    if (!cls) {
        res.status(404).json({ error: 'Class not found' });
        return;
    }

    res.json(cls);
}

/**
 * Fetches feature progressions for a class. Used by ClassDetail/ClassDisplay to resolve featureIds to FeatureWithRelations[].
 */
export async function GetClassFeatures(
    req: ValidatedParamsQueryT<IdParamRequest, ClassIdQueryRequest, GetFeaturesResponse>,
    res: Response,
    _next: NextFunction
) {
    const features = await classService.getClassFeatures(req.params, req.query.characterFeatureChoices);
    res.json(features);
}

/**
 * Creates a new class.
 */
export async function CreateClass(req: ValidatedBodyT<CreateClassRequest>, res: Response, _next: NextFunction) {
    await classService.createClass(req.body);
    res.status(201).json({ message: 'Class created successfully' });
}

/**
 * Updates an existing class.
 */
export async function UpdateClass(req: ValidatedParamsBodyT<IdParamRequest, UpdateClassRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    await classService.updateClass(req.params, req.body);
    res.status(200).json({ message: 'Class updated successfully' });
}

/**
 * Deletes a class.
 */
export async function DeleteClass(req: ValidatedParamsT<IdParamRequest>, res: Response, _next: NextFunction) {
    await classService.deleteClass(req.params);
    res.json({ message: 'Class deleted successfully' });
}

/**
 * Fetches all classes for cache (lightweight data).
 */
export async function GetClassCache(req: ValidatedNoInput<ClassCacheResponse>, res: Response, _next: NextFunction) {
    const classes = await classService.getClassCache();
    res.json(classes);
}

/**
 * Gets the lock status for a class.
 * 
 * Returns whether the class is currently locked and, if so, which user holds the lock.
 * This is a read-only operation that doesn't require authentication.
 */
export async function GetClassLockStatus(
    req: ValidatedParamsT<IdParamRequest>,
    res: Response,
    _next: NextFunction
) {
    const lockService = getDraftLockService();
    const lockedBy = await lockService.checkLock(DraftType.Class, req.params.id);

    if (lockedBy === null) {
        res.json({ locked: false });
    } else {
        res.json({ locked: true, lockedBy });
    }
}


