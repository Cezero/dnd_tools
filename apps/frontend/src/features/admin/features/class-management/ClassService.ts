import { typedApi } from '@/services/Api';
import {
    ClassQuerySchema,
    ClassIdParamSchema,
    CreateClassSchema,
    UpdateClassSchema,
    ClassQueryResponseSchema,
    GetClassResponseSchema,
    CreateResponseSchema,
    UpdateResponseSchema,
} from '@shared/schema';

/**
 * ClassService with path parameter support
 * 
 * Usage examples:
 * 
 * // Get classes with query parameters
 * const classes = await ClassService.getClasses({ page: 1, limit: 10 });
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
export const ClassService = {
    // Get classes with query parameters
    getClasses: typedApi<typeof ClassQuerySchema, typeof ClassQueryResponseSchema>({
        path: '/classes',
        method: 'GET',
        requestSchema: ClassQuerySchema,
        responseSchema: ClassQueryResponseSchema,
    }),

    // Get class by ID with path parameter
    getClassById: typedApi<undefined, typeof GetClassResponseSchema, typeof ClassIdParamSchema>({
        path: '/classes/:id',
        method: 'GET',
        paramsSchema: ClassIdParamSchema,
        responseSchema: GetClassResponseSchema,
    }),

    // Create class
    createClass: typedApi<typeof CreateClassSchema, typeof CreateResponseSchema>({
        path: '/classes',
        method: 'POST',
        requestSchema: CreateClassSchema,
        responseSchema: CreateResponseSchema,
    }),

    // Update class with path parameter
    updateClass: typedApi<typeof UpdateClassSchema, typeof UpdateResponseSchema, typeof ClassIdParamSchema>({
        path: '/classes/:id',
        method: 'PUT',
        requestSchema: UpdateClassSchema,
        paramsSchema: ClassIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),

    // Delete class with path parameter
    deleteClass: typedApi<undefined, typeof UpdateResponseSchema, typeof ClassIdParamSchema>({
        path: '/classes/:id',
        method: 'DELETE',
        paramsSchema: ClassIdParamSchema,
        responseSchema: UpdateResponseSchema,
    }),
};
