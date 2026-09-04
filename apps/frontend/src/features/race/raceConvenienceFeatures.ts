import { FeatureQueryHooks } from '@/components/feature-system/FeatureQueryHooks';
import type {
    CreateFeatureEntityRequest,
    CreateFeatureRequest,
    FeatureEntity,
    FeatureWithRelations,
    UpdateFeatureEntityRequest,
} from '@shared/schema';
import { EntityAppliesToType, EntityType, FeatureSourceType } from '@shared/static-data';

import type { RaceConvenienceFeatureContext, RaceConveniencePersistResult } from './types';

/**
 * True when an entity is the current-model race grant: Base type plus the given appliesTo.
 */
export function isCanonicalBaseEntity(entity: Pick<FeatureEntity, 'type' | 'appliesTo'>, appliesTo: EntityAppliesToType): boolean {
    return entity.type === EntityType.Base && entity.appliesTo === appliesTo;
}

/**
 * Finds the race-linked feature that already holds EntityType.Base entities for appliesTo.
 * Leftover Other/Bonus language and ability rows are ignored.
 */
export function findCanonicalRaceFeature(
    features: FeatureWithRelations[],
    appliesTo: EntityAppliesToType
): FeatureWithRelations | undefined {
    return features.find(feature =>
        feature.sourceType === FeatureSourceType.Race &&
        feature.entities?.some(entity => isCanonicalBaseEntity(entity, appliesTo))
    );
}

/**
 * Builds a Base entity payload for a language grant or ability adjustment.
 */
export function createCanonicalBaseEntity(
    appliesTo: EntityAppliesToType,
    appliesToId: number,
    value: number
): CreateFeatureEntityRequest {
    return {
        type: EntityType.Base,
        appliesTo,
        appliesToId,
        appliesToSubId: null,
        value,
        bonusType: null,
        groupingId: 1,
        displayInDetail: true,
        showFullProgression: false,
        filterType: null,
    };
}

/**
 * Maps an existing feature entity to an update payload, keeping its id so the backend updates in place.
 */
function toUpdateEntity(entity: FeatureEntity): UpdateFeatureEntityRequest {
    return {
        id: entity.id,
        type: entity.type,
        appliesTo: entity.appliesTo,
        appliesToId: entity.appliesToId,
        appliesToSubId: entity.appliesToSubId,
        value: entity.value,
        bonusType: entity.bonusType,
        groupingId: entity.groupingId,
        displayInDetail: entity.displayInDetail,
        showFullProgression: entity.showFullProgression,
        filterType: entity.filterType,
        conditions: entity.conditions?.map(condition => ({
            conditionType: condition.conditionType,
            conditionValue: condition.conditionValue,
        })),
    };
}

/**
 * Converts a display name into a URL-safe slug. Used only when creating a new container.
 */
function toSlug(value: string): string {
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return slug || 'feature';
}

/**
 * Display name for a newly created language or ability container. Not used as a lookup key.
 */
function containerDisplayName(raceName: string, appliesTo: EntityAppliesToType): string {
    const prefix = raceName.trim() || 'Race';
    if (appliesTo === EntityAppliesToType.AutomaticLanguage) {
        return `${prefix} Automatic Languages`;
    }
    if (appliesTo === EntityAppliesToType.BonusLanguage) {
        return `${prefix} Bonus Languages`;
    }
    return `${prefix} Ability Adjustments`;
}

/**
 * Creates a new race container feature with the first Base entity and returns its id.
 */
async function createCanonicalContainer(
    context: RaceConvenienceFeatureContext,
    appliesTo: EntityAppliesToType,
    firstEntity: CreateFeatureEntityRequest
): Promise<number> {
    const name = containerDisplayName(context.raceName, appliesTo);
    const request: CreateFeatureRequest = {
        name,
        slug: toSlug(name),
        description: name,
        displayInCharacterSheet: false,
        sourceType: FeatureSourceType.Race,
        level: 1,
        domainId: null,
        featId: null,
        companionId: null,
        editionId: context.editionId,
        entities: [firstEntity],
    };

    try {
        const created = await FeatureQueryHooks.createFeatureWithRelations(request);
        return parseInt(created.id, 10);
    } catch (_error) {
        const retryRequest: CreateFeatureRequest = {
            ...request,
            slug: `${toSlug(name)}-${Date.now()}`,
        };
        const created = await FeatureQueryHooks.createFeatureWithRelations(retryRequest);
        return parseInt(created.id, 10);
    }
}

/**
 * Adds a language to the canonical Base automatic/bonus language feature, creating the feature if needed.
 */
export async function persistRaceLanguageAdd(
    context: RaceConvenienceFeatureContext,
    languageId: number,
    isAutomatic: boolean
): Promise<RaceConveniencePersistResult> {
    const appliesTo = isAutomatic ? EntityAppliesToType.AutomaticLanguage : EntityAppliesToType.BonusLanguage;
    const existing = findCanonicalRaceFeature(context.features, appliesTo);

    if (existing?.entities?.some(entity =>
        isCanonicalBaseEntity(entity, appliesTo) && entity.appliesToId === languageId
    )) {
        return {};
    }

    const languageEntity = createCanonicalBaseEntity(appliesTo, languageId, 0);

    if (!existing) {
        const createdFeatureId = await createCanonicalContainer(context, appliesTo, languageEntity);
        return { createdFeatureId };
    }

    await FeatureQueryHooks.updateFeature(existing.id, {
        entities: [...(existing.entities ?? []).map(toUpdateEntity), languageEntity],
    });
    return {};
}

/**
 * Removes a language from the matching canonical Base automatic or bonus language feature.
 */
export async function persistRaceLanguageRemove(
    context: RaceConvenienceFeatureContext,
    languageId: number,
    isAutomatic: boolean
): Promise<void> {
    const appliesTo = isAutomatic ? EntityAppliesToType.AutomaticLanguage : EntityAppliesToType.BonusLanguage;
    const existing = findCanonicalRaceFeature(context.features, appliesTo);
    if (!existing) {
        return;
    }

    const nextEntities = (existing.entities ?? [])
        .filter(entity => !(isCanonicalBaseEntity(entity, appliesTo) && entity.appliesToId === languageId))
        .map(toUpdateEntity);

    await FeatureQueryHooks.updateFeature(existing.id, { entities: nextEntities });
}

/**
 * Updates, adds, or removes a Base ability-adjustment entity. Creates the container only when value is non-zero.
 */
export async function persistRaceAbilityChange(
    context: RaceConvenienceFeatureContext,
    abilityId: number,
    value: number
): Promise<RaceConveniencePersistResult> {
    const appliesTo = EntityAppliesToType.Ability;
    const existing = findCanonicalRaceFeature(context.features, appliesTo);
    const abilityEntity = existing?.entities?.find(entity =>
        isCanonicalBaseEntity(entity, appliesTo) && entity.appliesToId === abilityId
    );

    if (!existing) {
        if (value === 0) {
            return {};
        }
        const createdFeatureId = await createCanonicalContainer(
            context,
            appliesTo,
            createCanonicalBaseEntity(appliesTo, abilityId, value)
        );
        return { createdFeatureId };
    }

    let nextEntities: UpdateFeatureEntityRequest[];
    if (abilityEntity) {
        if (value === 0) {
            nextEntities = (existing.entities ?? [])
                .filter(entity => !(isCanonicalBaseEntity(entity, appliesTo) && entity.appliesToId === abilityId))
                .map(toUpdateEntity);
        } else {
            nextEntities = (existing.entities ?? []).map(entity =>
                isCanonicalBaseEntity(entity, appliesTo) && entity.appliesToId === abilityId
                    ? { ...toUpdateEntity(entity), value }
                    : toUpdateEntity(entity)
            );
        }
    } else if (value !== 0) {
        nextEntities = [
            ...(existing.entities ?? []).map(toUpdateEntity),
            createCanonicalBaseEntity(appliesTo, abilityId, value),
        ];
    } else {
        return {};
    }

    await FeatureQueryHooks.updateFeature(existing.id, { entities: nextEntities });
    return {};
}
