import { Response } from 'express';

import { ValidatedQueryT, ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types'
import {
    ClassIdParamRequest,
    ClassQueryRequest,
    GetClassResponse,
    ClassQueryResponse,
    GetAllClassesResponse,
    CreateClassRequest,
    UpdateClassRequest,
    UpdateResponse,
    ClassFeatureQueryRequest,
    ClassFeatureSlugParamRequest,
    CreateClassFeatureRequest,
    UpdateClassFeatureRequest,
    ClassFeatureQueryResponse,
    GetClassFeatureResponse,
    GetAllClassFeaturesResponse,
    CreateResponse
} from '@shared/schema';

import { classService } from './classService';
/**
 * Fetches all classes from the database with pagination and filtering.
 */
export async function GetClasses(req: ValidatedQueryT<ClassQueryRequest, ClassQueryResponse>, res: Response) {
    const result = await classService.getClasses(req.query);
    res.json(result);
}

export async function GetAllClasses(req: ValidatedNoInput<GetAllClassesResponse>, res: Response) {
    const classes = await classService.getAllClasses();
    res.json(classes);
}

/**
 * Fetches a single class by its ID.
 */
export async function GetClassById(req: ValidatedParamsT<ClassIdParamRequest, GetClassResponse>, res: Response) {
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
export async function CreateClass(req: ValidatedBodyT<CreateClassRequest>, res: Response) {
    await classService.createClass(req.body);
    res.status(201).json({ message: 'Class created successfully' });
}

/**
 * Updates an existing class.
 */
export async function UpdateClass(req: ValidatedParamsBodyT<ClassIdParamRequest, UpdateClassRequest, UpdateResponse>, res: Response) {
    await classService.updateClass(req.params, req.body);
    res.status(200).json({ message: 'Class updated successfully' });
}

/**
 * Deletes a class.
 */
export async function DeleteClass(req: ValidatedParamsT<ClassIdParamRequest>, res: Response) {
    await classService.deleteClass(req.params);
    res.json({ message: 'Class deleted successfully' });
}

// Class Feature methods
/**
 * Fetches all class features from the database with pagination and filtering.
 */
export async function GetClassFeatures(req: ValidatedQueryT<ClassFeatureQueryRequest, ClassFeatureQueryResponse>, res: Response) {
    const result = await classService.getClassFeatures(req.query);
    res.json(result);
}

/**
 * Fetches all class features from the database.
 */
export async function GetAllClassFeatures(req: ValidatedNoInput<GetAllClassFeaturesResponse>, res: Response) {
    const features = await classService.getAllClassFeatures();
    res.json(features);
}

/**
 * Fetches a single class feature by its slug.
 */
export async function GetClassFeatureBySlug(req: ValidatedParamsT<ClassFeatureSlugParamRequest, GetClassFeatureResponse>, res: Response) {
    const feature = await classService.getClassFeatureBySlug(req.params);

    if (!feature) {
        res.status(404).json({ error: 'Class feature not found' });
        return;
    }

    res.json(feature);
}

/**
 * Creates a new class feature.
 */
export async function CreateClassFeature(req: ValidatedBodyT<CreateClassFeatureRequest, CreateResponse>, res: Response) {
    const result = await classService.createClassFeature(req.body);
    res.status(201).json(result);
}

/**
 * Updates an existing class feature.
 */
export async function UpdateClassFeature(req: ValidatedParamsBodyT<ClassFeatureSlugParamRequest, UpdateClassFeatureRequest, UpdateResponse>, res: Response) {
    const result = await classService.updateClassFeature(req.params, req.body);
    res.json(result);
}

/**
 * Deletes a class feature.
 */
export async function DeleteClassFeature(req: ValidatedParamsT<ClassFeatureSlugParamRequest, UpdateResponse>, res: Response) {
    const result = await classService.deleteClassFeature(req.params);
    res.json(result);
}
