import type { Prisma } from '@shared/prisma-client';
import type {
    GetAllFeaturesResponse,
    CreateFeatureRequest,
    UpdateFeatureRequest,
    GetFeatureResponse,
    CreateResponse,
    UpdateResponse,
    CreateFeatureProgressionRequest,
    FeatureProgression,
} from '@shared/schema';

export interface FeatureSystemService {
    getAllFeatures(sourceType?: number): Promise<GetAllFeaturesResponse>;
    getFeatureById(query: { id: number }): Promise<GetFeatureResponse | null>;
    createFeature(data: CreateFeatureRequest): Promise<CreateResponse>;
    updateFeature(query: { id: number }, data: UpdateFeatureRequest): Promise<UpdateResponse>;
    deleteFeature(query: { id: number }): Promise<UpdateResponse>;
    createFeatureProgressionWithRelations(data: CreateFeatureProgressionRequest): Promise<CreateResponse>;
    createMultipleFeatureProgressions(progressions: CreateFeatureProgressionRequest[], context: { classId?: number; raceId?: number }, tx?: Prisma.TransactionClient): Promise<void>;
    deleteFeatureProgressionsForContext(context: { classId?: number; raceId?: number }, tx?: Prisma.TransactionClient): Promise<void>;
    updateFeatureProgressions(featureId: number, progressions: CreateFeatureProgressionRequest[]): Promise<UpdateResponse>;
    getFeatureProgressions(featureId: number): Promise<FeatureProgression[]>;
} 
