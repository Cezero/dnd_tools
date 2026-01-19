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
    FeatureCacheResponse,
} from '@shared/schema';
import { FeatureSourceType } from '@shared/static-data';

// Context type for feature progression operations
export interface FeatureProgressionContext {
    classId?: number;
    raceId?: number;
    domainId?: number;
    featId?: number;
    sourceType?: FeatureSourceType;
}

export interface FeatureSystemService {
    getAllFeatures(sourceTypes?: number[]): Promise<GetAllFeaturesResponse>;
    getFeatureList(sourceTypes?: number[]): Promise<GetFeatureListResponse>;
    getFeatureCache(): Promise<FeatureCacheResponse>;
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
    getFeatureProgressionsByIds(progressionIds: number[], characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>, includeClassRaceInfo?: boolean): Promise<FeatureProgression[]>;
    getFeatureProgressionsByClassId(classId: number, characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>): Promise<FeatureProgression[]>;
    getFeatureProgressionsByRaceId(raceId: number, characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>): Promise<FeatureProgression[]>;
    getFeatureProgressionsByDomainId(domainId: number, characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>): Promise<FeatureProgression[]>;
    getFeatureProgressionsByFeatIds(featIds: number[], characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>): Promise<FeatureProgression[]>;
    getFeatureProgressionsByCompanionId(companionId: number, characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>): Promise<FeatureProgression[]>;
    getFeatureProgressionsByEditionId(editionId: number, characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>): Promise<FeatureProgression[]>;
    getFeatureProgressionById(progressionId: number, characterFeatureChoices?: Array<{ progressionId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>): Promise<FeatureProgression | null>;
    cloneClassFeatures(sourceClassId: number, targetClassId: number, forkProgressions?: boolean): Promise<void>;
    forkProgressionForClass(progressionId: number, classId: number): Promise<number>;
    syncClassFeatureProgressions(classId: number, progressionIds: number[], tx: Prisma.TransactionClient): Promise<number[]>;
    syncRaceFeatureProgressions(raceId: number, progressionIds: number[], tx: Prisma.TransactionClient): Promise<number[]>;
    cleanupOrphanedProgressions(orphanedProgressionIds: number[]): Promise<void>;
} 
