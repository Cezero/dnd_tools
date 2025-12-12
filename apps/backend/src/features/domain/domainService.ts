import { PrismaClient } from '@shared/prisma-client';
import {
    DomainIdParamRequest,
    CreateDomainRequest,
    UpdateDomainRequest,
    GetAllDomainsResponse,
    CreateResponse,
    UpdateResponse,
    Domain,
    CreateFeatureProgressionRequest,
    DomainCacheResponse,
} from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';

import type { DomainService } from './types';
import { featureSystemService } from '../featureSystem/featureSystemService';

const prisma = new PrismaClient();

export const domainService: DomainService = {
    async getAllDomains(): Promise<GetAllDomainsResponse> {
        const [domains] = await Promise.all([
            prisma.domain.findMany({
                orderBy: { name: 'asc' },
                include: {
                    sourceBookInfo: {
                        select: {
                            sourceBookId: true,
                            pageNumber: true
                        }
                    }
                }
            }),
            prisma.domain.count(),
        ]);

        return {
            total: domains.length,
            results: domains,
        };
    },


    async getDomainById(query: DomainIdParamRequest): Promise<Domain | null> {
        const domain = await prisma.domain.findUnique({
            where: { id: query.id },
            include: {
                domainSpells: {
                    include: {
                        spell: {
                            select: {
                                name: true,
                                summary: true
                            }
                        }
                    }
                },
                sourceBookInfo: {
                    select: {
                        sourceBookId: true,
                        pageNumber: true
                    }
                },
                deityDomains: {
                    select: {
                        deity: {
                            select: {
                                id: true,
                                name: true,
                            }
                        }
                    }
                }
            }
        });

        if (!domain) {
            return null;
        }

        const deities = domain.deityDomains.map(deityDomain => deityDomain.deity);

        // Transform domain spells to include spell name and summary
        const domainSpells = domain.domainSpells.map(domainSpell => ({
            ...domainSpell,
            spellName: domainSpell.spell.name,
            spellSummary: domainSpell.spell.summary
        }));

        // Get feature progressions for this domain
        const features = await featureSystemService.getFeatureProgressionsByDomainId(query.id);

        return {
            ...domain,
            domainSpells: domainSpells,
            deityDomains: deities,
            features: features,
        } as Domain;
    },

    async createDomain(data: CreateDomainRequest): Promise<CreateResponse> {
        const { domainSpells, features, ...domainData } = data;

        const result = await prisma.$transaction(async (tx) => {
            // Create the domain first
            const domainResult = await tx.domain.create({
                data: {
                    ...domainData,
                    sourceBookInfo: {
                        create: data.sourceBookInfo?.map(source => ({
                            sourceBookId: source.sourceBookId,
                            pageNumber: source.pageNumber
                        })) || []
                    }
                },
            });

            // Create domain spells
            if (domainSpells && domainSpells.length > 0) {
                await tx.domainSpell.createMany({
                    data: domainSpells.map((domainSpell) => ({
                        domainId: domainResult.id,
                        spellId: domainSpell.spellId,
                        spellLevel: domainSpell.spellLevel
                    }))
                });
            }

            // Create feature progressions using consolidated feature system service
            if (features && features.length > 0) {
                const context = { domainId: domainResult.id, sourceType: FeatureSourceType.Domain };
                await featureSystemService.createMultipleFeatureProgressions(features, context, tx);
            }

            return domainResult;
        });

        return { id: result.id.toString(), message: 'Domain created successfully' };
    },

    async updateDomain(data: UpdateDomainRequest, query: DomainIdParamRequest): Promise<UpdateResponse> {
        const { domainSpells, features, ...domainData } = data;

        await prisma.$transaction(async (tx) => {
            // Delete existing source book mappings
            await tx.domainSourceMap.deleteMany({ where: { domainId: query.id } });

            // Update the domain
            await tx.domain.update({
                where: { id: query.id },
                data: {
                    ...domainData,
                    sourceBookInfo: {
                        create: data.sourceBookInfo?.map(source => ({
                            sourceBookId: source.sourceBookId,
                            pageNumber: source.pageNumber
                        })) || []
                    }
                },
            });

            // Handle domain spells if provided
            if (domainSpells !== undefined) {
                // Delete existing domain spells
                await tx.domainSpell.deleteMany({ where: { domainId: query.id } });

                // Create new domain spells
                if (domainSpells && domainSpells.length > 0) {
                    await tx.domainSpell.createMany({
                        data: domainSpells.map((domainSpell) => ({
                            domainId: query.id,
                            spellId: domainSpell.spellId,
                            spellLevel: domainSpell.spellLevel
                        }))
                    });
                }
            }

            // Update feature progressions using delete & recreate pattern
            if (features !== undefined && features !== null) {
                // Delete existing feature progressions
                const deleteContext = { domainId: query.id, sourceType: FeatureSourceType.Domain };
                await featureSystemService.deleteFeatureProgressionsForContext(deleteContext, tx);

                // Create new feature progressions
                if (features.length > 0) {
                    const createContext = { domainId: query.id, sourceType: FeatureSourceType.Domain };
                    await featureSystemService.createMultipleFeatureProgressions(features as CreateFeatureProgressionRequest[], createContext, tx);
                }
            }
        });

        return { message: 'Domain updated successfully' };
    },

    async deleteDomain(query: DomainIdParamRequest): Promise<UpdateResponse> {
        await prisma.domain.delete({
            where: { id: query.id },
        });
        return { message: 'Domain deleted successfully' };
    },

    async getDomainCache(): Promise<DomainCacheResponse> {
        const domains = await prisma.domain.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                editionId: true,
                isVisible: true,
            }
        });

        return {
            total: domains.length,
            results: domains,
        };
    },
};
