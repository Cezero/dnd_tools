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
    GetFeatureListResponse,
} from '@shared/schema';

export interface FeatureSystemService {
    getAllFeatures(sourceType?: number): Promise<GetAllFeaturesResponse>;
    getFeatureList(sourceType?: number): Promise<GetFeatureListResponse>;
    getFeatureById(query: { id: number }): Promise<GetFeatureResponse | null>;
    createFeature(data: CreateFeatureRequest): Promise<CreateResponse>;
    updateFeature(query: { id: number }, data: UpdateFeatureRequest): Promise<UpdateResponse>;
    deleteFeature(query: { id: number }): Promise<UpdateResponse>;
    createFeatureProgressionWithRelations(data: CreateFeatureProgressionRequest): Promise<CreateResponse>;
    createMultipleFeatureProgressions(progressions: CreateFeatureProgressionRequest[], context: { classId?: number; raceId?: number }, tx?: Prisma.TransactionClient): Promise<void>;
    deleteFeatureProgressionsForContext(context: { classId?: number; raceId?: number }, tx?: Prisma.TransactionClient): Promise<void>;
    updateFeatureProgressions(featureId: number, progressions: CreateFeatureProgressionRequest[]): Promise<UpdateResponse>;
    getFeatureProgressions(featureId: number): Promise<FeatureProgression[]>;

    // NEW: Core methods for smart population
    getFeatureProgressionsByIds(progressionIds: number[]): Promise<FeatureProgression[]>;
    getFeatureProgressionsByClassId(classId: number): Promise<FeatureProgression[]>;
    getFeatureProgressionsByRaceId(raceId: number): Promise<FeatureProgression[]>;
    getFeatureProgressionById(progressionId: number): Promise<FeatureProgression | null>;
    populateFeatureProgressionsWithRelatedData(progressions: FeatureProgression[]): Promise<FeatureProgression[]>;
    determineRequiredIncludes(progressions: FeatureProgression[]): Prisma.FeatureProgressionInclude;
} 
