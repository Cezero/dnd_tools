import { z } from 'zod';

import { numericParam, commonValidations } from './common.js';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';
import { CreateFeatureRequestSchema, FeatureResponseSchema } from './feature.js';

export const DomainIdParamSchema = z.object({
    id: numericParam(),
});

export const DomainSpellSchema = z.object({
    id: commonValidations.positiveInt('Domain spell ID'),
    domainId: commonValidations.positiveInt('Domain ID'),
    spellId: commonValidations.positiveInt('Spell ID'),
    spellLevel: z.number().int().min(1, 'Spell level must be at least 1').max(9, 'Spell level must be at most 9'),
    // spellName and spellSummary removed - frontend should resolve from spells-cache
});

// LocalDeitySummarySchema removed - use deityIds array instead
// Frontend should resolve deity names from deities-cache

export const BaseDomainSchema = z.object({
    name: commonValidations.name(200),
    editionId: commonValidations.positiveInt('Edition ID'),
    isVisible: z.boolean().default(true),
    domainSpells: z.array(DomainSpellSchema).nullable(),
    deityIds: z.array(commonValidations.positiveInt()).nullable(),
    sourceBookInfo: z.array(SourceMapSchema).nullable(),
    features: z.array(FeatureResponseSchema).nullable(),
});

export const DomainSchema = BaseDomainSchema.extend({
    id: commonValidations.positiveInt('Domain ID'),
});

export const DomainSummarySchema = DomainSchema.omit({
    domainSpells: true,
    deityIds: true,
    features: true,
});

export const DomainCacheSchema = DomainSummarySchema.omit({
    sourceBookInfo: true,
});

export const DomainCacheResponseSchema = QueryResponseSchema.extend({
    results: z.array(DomainCacheSchema),
});

export const DomainInQueryResponseSchema = DomainSummarySchema;

export const GetAllDomainsResponseSchema = QueryResponseSchema.extend({
    results: z.array(DomainInQueryResponseSchema),
});

export const CreateDomainSpellSchema = z.object({
    spellId: commonValidations.positiveInt('Spell ID'),
    spellLevel: z.number().int().min(1, 'Spell level must be at least 1').max(9, 'Spell level must be at most 9'),
});

export const CreateDomainSchema = BaseDomainSchema.omit({
    domainSpells: true,
    deityIds: true,
    features: true,
}).extend({
    domainSpells: z.array(CreateDomainSpellSchema).nullable(),
    deityIds: z.array(commonValidations.positiveInt()).nullable(),
    features: z.array(CreateFeatureRequestSchema).nullable(),
});

export const UpdateDomainSchema = CreateDomainSchema.omit({
    features: true,
}).extend({
    features: z.array(CreateFeatureRequestSchema).nullable(),
}).partial();

export type DomainIdParamRequest = z.infer<typeof DomainIdParamSchema>;
export type DomainInQueryResponse = z.infer<typeof DomainInQueryResponseSchema>;
export type CreateDomainRequest = z.infer<typeof CreateDomainSchema>;
export type UpdateDomainRequest = z.infer<typeof UpdateDomainSchema>;
export type CreateDomainSpellRequest = z.infer<typeof CreateDomainSpellSchema>;

export type GetAllDomainsResponse = z.infer<typeof GetAllDomainsResponseSchema>;
export type Domain = z.infer<typeof DomainSchema>;
export type DomainSpell = z.infer<typeof DomainSpellSchema>;
export type DomainSummary = z.infer<typeof DomainSummarySchema>;

export type DomainCacheResponse = z.infer<typeof DomainCacheResponseSchema>;
export type DomainCacheEntry = z.infer<typeof DomainCacheSchema>;
