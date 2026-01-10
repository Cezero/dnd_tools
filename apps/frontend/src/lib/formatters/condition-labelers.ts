import type { CalculatedEntity } from './types';

/**
 * Condition labeler interface - simple function that takes formatted values and returns labeled condition
 */
export interface ConditionLabeler {
    (formattedValues: string, entity?: CalculatedEntity): string;
}

/**
 * Material condition labeler
 */
export function materialConditionLabeler(formattedValues: string, _entity?: CalculatedEntity): string {
    return `related to ${formattedValues}`;
}

/**
 * Source condition labeler
 */
export function sourceConditionLabeler(formattedValues: string, _entity?: CalculatedEntity): string {
    return `vs ${formattedValues}`;
}

/**
 * Size condition labeler
 */
export function sizeConditionLabeler(formattedValues: string, _entity?: CalculatedEntity): string {
    return `${formattedValues}:`;
}

/**
 * Creature type condition labeler
 */
export function creatureTypeConditionLabeler(formattedValues: string, _entity?: CalculatedEntity): string {
    return `vs ${formattedValues}`;
}

/**
 * Spell school condition labeler
 */
export function spellSchoolConditionLabeler(formattedValues: string, _entity?: CalculatedEntity): string {
    return `vs ${formattedValues}`;
}

/**
 * Attack type condition labeler
 */
export function attackTypeConditionLabeler(formattedValues: string, _entity?: CalculatedEntity): string {
    return `${formattedValues}`;
}

/**
 * Target condition labeler
 */
export function targetConditionLabeler(formattedValues: string, _entity?: CalculatedEntity): string {
    return `(${formattedValues})`;
}

/**
 * Environment condition labeler
 */
export function environmentConditionLabeler(formattedValues: string, _entity?: CalculatedEntity): string {
    return `in ${formattedValues}`;
}

/**
 * Spell school condition labeler for spell DC - formats as "Illusion spell" instead of "vs Illusion"
 */
export function spellSchoolSpellDCLabeler(formattedValues: string, _entity?: CalculatedEntity): string {
    return `${formattedValues} spell`;
}

/**
 * Lighting condition labeler
 */
export function lightingConditionLabeler(formattedValues: string, _entity?: CalculatedEntity): string {
    return `in ${formattedValues}`;
}

/**
 * Special condition labeler
 */
export function specialConditionLabeler(formattedValues: string, _entity?: CalculatedEntity): string {
    return `when ${formattedValues}`;
}
