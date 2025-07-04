import { z } from 'zod';

import { typedApi } from '@/services/Api';
import {
    ClassQuerySchema,
    ClassIdParamSchema,
    CreateClassSchema,
    UpdateClassSchema,
    ClassQueryResponseSchema,
    ClassSchema,
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
    getClassById: typedApi<undefined, typeof ClassSchema, typeof ClassIdParamSchema>({
        path: '/classes/:id',
        method: 'GET',
        paramsSchema: ClassIdParamSchema,
        responseSchema: ClassSchema,
    }),

    // Create class
    createClass: typedApi<typeof CreateClassSchema, typeof ClassSchema>({
        path: '/classes',
        method: 'POST',
        requestSchema: CreateClassSchema,
        responseSchema: ClassSchema,
    }),

    // Update class with path parameter
    updateClass: typedApi<typeof UpdateClassSchema, typeof ClassSchema, typeof ClassIdParamSchema>({
        path: '/classes/:id',
        method: 'PUT',
        requestSchema: UpdateClassSchema,
        paramsSchema: ClassIdParamSchema,
        responseSchema: ClassSchema,
    }),

    // Delete class with path parameter
    deleteClass: typedApi<undefined, z.ZodObject<Record<string, never>>, typeof ClassIdParamSchema>({
        path: '/classes/:id',
        method: 'DELETE',
        paramsSchema: ClassIdParamSchema,
        responseSchema: z.object({}),
    }),
};
