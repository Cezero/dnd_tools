/**
 * Parses entity path to extract entity type, ID, and field path.
 * 
 * Path format: `{entityType}:{entityId}.{fieldPath}`
 * 
 * Examples:
 * - `feature:123.name` -> entityType: 'feature', entityId: 123, fieldPath: 'name'
 * - `class:27.name` -> entityType: 'class', entityId: 27, fieldPath: 'name'
 * - `character:5.name` -> entityType: 'character', entityId: 5, fieldPath: 'name'
 * - `feature:new.name` -> entityType: 'feature', entityId: 'new', fieldPath: 'name'
 * - `feature:123.entities.0.type` -> entityType: 'feature', entityId: 123, fieldPath: 'entities.0.type'
 */
export interface ParsedEntityPath {
    entityType: 'feature' | 'class' | 'race' | 'character';
    entityId: number | 'new';
    fieldPath: string;
}

/**
 * Parses a full entity path into its components.
 * 
 * @param fullPath - The full path including entity type and ID (e.g., "feature:123.name")
 * @returns Parsed entity path components
 * @throws Error if path format is invalid
 */
export function parseEntityPath(fullPath: string): ParsedEntityPath {
    // Split by colon to get entity type and ID
    const parts = fullPath.split(':');
    
    if (parts.length < 2) {
        throw new Error(`Invalid entity path format: ${fullPath}. Expected format: {entityType}:{entityId}.{fieldPath}`);
    }
    
    const entityType = parts[0] as 'feature' | 'class' | 'race' | 'character';
    if (!['feature', 'class', 'race', 'character'].includes(entityType)) {
        throw new Error(`Invalid entity type: ${entityType}. Must be one of: feature, class, race, character`);
    }
    
    // All entities use the same format: entityType:entityId.fieldPath
    const entityIdStr = parts[1];
    const dotIndex = entityIdStr.indexOf('.');
    if (dotIndex === -1) {
        throw new Error(`Invalid entity path format: ${fullPath}. Must include field path.`);
    }
    const actualEntityId = entityIdStr.substring(0, dotIndex);
    const fieldPath = entityIdStr.substring(dotIndex + 1);
    
    // Parse entity ID
    let entityId: number | 'new';
    if (actualEntityId === 'new') {
        entityId = 'new';
    } else {
        const parsed = parseInt(actualEntityId, 10);
        if (isNaN(parsed) || parsed <= 0) {
            throw new Error(`Invalid entity ID: ${actualEntityId}. Must be "new" or a positive integer.`);
        }
        entityId = parsed;
    }
    
    if (!fieldPath || fieldPath.length === 0) {
        throw new Error(`Field path cannot be empty in: ${fullPath}`);
    }
    
    return {
        entityType,
        entityId,
        fieldPath
    };
}
