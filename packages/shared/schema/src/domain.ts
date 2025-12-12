import { z } from 'zod';
import { QueryResponseSchema } from './query.js';
import { SourceMapSchema } from './sourcebook.js';
import { CreateFeatureProgressionSchema, FeatureProgressionSchema } from './feature.js';

export const DomainIdParamSchema = z.object({
    id: z.string().transform((val: string) => parseInt(val)),
});

export const DomainSpellSchema = z.object({
    id: z.number().int().positive('Domain spell ID must be a positive integer'),
    domainId: z.number().int().positive('Domain ID must be a positive integer'),
    spellId: z.number().int().positive('Spell ID must be a positive integer'),
    spellLevel: z.number().int().min(1, 'Spell level must be at least 1').max(9, 'Spell level must be at most 9'),
    spellName: z.string().min(1, 'Spell name is required').max(200, 'Spell name must be less than 200 characters').trim(),
    spellSummary: z.string().max(1000, 'Spell summary must be less than 1000 characters').nullable(),
});

const LocalDeitySummarySchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1).max(200),
});

export const BaseDomainSchema = z.object({
    name: z.string()
        .min(1, 'Domain name is required')
        .max(200, 'Domain name must be less than 200 characters')
        .trim(),
    editionId: z.number().int().positive('Edition ID must be a positive integer'),
    isVisible: z.boolean().default(true),
    domainSpells: z.array(DomainSpellSchema).nullable(),
    deityDomains: z.array(LocalDeitySummarySchema).nullable(),
    sourceBookInfo: z.array(SourceMapSchema).nullable(),
    features: z.array(FeatureProgressionSchema).nullable(),
});

export const DomainSchema = BaseDomainSchema.extend({
    id: z.number().int().positive('Domain ID must be a positive integer'),
});

export const DomainSummarySchema = DomainSchema.omit({
    domainSpells: true,
    deityDomains: true,
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
    spellId: z.number().int().positive('Spell ID must be a positive integer'),
    spellLevel: z.number().int().min(1, 'Spell level must be at least 1').max(9, 'Spell level must be at most 9'),
});

export const CreateDomainSchema = BaseDomainSchema.omit({
    domainSpells: true,
    deityDomains: true,
    features: true,
}).extend({
    domainSpells: z.array(CreateDomainSpellSchema).nullable(),
    features: z.array(CreateFeatureProgressionSchema).nullable(),
});

export const UpdateDomainSchema = CreateDomainSchema.omit({
    features: true,
}).extend({
    features: z.array(CreateFeatureProgressionSchema).nullable(),
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
