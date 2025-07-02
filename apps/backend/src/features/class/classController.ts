import { Response } from 'express';

import { ValidatedQueryT, ValidatedParamsT, ValidatedParamsBodyT, ValidatedBodyT, ValidatedNoInput } from '@/util/validated-types'
import {
    ClassIdParamRequest,
    ClassQueryRequest,ClassResponse,
    ClassQueryResponse,
    GetAllClassesResponse,
    CreateClassRequest,
    UpdateClassRequest
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
export async function GetClassById(req: ValidatedParamsT<ClassIdParamRequest, ClassResponse>, res: Response) {
    const cls = await classService.getClassById(req.params);

    if (!cls) {
        res.status(404).send('Class not found');
        return;
    }

    res.json(cls);
}

/**
 * Creates a new class.
 */
export async function CreateClass(req: ValidatedBodyT<CreateClassRequest>, res: Response) {
    const result = await classService.createClass(req.body);
    res.status(201).json(result);
}

/**
 * Updates an existing class.
 */
export async function UpdateClass(req: ValidatedParamsBodyT<ClassIdParamRequest, UpdateClassRequest>, res: Response) {
    const result = await classService.updateClass(req.params, req.body);
    res.status(200).json(result);
}

/**
 * Deletes a class.
 */
export async function DeleteClass(req: ValidatedParamsT<ClassIdParamRequest>, res: Response) {
    const result = await classService.deleteClass(req.params);
    res.json(result);
}
