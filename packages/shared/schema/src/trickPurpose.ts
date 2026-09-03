import z from "zod";

import { commonValidations, numericParam } from "./common";
import { QueryResponseSchema } from "./query";
import { TrickSchema } from "./trick";

export const TrickPurposeSourceMapSchema = z.object({
    sourceBookId: commonValidations.positiveInt(),
    pageNumber: commonValidations.positiveInt().nullable().optional(),
});

export const TrickPurposeTrickSchema = z.object({
    id: commonValidations.positiveInt('Trick purpose trick ID'),
    purposeId: commonValidations.positiveInt('Purpose ID'),
    trickId: commonValidations.positiveInt('Trick ID'),
    timesTrained: commonValidations.positiveInt('Times trained').default(1),
});

export const TrickPurposeTrickInputSchema = z.object({
    trickId: commonValidations.positiveInt('Trick ID'),
    timesTrained: commonValidations.positiveInt('Times trained').default(1),
});

export const TrickPurposeSchema = z.object({
    id: commonValidations.positiveInt('Trick purpose ID'),
    name: commonValidations.name(),
    description: commonValidations.description(10000).nullable().optional(),
    dc: commonValidations.positiveInt('Training DC'),
    trainingWeeks: commonValidations.positiveInt('Training weeks'),
    editionId: commonValidations.positiveInt('Edition ID'),
    isVisible: z.boolean().default(true),
    replacesPurposeId: commonValidations.positiveInt('Replaces purpose ID').nullable().optional(),
});

export const TrickPurposeWithRelationsSchema = TrickPurposeSchema.extend({
    tricks: z.array(TrickPurposeTrickSchema.extend({
        trick: TrickSchema.optional(),
    })).optional(),
    sourceBookInfo: z.array(TrickPurposeSourceMapSchema).optional(),
});

export const CreateTrickPurposeSchema = TrickPurposeSchema.omit({
    id: true,
}).extend({
    tricks: z.array(TrickPurposeTrickInputSchema).optional(),
    sourceBookInfo: z.array(TrickPurposeSourceMapSchema).optional(),
});

export const UpdateTrickPurposeSchema = CreateTrickPurposeSchema.partial();

export const TrickPurposeIdParamSchema = z.object({
    id: numericParam(),
});

export const GetAllTrickPurposesResponseSchema = QueryResponseSchema.extend({
    results: z.array(TrickPurposeWithRelationsSchema),
});

export const GetTrickPurposeResponseSchema = TrickPurposeWithRelationsSchema;

export const TrickPurposeCacheSchema = TrickPurposeSchema;

export const TrickPurposeCacheResponseSchema = QueryResponseSchema.extend({
    results: z.array(TrickPurposeCacheSchema),
});

export type TrickPurpose = z.infer<typeof TrickPurposeSchema>;
export type TrickPurposeWithRelations = z.infer<typeof TrickPurposeWithRelationsSchema>;
export type TrickPurposeTrick = z.infer<typeof TrickPurposeTrickSchema>;
export type TrickPurposeTrickInput = z.infer<typeof TrickPurposeTrickInputSchema>;
export type TrickPurposeSourceMap = z.infer<typeof TrickPurposeSourceMapSchema>;
export type CreateTrickPurposeRequest = z.infer<typeof CreateTrickPurposeSchema>;
export type UpdateTrickPurposeRequest = z.infer<typeof UpdateTrickPurposeSchema>;
export type TrickPurposeIdParamRequest = z.infer<typeof TrickPurposeIdParamSchema>;
export type GetAllTrickPurposesResponse = z.infer<typeof GetAllTrickPurposesResponseSchema>;
export type GetTrickPurposeResponse = z.infer<typeof GetTrickPurposeResponseSchema>;
export type TrickPurposeCacheEntry = z.infer<typeof TrickPurposeCacheSchema>;
export type TrickPurposeCacheResponse = z.infer<typeof TrickPurposeCacheResponseSchema>;

export { CreateResponse, UpdateResponse } from './common';
