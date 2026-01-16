import { z } from 'zod';

import { numericParam, commonValidations } from './common.js';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';

export const SpellSchoolMapSchema = z.object({
    schoolId: z.number().int().nonnegative('School ID must be a positive integer'),
});

export const SpellSubschoolMapSchema = z.object({
    subSchoolId: z.number().int().nonnegative('Subschool ID must be a positive integer'),
});

export const SpellDescriptorMapSchema = z.object({
    descriptorId: z.number().int().nonnegative('Descriptor ID must be a positive integer'),
});

export const SpellComponentMapSchema = z.object({
    componentId: z.number().int().nonnegative('Component ID must be a positive integer'),
});

export const SpellLevelMappingSchema = z.object({
    classId: commonValidations.positiveInt('Class ID'),
    level: commonValidations.nonNegativeInt('Level', 9),
});

export const SpellSchema = z.object({
    id: commonValidations.positiveInt('Spell ID'),
    name: commonValidations.name(200),
    editionId: commonValidations.positiveInt('Edition ID'),
    baseLevel: commonValidations.nonNegativeInt('Base level', 20),
    summary: z.string().max(1000, 'Summary must be less than 1000 characters').nullable(),
    description: commonValidations.description(10000).nullable(),
    castingTime: z.string().max(200, 'Casting time must be less than 200 characters').nullable(),
    range: z.string().max(200, 'Range must be less than 200 characters').nullable(),
    rangeTypeId: commonValidations.positiveInt('Range type ID').nullable(),
    rangeValue: z.string().max(100, 'Range value must be less than 100 characters').nullable(),
    area: z.string().max(200, 'Area must be less than 200 characters').nullable(),
    duration: z.string().max(200, 'Duration must be less than 200 characters').nullable(),
    savingThrow: z.string().max(200, 'Saving throw must be less than 200 characters').nullable(),
    spellResistance: z.string().max(200, 'Spell resistance must be less than 200 characters').nullable(),
    effect: z.string().max(500, 'Effect must be less than 500 characters').nullable(),
    target: z.string().max(200, 'Target must be less than 200 characters').nullable(),
    schoolIds: z.array(SpellSchoolMapSchema).nullable(),
    subSchoolIds: z.array(SpellSubschoolMapSchema).nullable(),
    descriptorIds: z.array(SpellDescriptorMapSchema).nullable(),
    componentIds: z.array(SpellComponentMapSchema).nullable(),
    levelMapping: z.array(SpellLevelMappingSchema).nullable(),
    sourceBookInfo: z.array(SourceMapSchema).nullable(),
    isVisible: z.boolean().default(true),
});

export const GetAllSpellsResponseSchema = QueryResponseSchema.extend({
    results: z.array(SpellSchema),
});

export const SpellIdParamSchema = z.object({
    id: numericParam(),
});

export const ClassSpellListEntrySchema = z.object({
    spellId: commonValidations.positiveInt('Spell ID'),
    level: commonValidations.nonNegativeInt('Level', 9),
});

export const ClassSpellListResponseSchema = QueryResponseSchema.extend({
    results: z.array(ClassSpellListEntrySchema),
});

export const SpellClassParamSchema = z.object({
    classId: numericParam(),
    level: numericParam().optional(),
});

export const UpdateSpellSchema = SpellSchema.omit({
    id: true
}).partial();

export const GetSpellResponseSchema = SpellSchema.omit({
    id: true
});

export const SpellCacheSchema = SpellSchema.omit({
    schoolIds: true,
    subSchoolIds: true,
    descriptorIds: true,
    componentIds: true,
    sourceBookInfo: true,
    levelMapping: true,
    description: true,
    castingTime: true,
    range: true,
    rangeTypeId: true,
    rangeValue: true,
    area: true,
    duration: true,
    savingThrow: true,
    spellResistance: true,
    effect: true,
    target: true,
    // baseLevel is now included in cache for filtering by spell level
    // summary is included in cache for domain spell display and other use cases
});

export const SpellCacheResponseSchema = QueryResponseSchema.extend({
    results: z.array(SpellCacheSchema),
});

export type SpellIdParamRequest = z.infer<typeof SpellIdParamSchema>;
export type SpellClassParamRequest = z.infer<typeof SpellClassParamSchema>;
export type UpdateSpellRequest = z.infer<typeof UpdateSpellSchema>;
export type GetSpellResponse = z.infer<typeof GetSpellResponseSchema>;
export type GetAllSpellsResponse = z.infer<typeof GetAllSpellsResponseSchema>;
export type Spell = z.infer<typeof SpellSchema>;
export type SpellSchoolMap = z.infer<typeof SpellSchoolMapSchema>;
export type SpellSubschoolMap = z.infer<typeof SpellSubschoolMapSchema>;
export type SpellDescriptorMap = z.infer<typeof SpellDescriptorMapSchema>;
export type SpellComponentMap = z.infer<typeof SpellComponentMapSchema>;
export type SpellLevelMapping = z.infer<typeof SpellLevelMappingSchema>;
export type ClassSpellListEntry = z.infer<typeof ClassSpellListEntrySchema>;
export type ClassSpellListResponse = z.infer<typeof ClassSpellListResponseSchema>;

export type SpellCacheResponse = z.infer<typeof SpellCacheResponseSchema>;
export type SpellCacheEntry = z.infer<typeof SpellCacheSchema>;

// Spell selection schemas
export const CharacterSpellSelectionEntrySchema = SpellSchema.extend({
    classSpellLevel: commonValidations.nonNegativeInt('Class spell level', 9).nullable(),
    isKnown: z.boolean().default(false),
    domainId: commonValidations.positiveInt('Domain ID').nullable().optional(),
    domainName: z.string().nullable().optional(),
    domainSpellLevel: z.number().int().min(1, 'Domain spell level must be at least 1').max(9, 'Domain spell level must be at most 9').nullable().optional(),
});

export const CharacterSpellSelectionResponseSchema = QueryResponseSchema.extend({
    results: z.array(CharacterSpellSelectionEntrySchema),
    domainSpells: z.array(CharacterSpellSelectionEntrySchema).optional(),
});

export const AddSpellKnownRequestSchema = z.object({
    characterId: commonValidations.positiveInt('Character ID'),
    classId: commonValidations.positiveInt('Class ID'),
    spellId: commonValidations.positiveInt('Spell ID'),
    advancementId: commonValidations.positiveInt('Advancement ID'),
    isFreeGrant: z.boolean().default(false).optional(),
});

/**
 * Response schema for adding a spell to a character.
 * 
 * Includes:
 * - Operation status message
 * - Free spell counts (for spellbook classes)
 * 
 * **Sync Pattern**: The backend automatically updates the resolution session if one exists,
 * but does not return the resolved character in the response. The frontend should call
 * `resolution.refreshState()` after spell operations to refresh resolution state.
 * 
 * This follows the standardized pattern where database operations update the session,
 * and the frontend refreshes resolution state separately.
 * 
 * @see characterService.addSpellKnown - For implementation
 * @see useCharacterResolution.refreshState - For frontend state refresh
 */
export const AddSpellKnownResponseSchema = z.object({
    message: z.string(),
    freeSpellsUsed: z.number().int().nonnegative().optional(),
    availableFreeSpells: z.number().int().nonnegative().optional(),
    remainingFreeSpells: z.number().int().optional(),
});

export const RemoveSpellKnownRequestSchema = AddSpellKnownRequestSchema.omit({
    classId: true,
});

/**
 * Response schema for removing a spell from a character.
 * 
 * Includes:
 * - Operation status message
 * - Free spell counts (for spellbook classes, if removed spell was a free grant)
 * 
 * **Sync Pattern**: The backend automatically updates the resolution session if one exists,
 * but does not return the resolved character in the response. The frontend should call
 * `resolution.refreshState()` after spell operations to refresh resolution state.
 * 
 * This follows the standardized pattern where database operations update the session,
 * and the frontend refreshes resolution state separately.
 * 
 * @see characterService.removeSpellKnown - For implementation
 * @see useCharacterResolution.refreshState - For frontend state refresh
 */
export const RemoveSpellKnownResponseSchema = AddSpellKnownResponseSchema;

export type CharacterSpellSelectionEntry = z.infer<typeof CharacterSpellSelectionEntrySchema>;
export type CharacterSpellSelectionResponse = z.infer<typeof CharacterSpellSelectionResponseSchema>;
export type AddSpellKnownRequest = z.infer<typeof AddSpellKnownRequestSchema>;
export type AddSpellKnownResponse = z.infer<typeof AddSpellKnownResponseSchema>;
export type RemoveSpellKnownRequest = z.infer<typeof RemoveSpellKnownRequestSchema>;
export type RemoveSpellKnownResponse = z.infer<typeof RemoveSpellKnownResponseSchema>;
