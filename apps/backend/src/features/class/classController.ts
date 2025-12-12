import { Response, NextFunction } from 'express';

import {
    ValidatedParamsT,
    ValidatedBodyT,
    ValidatedParamsBodyT,
    ValidatedNoInput,
} from '@/util/validated-types';
import {
    ClassIdParamRequest,
    CreateClassRequest,
    UpdateClassRequest,
    GetAllClassesResponse,
    GetAllClassesQuery,
    DnDClass,
    UpdateResponse,
    ClassCacheResponse
} from '@shared/schema';

import { classService } from './classService';
/**
 * Fetches all classes from the database with pagination and filtering.
 */
export async function GetAllClasses(req: ValidatedBodyT<GetAllClassesQuery, GetAllClassesResponse>, res: Response, _next: NextFunction) {
    const classes = await classService.getAllClasses(req.body);
    res.json(classes);
}

/**
 * Fetches a single class by its ID (supports both base classes and variants via unified ID system).
 */
export async function GetClassById(req: ValidatedParamsT<ClassIdParamRequest, DnDClass>, res: Response, _next: NextFunction) {
    const cls = await classService.getClassById(req.params);

    if (!cls) {
        res.status(404).json({ error: 'Class not found' });
        return;
    }

    res.json(cls);
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
export async function UpdateClass(req: ValidatedParamsBodyT<ClassIdParamRequest, UpdateClassRequest, UpdateResponse>, res: Response, _next: NextFunction) {
    await classService.updateClass(req.params, req.body);
    res.status(200).json({ message: 'Class updated successfully' });
}

/**
 * Deletes a class.
 */
export async function DeleteClass(req: ValidatedParamsT<ClassIdParamRequest>, res: Response, _next: NextFunction) {
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


