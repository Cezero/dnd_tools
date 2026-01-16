/**
 * Spell Formatting Utilities
 *
 * This module provides centralized spell formatting functions for the frontend.
 *
 * **Architecture Decision**: These formatters were consolidated from multiple
 * locations (static-data, spellcastingUtils, characterPdfService) into this
 * single module. Presentation formatting belongs in the frontend formatting
 * system, not in the shared static-data package. The backend does not need
 * to format spell data for display.
 *
 * @see packages/shared/docs/formatting-system/architecture-decisions.md
 * @module lib/formatters/spell-formatters
 */

import {
    SPELL_COMPONENT_MAP,
    SPELL_DESCRIPTOR_MAP,
    SPELL_SCHOOL_MAP,
    SPELL_SUBSCHOOL_MAP
} from '@shared/static-data';

import type { SpellLike, SpellFormatOptions } from './types';

// Re-export types for convenience
export type { SpellLike, SpellFormatOptions };

/**
 * Type guard to check if an object is a spell-like object (has schoolIds property)
 */
function isSpellLike(obj: unknown): obj is SpellLike {
    return typeof obj === 'object' && obj !== null && 'schoolIds' in obj;
}

/**
 * Format spell school and subschool
 *
 * Supports both Spell objects and raw ID arrays for flexibility.
 *
 * @param schoolIds - Array of school ID objects or Spell object
 * @param subSchoolIds - Array of subschool ID objects (optional, ignored if first param is Spell)
 * @param options - Formatting options
 * @returns Formatted school string, optionally with subschool in brackets
 *
 * @example
 * // Using Spell object
 * formatSpellSchool(spell) // "Conj [Summon]"
 * formatSpellSchool(spell, { useAbbreviation: false }) // "Conjuration [Summoning]"
 *
 * @example
 * // Using ID arrays
 * formatSpellSchool(spell.schoolIds, spell.subSchoolIds) // "Conj [Summon]"
 */
export function formatSpellSchool(
    schoolIdsOrSpell: Array<{ schoolId: number }> | SpellLike | null | undefined,
    subSchoolIdsOrOptions?: Array<{ subSchoolId: number }> | SpellFormatOptions | null | undefined,
    options?: SpellFormatOptions
): string {
    // Determine if first argument is a Spell object or ID array
    let schoolIds: Array<{ schoolId: number }> | null | undefined;
    let subSchoolIds: Array<{ subSchoolId: number }> | null | undefined;
    let formatOptions: SpellFormatOptions;

    if (schoolIdsOrSpell && isSpellLike(schoolIdsOrSpell)) {
        // First argument is a Spell-like object
        const spell = schoolIdsOrSpell;
        schoolIds = spell.schoolIds;
        subSchoolIds = spell.subSchoolIds;
        formatOptions = (subSchoolIdsOrOptions as SpellFormatOptions) ?? {};
    } else {
        // First argument is an ID array
        schoolIds = schoolIdsOrSpell as Array<{ schoolId: number }> | null | undefined;
        subSchoolIds = subSchoolIdsOrOptions as Array<{ subSchoolId: number }> | null | undefined;
        formatOptions = options ?? {};
    }

    const { useAbbreviation = true, includeBrackets = true } = formatOptions;

    const schools = schoolIds?.map(s => {
        const school = SPELL_SCHOOL_MAP[s.schoolId as keyof typeof SPELL_SCHOOL_MAP];
        return useAbbreviation ? (school?.abbreviation ?? '') : (school?.name ?? '');
    }).filter(Boolean).join(', ') ?? '';

    const subschools = subSchoolIds?.map(s => {
        const subschool = SPELL_SUBSCHOOL_MAP[s.subSchoolId as keyof typeof SPELL_SUBSCHOOL_MAP];
        return useAbbreviation ? (subschool?.abbreviation ?? '') : (subschool?.name ?? '');
    }).filter(Boolean);

    if (includeBrackets && subschools && subschools.length > 0) {
        return `${schools} [${subschools.join(', ')}]`;
    } else if (!includeBrackets && subschools && subschools.length > 0) {
        return `${schools} (${subschools.join(', ')})`;
    }
    return schools;
}

/**
 * Format spell components
 *
 * @param componentIds - Array of component ID objects or Spell object
 * @param options - Formatting options
 * @returns Comma-separated string of component names or abbreviations
 *
 * @example
 * formatSpellComponents(spell) // "V, S, M"
 * formatSpellComponents(spell, { useAbbreviation: false }) // "Verbal, Somatic, Material"
 */
export function formatSpellComponents(
    componentIdsOrSpell: Array<{ componentId: number }> | SpellLike | null | undefined,
    options?: SpellFormatOptions
): string {
    let componentIds: Array<{ componentId: number }> | null | undefined;

    if (componentIdsOrSpell && isSpellLike(componentIdsOrSpell)) {
        // First argument is a Spell-like object
        componentIds = componentIdsOrSpell.componentIds;
    } else {
        componentIds = componentIdsOrSpell as Array<{ componentId: number }> | null | undefined;
    }

    if (!componentIds || componentIds.length === 0) return '';

    const { useAbbreviation = true } = options ?? {};

    return componentIds.map(c => {
        const component = SPELL_COMPONENT_MAP[c.componentId as keyof typeof SPELL_COMPONENT_MAP];
        return useAbbreviation ? (component?.abbreviation ?? '') : (component?.name ?? '');
    }).filter(Boolean).join(', ');
}

/**
 * Format spell descriptors
 *
 * @param descriptorIds - Array of descriptor ID objects or Spell object
 * @param options - Formatting options (useAbbreviation has no effect - descriptors only have names)
 * @returns Comma-separated string of descriptor names
 *
 * @example
 * formatSpellDescriptors(spell) // "Fire, Light"
 */
export function formatSpellDescriptors(
    descriptorIdsOrSpell: Array<{ descriptorId: number }> | SpellLike | null | undefined,
    _options?: SpellFormatOptions
): string {
    let descriptorIds: Array<{ descriptorId: number }> | null | undefined;

    if (descriptorIdsOrSpell && isSpellLike(descriptorIdsOrSpell)) {
        // First argument is a Spell-like object
        descriptorIds = descriptorIdsOrSpell.descriptorIds;
    } else {
        descriptorIds = descriptorIdsOrSpell as Array<{ descriptorId: number }> | null | undefined;
    }

    if (!descriptorIds || descriptorIds.length === 0) return '';

    return descriptorIds.map(d => {
        const descriptor = SPELL_DESCRIPTOR_MAP[d.descriptorId as keyof typeof SPELL_DESCRIPTOR_MAP];
        return descriptor?.name ?? '';
    }).filter(Boolean).join(', ');
}

