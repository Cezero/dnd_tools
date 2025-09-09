/**
 * Condition labeler interface - simple function that takes formatted values and returns labeled condition
 */
export interface ConditionLabeler {
    (formattedValues: string): string;
}

/**
 * Material condition labeler
 */
export function materialConditionLabeler(formattedValues: string): string {
    return `related to ${formattedValues}`;
}

/**
 * Source condition labeler
 */
export function sourceConditionLabeler(formattedValues: string): string {
    return `vs ${formattedValues}`;
}

/**
 * Size condition labeler
 */
export function sizeConditionLabeler(formattedValues: string): string {
    return `${formattedValues}:`;
}

/**
 * Creature type condition labeler
 */
export function creatureTypeConditionLabeler(formattedValues: string): string {
    return `vs ${formattedValues}`;
}

/**
 * Spell school condition labeler
 */
export function spellSchoolConditionLabeler(formattedValues: string): string {
    return `vs ${formattedValues}`;
}

/**
 * Attack type condition labeler
 */
export function attackTypeConditionLabeler(formattedValues: string): string {
    return `${formattedValues}`;
}

/**
 * Target condition labeler
 */
export function targetConditionLabeler(formattedValues: string): string {
    return `(${formattedValues})`;
}

/**
 * Environment condition labeler
 */
export function environmentConditionLabeler(formattedValues: string): string {
    return `in ${formattedValues}`;
}
