import { typedApi } from '@/services/Api';
import {
    ClassIdParamSchema,
    CreateClassSchema,
    UpdateClassSchema,
    BaseClassSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
    GetAllClassesResponseSchema,
} from '@shared/schema';

/**
 * ClassService with path parameter support
 *
 * Usage examples:
 *
 * // Get class by ID (path parameter)
 * const class = await ClassService.getClassById(undefined, { id: 123 });
 * 
 * // Create class
 * const newClass = await ClassService.createClass({ name: "Wizard", hitDie: 6 });
 * 
 * // Update class (path parameter + body)
 * const updatedClass = await ClassService.updateClass(
 *   { name: "Updated Wizard" }, 
 *   { id: 123 }
 * );
 * 
 * // Delete class (path parameter)
 * await ClassService.deleteClass(undefined, { id: 123 });
 */
export const ClassApi = {
    getClasses: typedApi({
        path: '/classes',
        method: 'GET',
        responseSchema: GetAllClassesResponseSchema,
    }),

    getClassById: typedApi<undefined, typeof BaseClassSchema, typeof ClassIdParamSchema>({
        path: '/classes/:id',
        method: 'GET',
        paramsSchema: ClassIdParamSchema,
        responseSchema: BaseClassSchema,
    }),

    createClass: typedApi<typeof CreateClassSchema, typeof CreateResponseSchema>({
        path: '/classes',
        method: 'POST',
        requestSchema: CreateClassSchema,
        responseSchema: CreateResponseSchema,
    }),

    updateClass: typedApi<typeof UpdateClassSchema, typeof UpdateResponseSchema, typeof ClassIdParamSchema>({
        path: '/classes/:id',
        method: 'PUT',
        requestSchema: UpdateClassSchema,
        paramsSchema: ClassIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    deleteClass: typedApi<undefined, typeof UpdateResponseSchema, typeof ClassIdParamSchema>({
        path: '/classes/:id',
        method: 'DELETE',
        paramsSchema: ClassIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
};
