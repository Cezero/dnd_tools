import { PrismaClient } from '@shared/prisma-client';
import {
    TransformationFormIdParamRequest,
    FeatureIdForTransformationFormsParamRequest,
    CreateTransformationFormRequest,
    UpdateTransformationFormRequest,
    GetAllTransformationFormsResponse,
    GetTransformationFormResponse,
    GetTransformationFormsByFeatureResponse,
    CreateResponse,
    UpdateResponse,
} from '@shared/schema';

import type { TransformationFormService } from './types';

const prisma = new PrismaClient();

export const transformationFormService: TransformationFormService = {
    async getAllTransformationForms(): Promise<GetAllTransformationFormsResponse> {
        const [forms, total] = await Promise.all([
            prisma.transformationFormEligibility.findMany({
                orderBy: { featureId: 'asc' },
                include: {
                    feature: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                        }
                    },
                    monster: {
                        select: {
                            id: true,
                            name: true,
                            sizeId: true,
                        }
                    }
                }
            }),
            prisma.transformationFormEligibility.count(),
        ]);

        return {
            total,
            results: forms,
        };
    },

    async getTransformationFormById(query: TransformationFormIdParamRequest): Promise<GetTransformationFormResponse | null> {
        const form = await prisma.transformationFormEligibility.findUnique({
            where: { id: query.id },
            include: {
                feature: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    }
                },
                monster: {
                    select: {
                        id: true,
                        name: true,
                        sizeId: true,
                    }
                }
            }
        });

        if (!form) {
            return null;
        }

        return form;
    },

    async getTransformationFormsByFeature(query: FeatureIdForTransformationFormsParamRequest): Promise<GetTransformationFormsByFeatureResponse> {
        const forms = await prisma.transformationFormEligibility.findMany({
            where: { featureId: query.featureId },
            include: {
                feature: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    }
                },
                monster: {
                    select: {
                        id: true,
                        name: true,
                        sizeId: true,
                    }
                }
            },
            orderBy: { minLevel: 'asc' }
        });

        return forms;
    },

    async createTransformationForm(data: CreateTransformationFormRequest): Promise<CreateResponse> {
        const result = await prisma.transformationFormEligibility.create({
            data: {
                featureId: data.featureId,
                monsterId: data.monsterId,
                minLevel: data.minLevel,
                notes: data.notes,
            }
        });

        return { id: result.id.toString(), message: 'Transformation form eligibility created successfully' };
    },

    async updateTransformationForm(data: UpdateTransformationFormRequest, query: TransformationFormIdParamRequest): Promise<UpdateResponse> {
        await prisma.transformationFormEligibility.update({
            where: { id: query.id },
            data: {
                featureId: data.featureId,
                monsterId: data.monsterId,
                minLevel: data.minLevel,
                notes: data.notes,
            }
        });

        return { message: 'Transformation form eligibility updated successfully' };
    },

    async deleteTransformationForm(query: TransformationFormIdParamRequest): Promise<UpdateResponse> {
        await prisma.transformationFormEligibility.delete({
            where: { id: query.id }
        });

        return { message: 'Transformation form eligibility deleted successfully' };
    },
};

