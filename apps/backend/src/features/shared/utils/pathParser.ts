import { DraftAction, DraftType, DRAFT_ARRAY_SELECTOR_KEY_FIELD_MAP, EntityAppliesToType, EntityType, FeaturePrerequisiteType } from '@shared/static-data';

import type { JsonObject } from './types';

interface ApplyDraftActionResult {
    updated: JsonObject;
    id?: number;
}

interface ApplyDraftActionOptions {
    draftType: DraftType;
    draftId: number;
}

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

function parsePathWithNegativeNumbers(path: string): Array<string | number> {
    if (!path || typeof path !== 'string') {
        throw new Error('Path must be a non-empty string');
    }

    const segments: Array<string | number> = [];
    const parts = path.split('.');

    for (const part of parts) {
        if (!part) {
            throw new Error(`Invalid path: empty segment in "${path}"`);
        }

        // Allow negative integers for byId selectors (draft temp IDs are negative)
        const numericValue = parseInt(part, 10);
        if (!isNaN(numericValue) && numericValue.toString() === part) {
            segments.push(numericValue);
            continue;
        }

        if (!isValidPathSegment(part)) {
            throw new Error(`Invalid path segment: "${part}" contains invalid characters`);
        }
        segments.push(part);
    }

    return segments;
}

function deepCloneJsonObject(obj: JsonObject): JsonObject {
    return JSON.parse(JSON.stringify(obj)) as JsonObject;
}

/**
 * Nested collections are selected with `.byId.<id>`, so the missing parent must be an array.
 */
function shouldCreateArrayForNextSegment(nextSegment: string | number | undefined): boolean {
    return typeof nextSegment === 'number' || nextSegment === 'byId';
}

function resolveSelectorKeyField(arrayFieldName: string | null): string {
    if (!arrayFieldName) {
        return 'id';
    }
    return DRAFT_ARRAY_SELECTOR_KEY_FIELD_MAP[arrayFieldName] ?? 'id';
}

function createNextTempId(existing: unknown[], keyField: string): number {
    let minId = 0;
    for (const el of existing) {
        if (el && typeof el === 'object' && !Array.isArray(el)) {
            const idVal = (el as Record<string, unknown>)[keyField];
            if (typeof idVal === 'number' && Number.isInteger(idVal)) {
                if (idVal <= minId) {
                    minId = idVal;
                }
            }
        }
    }
    return minId <= 0 ? minId - 1 : -1;
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
    const result = deepCloneJsonObject(obj);

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
                current[segment] = shouldCreateArrayForNextSegment(nextSegment) ? [] : {};
            }
            
            current = (current as unknown[])[segment];
        } else {
            // Object property
            if (current === null || current === undefined || typeof current !== 'object' || Array.isArray(current)) {
                // Create new object
                const parent = current as Record<string, unknown> | null;
                if (parent && typeof segment === 'string') {
                    parent[segment] = shouldCreateArrayForNextSegment(nextSegment) ? [] : ({} as JsonObject);
                    current = parent[segment];
                } else {
                    throw new Error(`Cannot access property "${segment}" on non-object at path "${segments.slice(0, i + 1).join('.')}"`);
                }
            } else {
                const objCurrent = current as Record<string, unknown>;
                if (!(segment in objCurrent) || objCurrent[segment] === null || objCurrent[segment] === undefined) {
                    // Create appropriate type for next segment
                    objCurrent[segment] = shouldCreateArrayForNextSegment(nextSegment) ? [] : ({} as JsonObject);
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

/**
 * Applies a DraftAction at a path, supporting both index-based and selector-based paths.
 *
 * Selector syntax (preferred when stable keys exist):
 * - `someArray.byId.<value>` selects the array element where keyField === value
 * - keyField defaults to `id`, but can be overridden per array field name via
 *   `DRAFT_ARRAY_SELECTOR_KEY_FIELD_MAP` (e.g. sourceBookInfo -> sourceBookId)
 *
 * Notes:
 * - Index segments remain supported for Zod error paths (e.g. entities.0.appliesTo)
 * - Draft temp IDs are negative integers; byId selectors accept negative IDs.
 *
 * @param obj - Draft JSON object
 * @param path - Dot path including optional selectors
 * @param value - Scalar value used by the action
 * @param action - DraftAction
 */
export function applyDraftActionAtPath(
    obj: JsonObject,
    path: string,
    value: string | number | boolean | null,
    action: DraftAction,
    options: ApplyDraftActionOptions
): ApplyDraftActionResult {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        throw new Error('Object must be a plain object (not array or null)');
    }
    if (!path || typeof path !== 'string') {
        throw new Error('Path must be a non-empty string');
    }

    const segments = parsePathWithNegativeNumbers(path);
    if (segments.length === 0) {
        throw new Error('Path cannot be empty');
    }

    const result = deepCloneJsonObject(obj);

    let current: unknown = result;
    let currentArrayFieldName: string | null = null;

    // Traverse all segments, handling selectors in-line.
    // We stop when we need to apply an action at a specific parent/segment.
    for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const nextSegment = i + 1 < segments.length ? segments[i + 1] : undefined;
        const isLast = i === segments.length - 1;

        // Selector: <array>.byId.<id>
        if (segment === 'byId') {
            if (!Array.isArray(current)) {
                throw new Error(`Cannot use selector "byId" on non-array at path "${segments.slice(0, i).join('.')}"`);
            }
            if (typeof nextSegment !== 'number') {
                throw new Error(`Selector "byId" must be followed by a numeric id at path "${segments.slice(0, i + 2).join('.')}"`);
            }

            const keyField = resolveSelectorKeyField(currentArrayFieldName);
            const idToFind = nextSegment;
            const arr = current as unknown[];
            const foundIndex = arr.findIndex((el) => {
                if (!el || typeof el !== 'object' || Array.isArray(el)) return false;
                return (el as Record<string, unknown>)[keyField] === idToFind;
            });

            // If selector is the terminal expression, apply Remove to the array element.
            if (i + 2 === segments.length) {
                if (action !== DraftAction.Remove) {
                    throw new Error(`Path "${path}" ends in selector; only DraftAction.Remove is valid for removing a selected element`);
                }
                if (foundIndex === -1) {
                    return { updated: result };
                }
                (current as unknown[]).splice(foundIndex, 1);
                return { updated: result };
            }

            // If not found and action is not Remove, create element (keyed arrays like sourceBookInfo).
            if (foundIndex === -1) {
                if (action === DraftAction.Remove) {
                    throw new Error(`No element found for selector "byId.${idToFind}" at path "${segments.slice(0, i + 2).join('.')}"`);
                }
                const newObj: Record<string, unknown> = { [keyField]: idToFind };
                arr.push(newObj);
                current = newObj;
            } else {
                current = arr[foundIndex];
            }

            // Consume the id segment as well
            i += 1;
            continue;
        }

        if (typeof segment === 'number') {
            // Array index traversal
            if (!Array.isArray(current)) {
                throw new Error(`Cannot use array index "${segment}" on non-array at path "${segments.slice(0, i + 1).join('.')}"`);
            }
            if (segment < 0) {
                throw new Error(`Array index must be non-negative at path "${segments.slice(0, i + 1).join('.')}"`);
            }

            const arr = current as unknown[];

            if (isLast) {
                // Action applies to this index on its parent array
                if (action === DraftAction.Remove) {
                    if (segment < arr.length) {
                        arr.splice(segment, 1);
                    }
                    return { updated: result };
                }
                if (action === DraftAction.Update) {
                    while (arr.length <= segment) {
                        arr.push(null);
                    }
                    arr[segment] = value;
                    return { updated: result };
                }
                throw new Error(`DraftAction.Add is not supported for direct numeric index target at path "${path}"`);
            }

            // Ensure array element exists for continued traversal
            while (arr.length <= segment) {
                arr.push(null);
            }
            if (arr[segment] === null || arr[segment] === undefined) {
                arr[segment] = shouldCreateArrayForNextSegment(nextSegment) ? [] : {};
            }
            current = arr[segment];
            currentArrayFieldName = null;
            continue;
        }

        // Object property traversal
        if (current === null || current === undefined || typeof current !== 'object' || Array.isArray(current)) {
            throw new Error(`Cannot access property "${segment}" on non-object at path "${segments.slice(0, i + 1).join('.')}"`);
        }

        const objCurrent = current as Record<string, unknown>;

        if (isLast) {
            const target = objCurrent[segment];

            if (action === DraftAction.Update) {
                objCurrent[segment] = value;
                return { updated: result };
            }

            if (action === DraftAction.Remove) {
                // If target is array, try to remove value from it (primitive arrays like featureIds, or object arrays keyed by id)
                if (Array.isArray(target)) {
                    const arr = target as unknown[];
                    const keyField = resolveSelectorKeyField(segment);
                    const filtered = arr.filter((el) => {
                        if (el === value) return false;
                        if (el && typeof el === 'object' && !Array.isArray(el)) {
                            return (el as Record<string, unknown>)[keyField] !== value;
                        }
                        return true;
                    });
                    objCurrent[segment] = filtered;
                    return { updated: result };
                }

                delete objCurrent[segment];
                return { updated: result };
            }

            // DraftAction.Add at a property:
            // - if property is an array: append scalar (featureIds) or create a new object stub when value=0
            // - if property missing: create scalar or [scalar] for known array fields
            if (action === DraftAction.Add) {
                if (Array.isArray(target)) {
                    // If this is an array-of-objects and value is the sentinel 0, create a new child with temp id.
                    if (typeof value === 'number' && value === 0) {
                        const keyField = resolveSelectorKeyField(segment);
                        const tempId = createNextTempId(target as unknown[], keyField);

                        // Feature drafts: create a fully shaped FeatureEntity instead of a stub.
                        if (options.draftType === DraftType.Feature && segment === 'entities' && keyField === 'id') {
                            (target as unknown[]).push({
                                id: tempId,
                                featureId: options.draftId,
                                type: EntityType.Bonus,
                                appliesTo: EntityAppliesToType.Ability,
                                appliesToId: null,
                                appliesToSubId: null,
                                value: 0,
                                bonusType: null,
                                formulaParamsId: null,
                                groupingId: 0,
                                displayInDetail: true,
                                showFullProgression: false,
                                filterType: null,
                                conditions: [],
                                formulaParams: null,
                            });
                            return { updated: result, id: tempId };
                        }

                        // Feature drafts: create a fully shaped FeaturePrerequisite instead of a stub.
                        // FeatureDraftStateSchema requires featureId, type, appliesToId, and minValue on save.
                        if (options.draftType === DraftType.Feature && segment === 'prerequisites' && keyField === 'id') {
                            (target as unknown[]).push({
                                id: tempId,
                                featureId: options.draftId,
                                type: FeaturePrerequisiteType.SkillRanks,
                                appliesToId: null,
                                minValue: 1,
                            });
                            return { updated: result, id: tempId };
                        }

                        // Character drafts: create fully shaped stubs for FeatureEntity-style nested collections.
                        if (options.draftType === DraftType.Character && segment === 'attackDefinitions' && keyField === 'id') {
                            (target as unknown[]).push({
                                id: tempId,
                                characterId: options.draftId,
                                attackSlot: null,
                                mainHandCharacterItemId: null,
                                offHandCharacterItemId: null,
                                wieldTwoHanded: false,
                            });
                            return { updated: result, id: tempId };
                        }

                        (target as unknown[]).push({ [keyField]: tempId });
                        return { updated: result, id: tempId };
                    }

                    // CharacterItem drafts: use scalar baseItemId passed via value to create a new item.
                    if (
                        options.draftType === DraftType.Character &&
                        segment === 'characterItems' &&
                        typeof value === 'number' &&
                        Number.isInteger(value) &&
                        value > 0
                    ) {
                        const keyField = resolveSelectorKeyField(segment);
                        const tempId = createNextTempId(target as unknown[], keyField);
                        (target as unknown[]).push({
                            id: tempId,
                            characterId: options.draftId,
                            baseItemId: value,
                            name: 'New Item',
                            quantity: 1,
                            location: null,
                        });
                        return { updated: result, id: tempId };
                    }

                    // Primitive array append (featureIds)
                    if (!(target as unknown[]).includes(value)) {
                        (target as unknown[]).push(value);
                    }
                    return { updated: result };
                }

                if (target === undefined || target === null) {
                    // Known array path creation: featureIds should be [value]
                    if (segment === 'featureIds') {
                        objCurrent[segment] = [value];
                    } else {
                        objCurrent[segment] = value;
                    }
                    return { updated: result };
                }

                // Exists and is scalar: treat like Update
                objCurrent[segment] = value;
                return { updated: result };
            }

            throw new Error(`Unknown DraftAction at path "${path}"`);
        }

        // Intermediate: create if missing
        if (!(segment in objCurrent) || objCurrent[segment] === null || objCurrent[segment] === undefined) {
            objCurrent[segment] = shouldCreateArrayForNextSegment(nextSegment) ? [] : {};
        }

        current = objCurrent[segment];
        currentArrayFieldName = segment;
    }

    // Should never reach here
    return { updated: result };
}
