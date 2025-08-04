import { PrismaClient } from '@shared/prisma-client';
import {
    GetAllFeaturesResponse,
    CreateFeatureRequest,
    UpdateFeatureRequest,
    FeatureIdParamRequest,
    FeatureSlugParamRequest,
    GetFeatureResponse,
    CreateResponse,
    UpdateResponse,
    GetFeatureProgressionsResponse,
    CreateFeatureProgressionRequest,
    UpdateFeatureProgressionRequest,
    GetFeatureModifiersResponse,
    CreateFeatureModifierRequest,
    UpdateFeatureModifierRequest,
    GetFeatureChoicesResponse,
    CreateFeatureChoiceRequest,
    UpdateFeatureChoiceRequest,
    GetFeatureSpecialEffectsResponse,
    CreateFeatureSpecialEffectRequest,
    UpdateFeatureSpecialEffectRequest,
} from '@shared/schema';

import type { FeatureSystemService } from './types';

const prisma = new PrismaClient();

export const featureSystemService: FeatureSystemService = {
    // Core Feature CRUD operations
    async getAllFeatures(): Promise<GetAllFeaturesResponse> {
        const [features] = await Promise.all([
            prisma.feature.findMany({
                orderBy: { slug: 'asc' },
            }),
            prisma.feature.count(),
        ]);

        return {
            total: features.length,
            results: features,
        };
    },

    async getFeatureById(query: FeatureIdParamRequest): Promise<GetFeatureResponse | null> {
        const feature = await prisma.feature.findUnique({
            where: { id: query.id },
        });

        return feature as GetFeatureResponse;
    },

    async getFeatureBySlug(query: FeatureSlugParamRequest): Promise<GetFeatureResponse | null> {
        const feature = await prisma.feature.findUnique({
            where: { slug: query.slug },
        });

        return feature as GetFeatureResponse;
    },

    async createFeature(data: CreateFeatureRequest): Promise<CreateResponse> {
        const result = await prisma.feature.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description || '',
            },
        });

        return { id: result.slug, message: 'Feature created successfully' };
    },

    async updateFeature(query: FeatureSlugParamRequest, data: UpdateFeatureRequest): Promise<UpdateResponse> {
        await prisma.feature.update({
            where: { slug: query.slug },
            data: {
                ...data,
            },
        });

        return { message: 'Feature updated successfully' };
    },

    async deleteFeature(query: FeatureSlugParamRequest): Promise<UpdateResponse> {
        await prisma.feature.delete({
            where: { slug: query.slug },
        });

        return { message: 'Feature deleted successfully' };
    },

    // Feature Progression management (the actual linkage)
    async getFeatureProgressions(sourceType: number, sourceId: number): Promise<GetFeatureProgressionsResponse> {
        const whereClause = sourceType === 0
            ? { raceId: sourceId }
            : { classId: sourceId };

        const [progressions] = await Promise.all([
            prisma.featureProgression.findMany({
                where: whereClause,
                include: {
                    feature: true,
                    modifiers: true,
                    choices: true,
                    effects: true,
                },
                orderBy: { level: 'asc' },
            }),
            prisma.featureProgression.count({
                where: whereClause,
            }),
        ]);

        return {
            total: progressions.length,
            results: progressions.map(progression => ({
                ...progression,
                raceId: progression.raceId ?? undefined,
                classId: progression.classId ?? undefined,
                appliesToType: progression.appliesToType ?? undefined,
                appliesTo: progression.appliesTo ?? undefined,
                modifiers: progression.modifiers?.map(modifier => ({
                    ...modifier,
                    appliesIfChoiceKey: modifier.appliesIfChoiceKey ?? undefined,
                    appliesIfChoiceValue: modifier.appliesIfChoiceValue ?? undefined,
                })),
                effects: progression.effects?.map(effect => ({
                    ...effect,
                    value: effect.value ?? undefined,
                    key: effect.key ?? undefined,
                    numericValue: effect.numericValue ?? undefined,
                })),
            })),
        };
    },

    async createFeatureProgression(data: CreateFeatureProgressionRequest): Promise<CreateResponse> {
        const result = await prisma.featureProgression.create({
            data: {
                ...data,
            },
        });

        return { id: result.id.toString(), message: 'Feature progression created successfully' };
    },

    async updateFeatureProgression(id: number, data: UpdateFeatureProgressionRequest): Promise<UpdateResponse> {
        await prisma.featureProgression.update({
            where: { id },
            data: {
                ...data,
            },
        });

        return { message: 'Feature progression updated successfully' };
    },

    async deleteFeatureProgression(id: number): Promise<UpdateResponse> {
        await prisma.featureProgression.delete({
            where: { id },
        });

        return { message: 'Feature progression deleted successfully' };
    },

    // Feature Modifiers and effects
    async getFeatureModifiers(progressionId: number): Promise<GetFeatureModifiersResponse> {
        const [modifiers] = await Promise.all([
            prisma.featureModifier.findMany({
                where: { featureProgressionId: progressionId },
                orderBy: { id: 'asc' },
            }),
            prisma.featureModifier.count({
                where: { featureProgressionId: progressionId },
            }),
        ]);

        return {
            total: modifiers.length,
            results: modifiers.map(modifier => ({
                ...modifier,
                appliesIfChoiceKey: modifier.appliesIfChoiceKey ?? undefined,
                appliesIfChoiceValue: modifier.appliesIfChoiceValue ?? undefined,
            })),
        };
    },

    async createFeatureModifier(data: CreateFeatureModifierRequest): Promise<CreateResponse> {
        const result = await prisma.featureModifier.create({
            data: {
                ...data,
            },
        });

        return { id: result.id.toString(), message: 'Feature modifier created successfully' };
    },

    async updateFeatureModifier(id: number, data: UpdateFeatureModifierRequest): Promise<UpdateResponse> {
        await prisma.featureModifier.update({
            where: { id },
            data: {
                ...data,
            },
        });

        return { message: 'Feature modifier updated successfully' };
    },

    async deleteFeatureModifier(id: number): Promise<UpdateResponse> {
        await prisma.featureModifier.delete({
            where: { id },
        });

        return { message: 'Feature modifier deleted successfully' };
    },

    // Feature Choices
    async getFeatureChoices(progressionId: number): Promise<GetFeatureChoicesResponse> {
        const [choices] = await Promise.all([
            prisma.featureChoice.findMany({
                where: { progressionId },
                include: {
                    feat: true,
                    feature: true,
                },
                orderBy: { id: 'asc' },
            }),
            prisma.featureChoice.count({
                where: { progressionId },
            }),
        ]);

        return {
            total: choices.length,
            results: choices,
        };
    },

    async createFeatureChoice(data: CreateFeatureChoiceRequest): Promise<CreateResponse> {
        const result = await prisma.featureChoice.create({
            data: {
                ...data,
            },
        });

        return { id: result.id.toString(), message: 'Feature choice created successfully' };
    },

    async updateFeatureChoice(id: number, data: UpdateFeatureChoiceRequest): Promise<UpdateResponse> {
        await prisma.featureChoice.update({
            where: { id },
            data: {
                ...data,
            },
        });

        return { message: 'Feature choice updated successfully' };
    },

    async deleteFeatureChoice(id: number): Promise<UpdateResponse> {
        await prisma.featureChoice.delete({
            where: { id },
        });

        return { message: 'Feature choice deleted successfully' };
    },

    // Special Effects
    async getFeatureSpecialEffects(progressionId: number): Promise<GetFeatureSpecialEffectsResponse> {
        const [effects] = await Promise.all([
            prisma.featureSpecialEffect.findMany({
                where: { progressionId },
                orderBy: { id: 'asc' },
            }),
            prisma.featureSpecialEffect.count({
                where: { progressionId },
            }),
        ]);

        return {
            total: effects.length,
            results: effects.map(effect => ({
                ...effect,
                value: effect.value ?? undefined,
                key: effect.key ?? undefined,
                numericValue: effect.numericValue ?? undefined,
            })),
        };
    },

    async createFeatureSpecialEffect(data: CreateFeatureSpecialEffectRequest): Promise<CreateResponse> {
        const result = await prisma.featureSpecialEffect.create({
            data: {
                ...data,
            },
        });

        return { id: result.id.toString(), message: 'Feature special effect created successfully' };
    },

    async updateFeatureSpecialEffect(id: number, data: UpdateFeatureSpecialEffectRequest): Promise<UpdateResponse> {
        await prisma.featureSpecialEffect.update({
            where: { id },
            data: {
                ...data,
            },
        });

        return { message: 'Feature special effect updated successfully' };
    },

    async deleteFeatureSpecialEffect(id: number): Promise<UpdateResponse> {
        await prisma.featureSpecialEffect.delete({
            where: { id },
        });

        return { message: 'Feature special effect deleted successfully' };
    },
}; 
