import { z } from 'zod';

import { commonValidations } from './common.js';
import { FeatureWithRelationsSchema, FeatureEntitySchema } from './feature.js';
import { SpellcastingProgressionWithSlotsSchema } from './spellcasting.js';
import { BaseClassSchema, ClassSummarySchema } from './class.js';
import { SourceMapSchema } from './sourcebook.js';
import { ClassUpdateType } from '@shared/static-data';

// Class Update Schema - discriminated union for all update operations
// Note: Features are now managed independently via feature state system.
// Class updates only handle feature linking/unlinking and class-specific fields.
export const ClassUpdateSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal(ClassUpdateType.LinkFeature),
        payload: z.object({
            featureId: commonValidations.positiveInt(),
        }),
    }),
    z.object({
        type: z.literal(ClassUpdateType.UnlinkFeature),
        payload: z.object({
            featureId: commonValidations.positiveInt(),
        }),
    }),
    z.object({
        type: z.literal(ClassUpdateType.UpdateClassField),
        payload: z.object({
            field: z.string(),
            value: z.any(),
        }),
    }),
    z.object({
        type: z.literal(ClassUpdateType.SetSpellcastingProgression),
        payload: z.object({
            progression: z.array(SpellcastingProgressionWithSlotsSchema),
        }),
    }),
    z.object({
        type: z.literal(ClassUpdateType.SetSpellsKnownProgression),
        payload: z.object({
            progression: z.array(SpellcastingProgressionWithSlotsSchema),
        }),
    }),
]);

// Route parameter schemas
export const ClassResolutionClassIdParamSchema = z.object({
    classId: z.string().regex(/^\d+$/),
});

// Body schema for applying updates
export const ApplyClassUpdateBodySchema = z.object({
    update: ClassUpdateSchema,
});

// Class Edit State Schema
export const ClassEditStateSchema = z.object({
    classId: z.number().int().nullable(),
    name: z.string(),
    abbreviation: z.string(),
    editionId: commonValidations.positiveInt(),
    isPrestige: z.boolean(),
    isVisible: z.boolean(),
    canCastSpells: z.boolean(),
    spellsKnown: z.boolean(),
    isDivine: z.boolean(),
    description: z.string().nullable(),
    sourceBookInfo: z.array(SourceMapSchema).nullable(),
    featureIds: z.array(z.number().int()),
    spellcastingProgression: z.array(SpellcastingProgressionWithSlotsSchema),
    spellsKnownProgression: z.array(SpellcastingProgressionWithSlotsSchema),
});

// Response schemas
export const StartClassEditingResponseSchema = z.object({
    classState: ClassEditStateSchema,
});

export const GetClassStateResponseSchema = z.object({
    classState: ClassEditStateSchema,
});

export const ApplyClassUpdateResponseSchema = z.object({
    classState: ClassEditStateSchema,
});

export const SaveClassStateResponseSchema = z.object({
    class: ClassSummarySchema,
});

export const CancelClassEditingResponseSchema = z.object({
    success: z.boolean(),
});

// Schema for class entity with ID (used in resolution system)
// Extends BaseClassSchema with id field for cases where ID is needed
export const ClassWithIdSchema = BaseClassSchema.extend({
    id: commonValidations.positiveInt('Class ID'),
});

// TypeScript type exports
export type ClassUpdate = z.infer<typeof ClassUpdateSchema>;
export type ClassResolutionClassIdParamRequest = z.infer<typeof ClassResolutionClassIdParamSchema>;
export type ApplyClassUpdateBodyRequest = z.infer<typeof ApplyClassUpdateBodySchema>;
export type ClassEditState = z.infer<typeof ClassEditStateSchema>;
export type ClassWithId = z.infer<typeof ClassWithIdSchema>;
export type StartClassEditingResponse = z.infer<typeof StartClassEditingResponseSchema>;
export type GetClassStateResponse = z.infer<typeof GetClassStateResponseSchema>;
export type ApplyClassUpdateResponse = z.infer<typeof ApplyClassUpdateResponseSchema>;
export type SaveClassStateResponse = z.infer<typeof SaveClassStateResponseSchema>;
export type CancelClassEditingResponse = z.infer<typeof CancelClassEditingResponseSchema>;
