import z from "zod";

import { commonValidations, numericParam } from "./common";
import { CompanionComputedStatBlockSchema } from "./companion";
import { QueryResponseSchema } from "./query";

export const CharacterSelectedFormSchema = z.object({
    id: commonValidations.positiveInt('Selected form ID'),
    characterId: commonValidations.positiveInt('Character ID'),
    featureId: commonValidations.positiveInt('Feature ID'),
    monsterId: commonValidations.positiveInt('Monster ID'),
    sortOrder: z.number().int().min(0).default(0),
});

/**
 * Draft-safe selected wild-shape form. IDs may be 0 or negative while unsaved.
 */
export const CharacterSelectedFormDraftSchema = CharacterSelectedFormSchema.omit({
    id: true,
    characterId: true,
}).extend({
    id: z.number().int(),
    characterId: z.number().int(),
});

export const CreateCharacterSelectedFormSchema = CharacterSelectedFormSchema.omit({
    id: true,
});

export const UpdateCharacterSelectedFormSchema = z.object({
    sortOrder: z.number().int().min(0).optional(),
    monsterId: commonValidations.positiveInt('Monster ID').optional(),
    featureId: commonValidations.positiveInt('Feature ID').optional(),
});

export const CharacterSelectedFormIdParamSchema = z.object({
    id: numericParam(),
});

export const CharacterSelectedFormCharacterIdParamSchema = z.object({
    characterId: numericParam(),
});

export const EligibleFormsQuerySchema = z.object({
    featureId: numericParam(),
});

export const EligibleFormSchema = z.object({
    monsterId: commonValidations.positiveInt('Monster ID'),
    name: z.string().min(1),
    sizeId: z.number().int().nullable(),
    typeIds: z.array(z.number().int().nonnegative()),
    hitDiceQty: z.number().nullable(),
    hitDiceType: z.number().int().nullable(),
});

export const GetEligibleFormsResponseSchema = QueryResponseSchema.extend({
    results: z.array(EligibleFormSchema),
});

export const GetAllCharacterSelectedFormsResponseSchema = QueryResponseSchema.extend({
    results: z.array(CharacterSelectedFormSchema),
});

export const WildShapeNotesSchema = z.object({
    gearMelded: z.boolean(),
    hpUnchangedByConstitution: z.boolean(),
    spellcastingSpeechRequired: z.boolean(),
    spellcastingHandsRequired: z.boolean(),
    isElementalForm: z.boolean(),
});

export const ResolvedSelectedFormSchema = CharacterSelectedFormSchema.extend({
    monsterName: z.string().min(1),
    computedStatBlock: CompanionComputedStatBlockSchema,
    notes: WildShapeNotesSchema,
});

/**
 * Draft-safe resolved wild-shape form. IDs may be negative while the character session is unsaved.
 */
export const ResolvedSelectedFormDraftSchema = CharacterSelectedFormDraftSchema.extend({
    monsterName: z.string().min(1),
    computedStatBlock: CompanionComputedStatBlockSchema,
    notes: WildShapeNotesSchema,
});

export const GetResolvedSelectedFormsResponseSchema = QueryResponseSchema.extend({
    results: z.array(ResolvedSelectedFormSchema),
});

export type CharacterSelectedForm = z.infer<typeof CharacterSelectedFormSchema>;
export type CharacterSelectedFormDraft = z.infer<typeof CharacterSelectedFormDraftSchema>;
export type CreateCharacterSelectedFormRequest = z.infer<typeof CreateCharacterSelectedFormSchema>;
export type UpdateCharacterSelectedFormRequest = z.infer<typeof UpdateCharacterSelectedFormSchema>;
export type CharacterSelectedFormIdParamRequest = z.infer<typeof CharacterSelectedFormIdParamSchema>;
export type CharacterSelectedFormCharacterIdParamRequest = z.infer<typeof CharacterSelectedFormCharacterIdParamSchema>;
export type EligibleFormsQueryRequest = z.infer<typeof EligibleFormsQuerySchema>;
export type EligibleForm = z.infer<typeof EligibleFormSchema>;
export type GetEligibleFormsResponse = z.infer<typeof GetEligibleFormsResponseSchema>;
export type GetAllCharacterSelectedFormsResponse = z.infer<typeof GetAllCharacterSelectedFormsResponseSchema>;
export type WildShapeNotes = z.infer<typeof WildShapeNotesSchema>;
export type ResolvedSelectedForm = z.infer<typeof ResolvedSelectedFormSchema>;
export type ResolvedSelectedFormDraft = z.infer<typeof ResolvedSelectedFormDraftSchema>;
export type GetResolvedSelectedFormsResponse = z.infer<typeof GetResolvedSelectedFormsResponseSchema>;

export { CreateResponse, UpdateResponse } from './common';
