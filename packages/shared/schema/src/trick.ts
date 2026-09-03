import z from "zod";

import { commonValidations, numericParam } from "./common";
import { QueryResponseSchema } from "./query";

export const TrickSourceMapSchema = z.object({
    sourceBookId: commonValidations.positiveInt(),
    pageNumber: commonValidations.positiveInt().nullable().optional(),
});

export const TrickSchema = z.object({
    id: commonValidations.positiveInt('Trick ID'),
    name: commonValidations.name(),
    description: commonValidations.description(10000).nullable().optional(),
    editionId: commonValidations.positiveInt('Edition ID'),
    dc: commonValidations.positiveInt('Teaching DC'),
    maxTimesTrainable: commonValidations.positiveInt('Max times trainable').default(1),
    isVisible: z.boolean().default(true),
});

export const CharacterCompanionTrickSchema = z.object({
    id: commonValidations.positiveInt('Character companion trick ID'),
    characterCompanionId: commonValidations.positiveInt('Character companion ID'),
    trickId: commonValidations.positiveInt('Trick ID'),
    timesTrained: commonValidations.positiveInt('Times trained').default(1),
    isBonus: z.boolean().default(false),
    fromPurpose: z.boolean().default(false),
});

export const CharacterCompanionTrickInputSchema = z.object({
    trickId: commonValidations.positiveInt('Trick ID'),
    timesTrained: commonValidations.positiveInt('Times trained').default(1),
    isBonus: z.boolean().default(false),
});

export const TrickWithRelationsSchema = TrickSchema.extend({
    sourceBookInfo: z.array(TrickSourceMapSchema).optional(),
});

export const CreateTrickSchema = TrickSchema.omit({
    id: true,
}).extend({
    sourceBookInfo: z.array(TrickSourceMapSchema).optional(),
});

export const UpdateTrickSchema = CreateTrickSchema.partial();

export const TrickIdParamSchema = z.object({
    id: numericParam(),
});

export const GetAllTricksResponseSchema = QueryResponseSchema.extend({
    results: z.array(TrickSchema),
});

export const GetTrickResponseSchema = TrickWithRelationsSchema;

export type Trick = z.infer<typeof TrickSchema>;
export type TrickWithRelations = z.infer<typeof TrickWithRelationsSchema>;
export type TrickSourceMap = z.infer<typeof TrickSourceMapSchema>;
export type CharacterCompanionTrick = z.infer<typeof CharacterCompanionTrickSchema>;
export type CharacterCompanionTrickInput = z.infer<typeof CharacterCompanionTrickInputSchema>;
export type CreateTrickRequest = z.infer<typeof CreateTrickSchema>;
export type UpdateTrickRequest = z.infer<typeof UpdateTrickSchema>;
export type TrickIdParamRequest = z.infer<typeof TrickIdParamSchema>;
export type GetAllTricksResponse = z.infer<typeof GetAllTricksResponseSchema>;
export type GetTrickResponse = z.infer<typeof GetTrickResponseSchema>;

export { CreateResponse, UpdateResponse } from './common';
