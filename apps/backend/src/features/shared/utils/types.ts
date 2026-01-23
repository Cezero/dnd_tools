/**
 * Represents any valid JSON value.
 */
type JsonValue = string | number | boolean | null | JsonObject | JsonArray;

/**
 * Represents a JSON object (dictionary/map).
 */
export type JsonObject = { [key: string]: JsonValue };

/**
 * Represents a JSON array.
 */
type JsonArray = JsonValue[];
