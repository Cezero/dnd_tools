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

/**
 * Transformation Form Service
 * 
 * Provides transformation form eligibility management for linking features (polymorph, wild shape)
 * to eligible monster forms. Supports level-based eligibility filtering and efficient queries
 * for retrieving available forms for specific features.
 * 
 * Key Features:
 * - Feature-to-monster linking for transformation abilities
 * - Level-based eligibility (minLevel) for form access
 * - Efficient queries ordered by minimum level
 * 
 * Integration Points:
 * - Feature System: Features reference transformation forms
 * - Monster System: Transformation forms reference monsters
 * - Character Resolution: Used to determine available forms for polymorph/wild shape features
 * 
 * @see TransformationFormService interface for method signatures
 * @see transformationFormController for request handling
 * @see transformationFormRoutes for API endpoints
 */
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

    /**
     * Retrieves all transformation form eligibilities for a specific feature, ordered by minimum level.
     * 
     * Orders results by minLevel (ascending) to support level-based form selection in character
     * resolution and frontend UI. Used by character resolution system and frontend to determine
     * available monster forms for polymorph and wild shape features based on character level.
     * 
     * @param query - FeatureIdForTransformationFormsParamRequest with feature ID
     * @returns Promise resolving to GetTransformationFormsByFeatureResponse with array of
     *          eligible forms ordered by minLevel
     */
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

