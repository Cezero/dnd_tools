import type { Prisma } from '@shared/prisma-client';
import type {
    GetAllFeaturesResponse,
    CreateFeatureBasicRequest,
    UpdateFeatureBasicRequest,
    UpdateFeature,
    GetFeatureResponse,
    CreateResponse,
    UpdateResponse,
    CreateFeatureRequest,
    FeatureWithRelations,
    GetFeatureListResponse,
    GetOrphanedFeaturesResponse,
    DeleteOrphanedFeaturesResponse,
    FeatureCacheResponse,
} from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';

// Context type for feature operations
export interface FeatureContext {
    classId?: number;
    raceId?: number;
    domainId?: number;
    featId?: number;
    companionId?: number;
    editionId?: number;
    sourceType?: FeatureSourceType;
}

export interface FeatureSystemService {
    getAllFeatures(sourceTypes?: number[]): Promise<GetAllFeaturesResponse>;
    getFeatureList(sourceTypes?: number[]): Promise<GetFeatureListResponse>;
    getFeatureCache(): Promise<FeatureCacheResponse>;
    getFeatureById(query: { id: number }): Promise<GetFeatureResponse | null>;
    createFeature(data: CreateFeatureBasicRequest): Promise<CreateResponse>;
    updateFeature(query: { id: number }, data: UpdateFeature): Promise<UpdateResponse>;
    deleteFeature(query: { id: number }): Promise<UpdateResponse>;
    createFeatureWithRelations(data: CreateFeatureRequest): Promise<CreateResponse>;
    createMultipleFeatures(features: CreateFeatureRequest[], context: FeatureContext, tx?: Prisma.TransactionClient): Promise<void>;
    deleteFeaturesForContext(context: FeatureContext, tx?: Prisma.TransactionClient): Promise<void>;
    updateFeatures(featureId: number, features: UpdateFeature[]): Promise<UpdateResponse>;
    getFeatures(featureId: number): Promise<FeatureWithRelations[]>;

    // Core methods for smart population
    getFeaturesByIds(featureIds: number[], characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>, includeClassRaceInfo?: boolean): Promise<FeatureWithRelations[]>;
    getFeaturesByClassId(classId: number, characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>, includeClassRaceInfo?: boolean): Promise<FeatureWithRelations[]>;
    getFeaturesByRaceId(raceId: number, characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>, includeClassRaceInfo?: boolean): Promise<FeatureWithRelations[]>;
    getFeaturesByDomainId(domainId: number, characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>): Promise<FeatureWithRelations[]>;
    getFeaturesByFeatIds(featIds: number[], characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>): Promise<FeatureWithRelations[]>;
    getFeaturesByCompanionId(companionId: number, characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>): Promise<FeatureWithRelations[]>;
    getFeaturesByEditionId(editionId: number, characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>): Promise<FeatureWithRelations[]>;
    getFeatureByIdWithChoices(featureId: number, characterFeatureChoices?: Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>): Promise<FeatureWithRelations | null>;
    cloneClassFeatures(sourceClassId: number, targetClassId: number, forkFeatures?: boolean): Promise<void>;
    forkFeatureForClass(featureId: number, classId: number): Promise<number>;
    syncClassFeatures(classId: number, featureIds: number[], tx: Prisma.TransactionClient): Promise<number[]>;
    syncRaceFeatures(raceId: number, featureIds: number[], tx: Prisma.TransactionClient): Promise<number[]>;
    cleanupOrphanedFeatures(orphanedFeatureIds: number[]): Promise<void>;
    getOrphanedFeatures(): Promise<GetOrphanedFeaturesResponse>;
    deleteOrphanedFeatures(featureIds: number[]): Promise<DeleteOrphanedFeaturesResponse>;
} 
