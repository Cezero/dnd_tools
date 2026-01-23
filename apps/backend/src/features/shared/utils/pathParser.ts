import type { JsonObject } from './types';

/**
 * Utility for parsing and updating values at paths in nested JSON objects.
 * 
 * Supports dot notation with array indices (e.g., "entities.0.type", "sourceBookInfo.editionId").
 * 
 * **Path Format**:
 * - Top-level fields: `name`, `slug`, `level`
 * - Nested fields: `sourceBookInfo.editionId`, `entities.0.formulaParams.formulaId`
 * - Array indices: `entities.0`, `prerequisites.1`, `spellcastingProgression.2.level`
 * 
 * **Path Validation**:
 * - Only allows alphanumeric characters, dots, and hyphens in field names
 * - Array indices must be non-negative integers
 * - Prevents path injection attacks
 * 
 * @example
 * ```typescript
 * const obj = { entities: [{ type: 0, value: 10 }] };
 * const updated = updateValueAtPath(obj, 'entities.0.type', 1);
 * // Result: { entities: [{ type: 1, value: 10 }] }
 * 
 * const obj2 = { name: 'Test' };
 * const updated2 = updateValueAtPath(obj2, 'sourceBookInfo.editionId', 5);
 * // Result: { name: 'Test', sourceBookInfo: { editionId: 5 } }
 * ```
 */

/**
 * Validates that a path segment is safe (alphanumeric, dots, hyphens only).
 * 
 * @param segment - Path segment to validate
 * @returns True if segment is safe
 */
function isValidPathSegment(segment: string): boolean {
    // Allow alphanumeric, dots, hyphens, and underscores
    // Array indices are handled separately
    return /^[a-zA-Z0-9._-]+$/.test(segment);
}

/**
 * Parses a path string into an array of segments.
 * 
 * @param path - Path string (e.g., "entities.0.type")
 * @returns Array of path segments
 * @throws Error if path is invalid
 */
function parsePath(path: string): Array<string | number> {
    if (!path || typeof path !== 'string') {
        throw new Error('Path must be a non-empty string');
    }

    const segments: Array<string | number> = [];
    const parts = path.split('.');

    for (const part of parts) {
        if (!part) {
            throw new Error(`Invalid path: empty segment in "${path}"`);
        }

        // Check if segment is an array index (numeric)
        const numericIndex = parseInt(part, 10);
        if (!isNaN(numericIndex) && numericIndex.toString() === part && numericIndex >= 0) {
            segments.push(numericIndex);
        } else {
            // Validate field name
            if (!isValidPathSegment(part)) {
                throw new Error(`Invalid path segment: "${part}" contains invalid characters`);
            }
            segments.push(part);
        }
    }

    return segments;
}

/**
 * Updates a value at a specific path in a JSON object.
 * Creates intermediate objects/arrays as needed.
 * 
 * This is a pure utility function that works with plain JSON objects.
 * It does not work with typed objects - only JSON (Record<string, unknown>).
 * 
 * @param obj - The JSON object to update (from Redis or similar)
 * @param path - Path to the value (e.g., "entities.0.type")
 * @param value - The new value to set (string or number only)
 * @returns A new JSON object with the updated value (does not mutate original)
 * @throws Error if path is invalid or cannot be applied
 * 
 * @example
 * ```typescript
 * // Get JSON from Redis
 * const jsonBlob = await redis.get('feature:1234');
 * const obj = JSON.parse(jsonBlob);
 * 
 * // Update value at path
 * const updated = updateValueAtPath(obj, 'entities.0.type', 3);
 * 
 * // Put updated JSON back to Redis
 * await redis.set('feature:1234', JSON.stringify(updated));
 * ```
 */
export function updateValueAtPath(
    obj: JsonObject,
    path: string,
    value: string | number
): JsonObject {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        throw new Error('Object must be a plain object (not array or null)');
    }

    const segments = parsePath(path);
    
    if (segments.length === 0) {
        throw new Error('Path cannot be empty');
    }

    // Create a deep copy to avoid mutating the original
    const result = JSON.parse(JSON.stringify(obj)) as JsonObject;

    // Navigate to the parent of the target, creating intermediate objects/arrays as needed
    let current: unknown = result;
    
    for (let i = 0; i < segments.length - 1; i++) {
        const segment = segments[i];
        const nextSegment = segments[i + 1];

        if (typeof segment === 'number') {
            // Array index
            if (!Array.isArray(current)) {
                throw new Error(`Cannot use array index "${segment}" on non-array at path "${segments.slice(0, i + 1).join('.')}"`);
            }
            
            // Ensure array is large enough
            while (current.length <= segment) {
                (current as unknown[]).push(null);
            }
            
            if (current[segment] === null || current[segment] === undefined) {
                // Create appropriate type for next segment
                if (typeof nextSegment === 'number') {
                    current[segment] = [];
                } else {
                    current[segment] = {};
                }
            }
            
            current = (current as unknown[])[segment];
        } else {
            // Object property
            if (current === null || current === undefined || typeof current !== 'object' || Array.isArray(current)) {
                // Create new object
                const parent = current as Record<string, unknown> | null;
                if (parent && typeof segment === 'string') {
                    parent[segment] = typeof nextSegment === 'number' ? [] : ({} as JsonObject);
                    current = parent[segment];
                } else {
                    throw new Error(`Cannot access property "${segment}" on non-object at path "${segments.slice(0, i + 1).join('.')}"`);
                }
            } else {
                const objCurrent = current as Record<string, unknown>;
                if (!(segment in objCurrent) || objCurrent[segment] === null || objCurrent[segment] === undefined) {
                    // Create appropriate type for next segment
                    objCurrent[segment] = typeof nextSegment === 'number' ? [] : ({} as JsonObject);
                }
                current = objCurrent[segment];
            }
        }
    }

    // Set the final value
    const finalSegment = segments[segments.length - 1];
    
    if (typeof finalSegment === 'number') {
        // Setting array element
        if (!Array.isArray(current)) {
            throw new Error(`Cannot set array index "${finalSegment}" on non-array at path "${path}"`);
        }
        // Ensure array is large enough
        while (current.length <= finalSegment) {
            (current as unknown[]).push(null);
        }
        (current as unknown[])[finalSegment] = value;
    } else {
        // Setting object property
        if (current === null || current === undefined || typeof current !== 'object' || Array.isArray(current)) {
            throw new Error(`Cannot set property "${finalSegment}" on non-object at path "${path}"`);
        }
        (current as JsonObject)[finalSegment] = value;
    }

    return result;
}
