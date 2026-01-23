
import { DraftApi } from '@/services/api/EntityApi';
import type { UpdateStateValueResponse } from '@shared/schema';
import { getDraftTypeIdFromName } from '@shared/static-data';

/**
 * Generic state management API client.
 *
 * Provides a unified interface for updating state values across all entity types
 * (feature, class, race, character) using path-based updates.
 *
 * **Path Format**: `{entityType}:{id}.{fieldPath}` or `{entityType}:{id}`
 *
 * Examples:
 * - `feature:123.name` - Update name field of feature 123
 * - `class:27.name` - Update name field of class 27
 * - `race:5.name` - Update name field of race 5
 * - `character:10.name` - Update name field of character 10
 * - `feature:new.name` - Update name field of new feature (id 0)
 * - `feature:123.entities.0.type` - Update nested field
 *
 * Parses fullPath into draftType, id, and path, then calls DraftApi.updateValue (PUT /drafts/update-value).
 *
 * @see StateManagementApi.updateValue - Update a value at a specific path
 */
export const StateManagementApi = {
    /**
     * Update a value at a specific path in entity state.
     *
     * Parses fullPath in the form "entityType:id.path" or "entityType:id" into draftType, id, and path.
     * Maps entityType string to DraftType via getDraftTypeIdFromName ('feature'|'class'|'race'|'character').
     * Coerces value to string | number. Calls PUT /drafts/update-value.
     *
     * @param fullPath - The full entity path (e.g., "feature:123.name", "character:5.name")
     * @param value - The new value to set (coerced to string or number)
     * @returns The updated state
     *
     * @example
     * ```typescript
     * const result = await StateManagementApi.updateValue('feature:123.name', 'New Feature Name');
     * ```
     */
    updateValue: async (
        fullPath: string,
        value: unknown
    ): Promise<UpdateStateValueResponse> => {
        // Parse "entityType:id" or "entityType:id.path"
        const colon = fullPath.indexOf(':');
        if (colon === -1) {
            throw new Error(`StateManagementApi.updateValue: invalid fullPath "${fullPath}", expected "entityType:id" or "entityType:id.path"`);
        }
        const entityType = fullPath.substring(0, colon).toLowerCase();
        const rest = fullPath.substring(colon + 1);
        const dot = rest.indexOf('.');
        const idStr = dot === -1 ? rest : rest.substring(0, dot);
        const path = dot === -1 ? '' : rest.substring(dot + 1);

        const draftType = getDraftTypeIdFromName(entityType);
        if (draftType === undefined) {
            throw new Error(`StateManagementApi.updateValue: unknown entityType "${entityType}" in fullPath "${fullPath}"`);
        }
        const id = idStr === 'new' ? 0 : parseInt(idStr, 10);
        if (Number.isNaN(id)) {
            throw new Error(`StateManagementApi.updateValue: invalid id "${idStr}" in fullPath "${fullPath}"`);
        }

        const safe: string | number = typeof value === 'string' || typeof value === 'number' ? value : String(value);
        return DraftApi.updateValue(draftType, id, path, safe);
    },
};
