import type { Prisma } from '@shared/prisma-client';
import type {
    GetAllFeaturesResponse,
    CreateFeatureRequest,
    UpdateFeatureRequest,
    GetFeatureResponse,
    CreateResponse,
    UpdateResponse,
    CreateFeatureProgressionRequest,
    UpdateFeatureProgression,
    FeatureProgression,
    GetFeatureListResponse,
} from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';

// Context type for feature progression operations
export interface FeatureProgressionContext {
    classId?: number;
    raceId?: number;
    variantOverrideId?: number;
    domainId?: number;
    sourceType?: FeatureSourceType;
}

export interface FeatureSystemService {
    getAllFeatures(sourceTypes?: number[]): Promise<GetAllFeaturesResponse>;
    getFeatureList(sourceTypes?: number[]): Promise<GetFeatureListResponse>;
    getFeatureById(query: { id: number }): Promise<GetFeatureResponse | null>;
    createFeature(data: CreateFeatureRequest): Promise<CreateResponse>;
    updateFeature(query: { id: number }, data: UpdateFeatureRequest): Promise<UpdateResponse>;
    deleteFeature(query: { id: number }): Promise<UpdateResponse>;
    createFeatureProgressionWithRelations(data: CreateFeatureProgressionRequest): Promise<CreateResponse>;
    createMultipleFeatureProgressions(progressions: CreateFeatureProgressionRequest[], context: FeatureProgressionContext, tx?: Prisma.TransactionClient): Promise<void>;
    deleteFeatureProgressionsForContext(context: FeatureProgressionContext, tx?: Prisma.TransactionClient): Promise<void>;
    updateFeatureProgressions(featureId: number, progressions: UpdateFeatureProgression[]): Promise<UpdateResponse>;
    getFeatureProgressions(featureId: number): Promise<FeatureProgression[]>;

    // NEW: Core methods for smart population
    getFeatureProgressionsByIds(progressionIds: number[]): Promise<FeatureProgression[]>;
    getFeatureProgressionsByClassId(classId: number): Promise<FeatureProgression[]>;
    getFeatureProgressionsByRaceId(raceId: number): Promise<FeatureProgression[]>;
    getFeatureProgressionsByDomainId(domainId: number): Promise<FeatureProgression[]>;
    getFeatureProgressionById(progressionId: number): Promise<FeatureProgression | null>;
} 
