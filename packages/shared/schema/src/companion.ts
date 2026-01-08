import z from "zod";
import { QueryResponseSchema } from "./query";
import { TrickSchema, CharacterCompanionTrickSchema } from "./trick";

// Companion Benefit Condition Schema
export const CompanionBenefitConditionSchema = z.object({
    id: z.number().int().positive('Condition ID must be a positive integer'),
    companionBenefitMapId: z.number().int().positive('Companion benefit map ID must be a positive integer'),
    conditionType: z.number().int().min(0, 'Condition type must be non-negative').max(8, 'Condition type must be at most 8'),
    conditionValue: z.number().int(),
});

// Companion Benefit Condition Create Schema (omits backend-assigned IDs)
export const CreateCompanionBenefitConditionSchema = CompanionBenefitConditionSchema.omit({
    id: true,
    companionBenefitMapId: true,
});

// Companion Benefit Map Schema
export const CompanionBenefitMapSchema = z.object({
    id: z.number().int().positive('Benefit map ID must be a positive integer'),
    companionId: z.number().int().positive('Companion ID must be a positive integer'),
    typeId: z.number().int().positive('Benefit type ID must be a positive integer').nullable(),
    referenceId: z.number().int().positive('Reference ID must be a positive integer').nullable(),
    amount: z.number().int().min(0, 'Benefit amount must be non-negative').nullable(),
    index: z.number().int().min(0, 'Benefit index must be non-negative'),
    conditions: z.array(CompanionBenefitConditionSchema).optional(),
});

// Companion Benefit Map Create Schema (omits backend-assigned IDs)
export const CreateCompanionBenefitMapSchema = CompanionBenefitMapSchema.omit({
    id: true,
    companionId: true,
}).extend({
    conditions: z.array(CreateCompanionBenefitConditionSchema).optional(),
});

// Companion Schema
export const CompanionSchema = z.object({
    id: z.number().int().positive('Companion ID must be a positive integer'),
    type: z.number().int().positive('Companion type must be a positive integer'),
    monsterId: z.number().int().positive('Monster ID must be a positive integer'),
    minLevel: z.number().int().min(1, 'Minimum level must be at least 1').max(20, 'Minimum level must be at most 20').nullable().optional(),
});

// Character Companion Schema
export const CharacterCompanionSchema = z.object({
    id: z.number().int().positive('Character companion ID must be a positive integer'),
    characterId: z.number().int().positive('Character ID must be a positive integer'),
    monsterId: z.number().int().positive('Monster ID must be a positive integer'),
    companionId: z.number().int().positive('Companion ID must be a positive integer').nullable().optional(),
    levelAcquired: z.number().int().min(1, 'Level acquired must be at least 1').max(20, 'Level acquired must be at most 20').nullable().optional(),
    hitPoints: z.number().int().positive('Hit points must be a positive integer').nullable().optional(),
    wounds: z.number().int().nonnegative('Wounds must be non-negative').default(0),
});

// Companion with relations schema
export const CompanionWithRelationsSchema = CompanionSchema.extend({
    monster: z.object({
        id: z.number().int().positive(),
        name: z.string(),
    }).optional(),
    benefits: z.array(CompanionBenefitMapSchema).optional(),
});

// Character Companion with relations schema
export const CharacterCompanionWithRelationsSchema = CharacterCompanionSchema.extend({
    monster: z.object({
        id: z.number().int().positive(),
        name: z.string(),
    }).optional(),
    companion: z.object({
        id: z.number().int().positive(),
        type: z.number().int().positive(),
        monsterId: z.number().int().positive(),
        minLevel: z.number().int().nullable().optional(),
    }).optional(),
    tricks: z.array(z.object({
        id: z.number().int().positive(),
        trickId: z.number().int().positive(),
        trick: TrickSchema.optional(),
    })).optional(),
});

// Request schemas
export const CreateCompanionSchema = CompanionSchema.omit({
    id: true,
}).extend({
    benefits: z.array(CreateCompanionBenefitMapSchema).optional(),
});

export const UpdateCompanionSchema = CreateCompanionSchema.partial();

export const CreateCharacterCompanionSchema = CharacterCompanionSchema.omit({
    id: true,
}).extend({
    tricks: z.array(z.number().int().positive('Trick ID must be a positive integer')).optional(),
});

export const UpdateCharacterCompanionSchema = CreateCharacterCompanionSchema.partial();

// Parameter schemas
export const CompanionIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const CharacterCompanionIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

// Response schemas
export const GetAllCompanionsResponseSchema = QueryResponseSchema.extend({
    results: z.array(CompanionWithRelationsSchema),
});

export const GetCompanionResponseSchema = CompanionWithRelationsSchema;

export const GetAllCharacterCompanionsResponseSchema = QueryResponseSchema.extend({
    results: z.array(CharacterCompanionWithRelationsSchema),
});

// Type exports
export type Companion = z.infer<typeof CompanionSchema>;
export type CompanionWithRelations = z.infer<typeof CompanionWithRelationsSchema>;
export type CharacterCompanion = z.infer<typeof CharacterCompanionSchema>;
export type CharacterCompanionWithRelations = z.infer<typeof CharacterCompanionWithRelationsSchema>;
export type CreateCompanionRequest = z.infer<typeof CreateCompanionSchema>;
export type UpdateCompanionRequest = z.infer<typeof UpdateCompanionSchema>;
export type CreateCharacterCompanionRequest = z.infer<typeof CreateCharacterCompanionSchema>;
export type UpdateCharacterCompanionRequest = z.infer<typeof UpdateCharacterCompanionSchema>;
export type CompanionIdParamRequest = z.infer<typeof CompanionIdParamSchema>;
export type CharacterCompanionIdParamRequest = z.infer<typeof CharacterCompanionIdParamSchema>;
export type GetAllCompanionsResponse = z.infer<typeof GetAllCompanionsResponseSchema>;
export type GetCompanionResponse = z.infer<typeof GetCompanionResponseSchema>;
export type GetAllCharacterCompanionsResponse = z.infer<typeof GetAllCharacterCompanionsResponseSchema>;
export type CompanionBenefitMap = z.infer<typeof CompanionBenefitMapSchema>;
export type CompanionBenefitCondition = z.infer<typeof CompanionBenefitConditionSchema>;
export type CreateCompanionBenefitMapRequest = z.infer<typeof CreateCompanionBenefitMapSchema>;
export type CreateCompanionBenefitConditionRequest = z.infer<typeof CreateCompanionBenefitConditionSchema>;

// Re-export common response types
export { CreateResponse, UpdateResponse } from './common';

