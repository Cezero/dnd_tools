import { z } from 'zod';

import { commonValidations } from './common.js';
import { FeatureProgressionSchema, FeatureEntitySchema } from './feature.js';
import { SpellcastingProgressionWithSlotsSchema } from './spellcasting.js';
import { BaseClassSchema, ClassSummarySchema } from './class.js';
import { ClassUpdateType } from '@shared/static-data';

// Class Update Schema - discriminated union for all update operations
export const ClassUpdateSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal(ClassUpdateType.LinkProgression),
        payload: z.object({
            progressionId: commonValidations.positiveInt(),
            featureId: commonValidations.positiveInt(),
        }),
    }),
    z.object({
        type: z.literal(ClassUpdateType.UnlinkProgression),
        payload: z.object({
            progressionId: commonValidations.positiveInt(),
        }),
    }),
    z.object({
        type: z.literal(ClassUpdateType.AddProgression),
        payload: z.object({
            progression: FeatureProgressionSchema,
        }),
    }),
    z.object({
        type: z.literal(ClassUpdateType.UpdateProgression),
        payload: z.object({
            progressionId: commonValidations.positiveInt(),
            progression: FeatureProgressionSchema.partial(),
        }),
    }),
    z.object({
        type: z.literal(ClassUpdateType.RemoveProgression),
        payload: z.object({
            progressionId: commonValidations.positiveInt(),
        }),
    }),
    z.object({
        type: z.literal(ClassUpdateType.AddEntity),
        payload: z.object({
            progressionId: commonValidations.positiveInt(),
            entity: FeatureEntitySchema,
        }),
    }),
    z.object({
        type: z.literal(ClassUpdateType.UpdateEntity),
        payload: z.object({
            entityId: commonValidations.positiveInt(),
            entity: FeatureEntitySchema.partial(),
        }),
    }),
    z.object({
        type: z.literal(ClassUpdateType.RemoveEntity),
        payload: z.object({
            entityId: commonValidations.positiveInt(),
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

export const ClassSessionIdParamSchema = z.object({
    sessionId: z.uuid(),
});

export const ClassResolutionParamsSchema = ClassResolutionClassIdParamSchema.extend({
    sessionId: z.uuid(),
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
    featureProgressions: z.array(FeatureProgressionSchema),
    spellcastingProgression: z.array(SpellcastingProgressionWithSlotsSchema),
    spellsKnownProgression: z.array(SpellcastingProgressionWithSlotsSchema),
});

// Response schemas
export const InitializeClassSessionResponseSchema = z.object({
    sessionId: z.uuid(),
    classState: ClassEditStateSchema,
});

export const GetClassSessionStateResponseSchema = z.object({
    classState: ClassEditStateSchema,
});

export const ApplyClassUpdateResponseSchema = z.object({
    classState: ClassEditStateSchema,
});

// Schema for class entity with ID (used in resolution system)
// Extends BaseClassSchema with id field for cases where ID is needed
export const ClassWithIdSchema = BaseClassSchema.extend({
    id: commonValidations.positiveInt('Class ID'),
});

// Response schema for saving class session
export const SaveClassSessionResponseSchema = z.object({
    class: ClassSummarySchema,
});

// TypeScript type exports
export type ClassUpdate = z.infer<typeof ClassUpdateSchema>;
export type ClassResolutionClassIdParamRequest = z.infer<typeof ClassResolutionClassIdParamSchema>;
export type ClassSessionIdParamRequest = z.infer<typeof ClassSessionIdParamSchema>;
export type ClassResolutionParamsRequest = z.infer<typeof ClassResolutionParamsSchema>;
export type ApplyClassUpdateBodyRequest = z.infer<typeof ApplyClassUpdateBodySchema>;
export type ClassEditState = z.infer<typeof ClassEditStateSchema>;
export type ClassWithId = z.infer<typeof ClassWithIdSchema>;
export type InitializeClassSessionResponse = z.infer<typeof InitializeClassSessionResponseSchema>;
export type GetClassSessionStateResponse = z.infer<typeof GetClassSessionStateResponseSchema>;
export type ApplyClassUpdateResponse = z.infer<typeof ApplyClassUpdateResponseSchema>;
export type SaveClassSessionResponse = z.infer<typeof SaveClassSessionResponseSchema>;
