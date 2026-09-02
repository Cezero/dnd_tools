import type { FeatureWithRelations, CharacterWithAllDetailsResponse, DnDClass, FeatInQueryResponse, FeatureEntity, PendingChoice, Race } from '@shared/schema';
import { EditionId, EntityAppliesToType, EntityType } from '@shared/static-data';

import { AvailableFeatService } from './availableFeatService';
import { CascadingResolver } from './cascadingResolver';
import { ChoiceResolver } from './choiceResolver';
import { FeatureEntityHandlers } from './featureEntityHandlers';
import { GestaltClassService } from './gestaltClassService';
import type { ResolutionContext, ResolutionResult, UserChoices } from './types';
import { companionService } from '../companion/companionService';
import { featService } from '../feat/featService';
import { featureSystemService } from '../featureSystem/featureSystemService';

/**
 * Main service for resolving character features.
 * 
 * Orchestrates the complete feature resolution process including:
 * - Base features (race, class)
 * - Gestalt class merging
 * - User choice resolution
 * - Cascading feature grants
 * - Level filtering
 * 
 * All resolution logic is centralized here to ensure consistency across the application.
 */
export class CharacterResolutionService {
    /**
     * Resolves all character features at a given level.
     * 
     * Executes resolution in phases:
     * 1. Base features (race and class)
     * 2. Gestalt merging (if applicable)
     * 3. User choice resolution (derived from persisted CharacterFeatureChoice rows if not provided)
     * 4. Granted feature resolution (cascading)
     * 5. Pending choice identification (final stage; prerequisite-aware)
     * 6. Final compilation
     * 
     * **Spell Operation Integration**:
     * The resolved features returned by this method are used by spell operations
     * (`characterService.addSpellKnown()` and `removeSpellKnown()`) to:
     * - Calculate available free spellbook spells using `ResolvedFeatureService.getAvailableSpellbookSpells()`
     * - Detect 0th level spell grants using `ResolvedFeatureService.hasZeroLevelSpellbookSpellsGrant()`
     * - Validate free grant quantity limits
     * 
     * When spell operations update the character, they re-resolve features using this method
     * to ensure the resolution session stays in sync with the character's spell state.
     * 
     * @param character - Character data with all details (including current spells)
     * @param targetLevel - Level to resolve features for
     * @param context - Resolution context with race, class, user choices, etc.
     * @returns Complete resolution result with features, pending choices, warnings, and errors
     * 
     * @see characterService.addSpellKnown - Uses resolved features for validation
     * @see characterService.removeSpellKnown - Uses resolved features for validation
     * @see CharacterResolvedResultsService - Stores resolved features in state
     */
    static async resolveCharacterFeatures(
        character: CharacterWithAllDetailsResponse,
        targetLevel: number,
        context: ResolutionContext
    ): Promise<ResolutionResult> {
        const resolution = new FeatureResolution(character, targetLevel, context);

        // Phase 1: Resolve base features (race, class)
        await resolution.resolveBaseFeatures();

        // Phase 2: Handle gestalt merging (if applicable)
        if (context.isGestalt && context.classDetails && context.secondaryClassDetails) {
            await resolution.resolveGestaltMerging();
        }

        // Phase 3: Resolve user choices (from context or persisted CharacterFeatureChoice rows)
        await resolution.resolveEffectiveUserChoices();

        // Phase 4: Resolve granted features from choices
        await resolution.resolveGrantedFeatures();

        // Phase 5: Identify pending choices (final stage; prerequisite-aware)
        await resolution.identifyPendingChoices();

        // Phase 6: Final feature compilation
        return resolution.compileFinalFeatures();
    }
}

/**
 * Internal class that manages the state and execution of feature resolution.
 * 
 * Maintains resolution state including features, pending choices, warnings, and errors.
 * Processes features in phases to handle dependencies and cascading effects.
 */
class FeatureResolution {
    private character: CharacterWithAllDetailsResponse;
    private targetLevel: number;
    private context: ResolutionContext;
    private resolvedProgressions: FeatureWithRelations[] = [];
    private pendingChoices: PendingChoice[] = [];
    private warnings: string[] = [];
    private errors: string[] = [];
    private resolutionDepth = 0;

    constructor(character: CharacterWithAllDetailsResponse, targetLevel: number, context: ResolutionContext) {
        this.character = character;
        this.targetLevel = targetLevel;
        this.context = context;
    }

    /**
     * Resolves base features from race and class.
     * 
     * Processes racial features first, then class features.
     * These form the foundation for all other feature resolution.
     */
    async resolveBaseFeatures(): Promise<void> {
        // Resolve racial features
        if (this.context.raceDetails) {
            await this.resolveRacialFeatures();
        }

        // Resolve class features
        if (this.context.classDetails) {
            await this.resolveClassFeatures(this.context.classDetails);
        }

        // Resolve edition features (feat feature, ability score increases, etc.)
        await this.resolveEditionFeatures();

        // Resolve feat features
        await this.resolveFeatFeatures();

        // Resolve companion features
        await this.resolveCompanionFeatures();
    }

    /**
     * Resolves gestalt multiclassing by merging primary and secondary classes.
     * 
     * Uses GestaltClassService to merge class features according to gestalt rules,
     * then processes the merged class features.
     */
    async resolveGestaltMerging(): Promise<void> {
        if (!this.context.classDetails || !this.context.secondaryClassDetails) {
            return;
        }

        // Fetch features for both classes separately
        // Note: classDetails objects have id at runtime even though type doesn't include it
        const primaryClassId = (this.context.classDetails as DnDClass & { id?: number }).id;
        const secondaryClassId = (this.context.secondaryClassDetails as DnDClass & { id?: number }).id;

        if (!primaryClassId || !secondaryClassId) {
            return;
        }

        const [primaryFeatures, secondaryFeatures] = await Promise.all([
            featureSystemService.getFeaturesByClassId(
                primaryClassId,
                this.buildCharacterFeatureChoices(),
                true
            ),
            featureSystemService.getFeaturesByClassId(
                secondaryClassId,
                this.buildCharacterFeatureChoices(),
                true
            )
        ]);

        // Merge classes according to gestalt rules
        const mergedClass = GestaltClassService.mergeClasses(
            { ...this.context.classDetails, features: primaryFeatures },
            { ...this.context.secondaryClassDetails, features: secondaryFeatures }
        );

        // Update context with merged class
        this.context.effectiveClassDetails = mergedClass;

        // Process merged features
        await this.resolveClassFeatures(mergedClass);
    }

    /**
     * Identifies pending choices that require user input.
     * 
     * Scans resolved features for choice entities and filters out choices
     * that have already been made. Only includes choices at or below the character's level.
     */
    async identifyPendingChoices(): Promise<void> {
        if (!this.context.includePendingChoices) {
            return;
        }

        // Calculate class levels from character advancements
        const classLevels = new Map<number, number>();
        if (this.character.advancements) {
            for (const adv of this.character.advancements) {
                const currentLevel = classLevels.get(adv.classId) ?? 0;
                classLevels.set(adv.classId, currentLevel + 1);

                if (adv.secondaryClassId) {
                    const secondaryLevel = classLevels.get(adv.secondaryClassId) ?? 0;
                    classLevels.set(adv.secondaryClassId, secondaryLevel + 1);
                }
            }
        }

        // Extract existing choices from character
        const existingChoices = this.character.advancements
            .flatMap(adv => adv.featureChoices || [])
            .map(choice => ({
                featureId: choice.featureId,
                featureEntityId: choice.featureEntityId
            }));

        const hasGeneralFeatChoice = this.resolvedProgressions.some((feature) =>
            (feature.entities ?? []).some(
                (entity) =>
                    entity.type === EntityType.Choice &&
                    entity.appliesTo === EntityAppliesToType.Feat &&
                    (entity.appliesToId === null || entity.appliesToId === undefined)
            )
        );

        let qualifiedFeats: FeatInQueryResponse[] | undefined;
        if (hasGeneralFeatChoice && this.character.editionId) {
            const editionIdsToQuery: number[] = [this.character.editionId];
            if (this.character.editionId === EditionId.DND_3E || this.character.editionId === EditionId.DND_3_5E) {
                editionIdsToQuery.push(EditionId.DND_3x);
            }

            const allFeatsResponse = await featService.getAllFeats();
            const featsForEdition = allFeatsResponse.results.filter(
                (feat) => feat.isVisible === true && editionIdsToQuery.includes(feat.editionId)
            );

            qualifiedFeats = await AvailableFeatService.getQualifiedFeats(
                this.character,
                this.resolvedProgressions,
                this.context.effectiveClassDetails ?? this.context.classDetails ?? null,
                this.context.raceDetails ?? null,
                featsForEdition
            );
        }

        this.pendingChoices = await ChoiceResolver.identifyPendingChoices(
            this.resolvedProgressions,
            this.character.editionId ?? undefined,
            existingChoices,
            qualifiedFeats,
            this.targetLevel,
            classLevels.size > 0 ? classLevels : undefined
        );
    }

    /**
     * Resolve user choices so cascading grants and pending-choice generation have accurate inputs.
     *
     * If `context.userChoices` is not provided, we derive it from persisted `CharacterFeatureChoice`
     * rows by mapping each choice's feature/entity pair to the entity's `appliesTo` type.
     */
    async resolveEffectiveUserChoices(): Promise<void> {
        if (!this.context.userChoices) {
            const derivedChoices = this.deriveUserChoicesFromCharacterFeatureChoices();
            if (derivedChoices) {
                this.context.userChoices = derivedChoices;
            }
        }

        if (this.context.userChoices) {
            await this.resolveUserChoices(this.context.userChoices);
        }
    }

    /**
     * Resolves user choices and processes the features they grant.
     * 
     * Iterates through user choices by appliesTo type and resolves each choice,
     * adding the granted features to the resolved features.
     */
    async resolveUserChoices(userChoices: NonNullable<ResolutionContext['userChoices']>): Promise<void> {
        for (const [appliesToType, selectedIds] of Object.entries(userChoices)) {
            for (const selectedId of selectedIds) {
                await this.resolveGenericChoice(parseInt(appliesToType), selectedId);
            }
        }
    }

    /**
     * Resolve a generic choice by appliesTo type and selected ID.
     * 
     * Uses ChoiceResolver's centralized method to resolve the choice and adds the
     * granted feature features to the resolved features array. Processes
     * entities in the granted features to handle cascading effects.
     * 
     * @param appliesToType - The EntityAppliesToType value indicating what type of choice this is
     * @param selectedId - The ID of the selected entity (domain, feat, spell, etc.)
     */
    private async resolveGenericChoice(appliesToType: number, selectedId: number): Promise<void> {
        // Use ChoiceResolver's centralized method
        const grantedProgressions = await ChoiceResolver.resolveChoiceByType(
            appliesToType,
            selectedId,
            this.resolvedProgressions
        );

        // Add features using utility function with entity processing
        ChoiceResolver.addResolvedProgressions(this.resolvedProgressions, grantedProgressions, {
            processEntities: true,
            onEntityProcessed: (result, feature) => {
                this.processEntityResult(result, feature);
            }
        });
    }

    /**
     * Resolves features granted by other features (cascading resolution).
     * 
     * Uses CascadingResolver to recursively process features that grant other features,
     * handling circular dependencies and depth limits.
     */
    async resolveGrantedFeatures(): Promise<void> {
        if (!this.context.resolveCascading) {
            return;
        }

        // Use cascading resolver to handle granted features
        const cascadingResolver = new CascadingResolver();
        const result = await cascadingResolver.resolveCascadingFeatures(
            this.resolvedProgressions,
            this.context.userChoices
        );

        // Merge results
        this.resolvedProgressions = result.resolvedProgressions;
        this.warnings.push(...result.warnings);
        this.errors.push(...result.errors);
    }

    /**
     * Compiles the final resolution result.
     * 
     * Assembles all resolved features, pending choices, warnings, and errors
     * into a complete ResolutionResult for return to the caller.
     */
    compileFinalFeatures(): ResolutionResult {
        return {
            resolvedProgressions: this.resolvedProgressions,
            pendingChoices: this.pendingChoices,
            warnings: this.warnings,
            errors: this.errors,
            effectiveClassDetails: this.context.effectiveClassDetails,
        };
    }

    // Private helper methods
    /**
     * Convert `ResolutionContext.userChoices` into the optional `characterFeatureChoices`
     * argument expected by `featureSystemService`.
     *
     * Note: the current integration treats the `userChoices` map keys/values as IDs used
     * to influence feature retrieval. This helper centralizes the mapping so it stays
     * consistent across race/class/gestalt feature fetches.
     */
    private buildCharacterFeatureChoices():
        | Array<{ featureId: number; featureEntityId: number; appliesToId: number | null; appliesToSubId: number | null }>
        | undefined {
        const featureChoices = this.character.advancements?.flatMap((adv) => adv.featureChoices ?? []) ?? [];
        if (featureChoices.length === 0) {
            return undefined;
        }

        return featureChoices.map((choice) => ({
            featureId: choice.featureId,
            featureEntityId: choice.featureEntityId,
            appliesToId: choice.appliesToId ?? null,
            appliesToSubId: choice.appliesToSubId ?? null,
        }));
    }

    private deriveUserChoicesFromCharacterFeatureChoices(): UserChoices | undefined {
        const derivedChoices: UserChoices = {};

        if (!this.character.advancements) {
            return undefined;
        }

        for (const adv of this.character.advancements) {
            if (!adv.featureChoices) {
                continue;
            }

            for (const choice of adv.featureChoices) {
                if (choice.appliesToId === null || choice.appliesToId === undefined) {
                    continue;
                }

                for (const feature of this.resolvedProgressions) {
                    if (feature.id !== choice.featureId || !feature.entities) {
                        continue;
                    }

                    const entity = feature.entities.find((e) => e.id === choice.featureEntityId);
                    if (!entity) {
                        continue;
                    }

                    const appliesToType = entity.appliesTo;
                    if (!derivedChoices[appliesToType]) {
                        derivedChoices[appliesToType] = [];
                    }

                    if (!derivedChoices[appliesToType].includes(choice.appliesToId)) {
                        derivedChoices[appliesToType].push(choice.appliesToId);
                    }

                    break;
                }
            }
        }

        return Object.keys(derivedChoices).length > 0 ? derivedChoices : undefined;
    }

    /**
     * Add progressions to `resolvedProgressions`, applying level filtering and
     * optionally de-duplicating by progression id. Entity processing is performed
     * consistently for every included progression.
     */
    private addApplicableProgressions(
        progressions: FeatureWithRelations[],
        options?: { dedupeById?: boolean }
    ): void {
        const applicableProgressions = progressions.filter(
            (feature: FeatureWithRelations) => feature.level <= this.targetLevel
        );

        for (const feature of applicableProgressions) {
            if (options?.dedupeById) {
                const existingProgression = this.resolvedProgressions.find(p => p.id === feature.id);
                if (existingProgression) {
                    continue;
                }
            }

            this.processProgressionEntities(feature);
            this.resolvedProgressions.push(feature);
        }
    }

    /**
     * Process all entities within a progression to collect warnings/errors and
     * perform any entity-side effects required by resolution.
     */
    private processProgressionEntities(feature: FeatureWithRelations): void {
        if (!feature.entities) {
            return;
        }

        for (const entity of feature.entities) {
            const result = FeatureEntityHandlers.processFeatureEntity(entity, feature);
            this.processEntityResult(result, feature);
        }
    }

    private async resolveRacialFeatures(): Promise<void> {
        if (!this.context.raceDetails) {
            return;
        }

        // Fetch features separately using featureSystemService
        // Note: raceDetails object has id at runtime even though type doesn't include it
        const raceId = (this.context.raceDetails as Race & { id?: number }).id;
        if (!raceId) {
            return;
        }

        const racialProgressions = await featureSystemService.getFeaturesByRaceId(
            raceId,
            this.buildCharacterFeatureChoices()
        );

        if (!racialProgressions || racialProgressions.length === 0) {
            return;
        }

        this.addApplicableProgressions(racialProgressions);
    }

    private async resolveClassFeatures(classDetails: DnDClass): Promise<void> {
        if (!classDetails) {
            return;
        }

        // Fetch features separately using featureSystemService
        // Note: classDetails object has id at runtime even though type doesn't include it
        const classId = (classDetails as DnDClass & { id?: number }).id;
        if (!classId) {
            return;
        }

        const classProgressions = await featureSystemService.getFeaturesByClassId(
            classId,
            this.buildCharacterFeatureChoices(),
            true
        );

        if (!classProgressions || classProgressions.length === 0) {
            return;
        }

        this.addApplicableProgressions(classProgressions);
    }

    /**
     * Resolves edition-specific features (feat feature, ability score increases, etc.).
     * 
     * Queries FeatureWithRelations with sourceType: Edition and editionId matching the character's edition.
     * Special handling: DND_3x features apply to both DND_3E and DND_3_5E characters.
     * These features are automatically applied to all characters with the matching edition.
     */
    private async resolveEditionFeatures(): Promise<void> {
        if (!this.character.editionId) {
            return;
        }

        // Get edition IDs to query for
        // DND_3x features apply to both DND_3E and DND_3_5E characters
        const editionIdsToQuery: number[] = [this.character.editionId];
        if (this.character.editionId === EditionId.DND_3E || this.character.editionId === EditionId.DND_3_5E) {
            editionIdsToQuery.push(EditionId.DND_3x);
        }

        // Get all edition features for the character's edition(s)
        const allEditionProgressions: FeatureWithRelations[] = [];
        for (const editionId of editionIdsToQuery) {
            const features = await featureSystemService.getFeaturesByEditionId(editionId);
            allEditionProgressions.push(...features);
        }

        this.addApplicableProgressions(allEditionProgressions, { dedupeById: true });
    }

    /**
     * Resolves feat features from character's selected feats.
     * 
     * For each AdvancementFeat, retrieves the corresponding FeatureWithRelations
     * with sourceType: Feat and adds it to resolved features.
     */
    private async resolveFeatFeatures(): Promise<void> {
        if (!this.character.advancements) {
            return;
        }

        // Collect all unique feat IDs from character advancements
        const featIds = new Set<number>();
        for (const advancement of this.character.advancements) {
            if (advancement.feats) {
                for (const featSelection of advancement.feats) {
                    featIds.add(featSelection.featId);
                }
            }
        }

        if (featIds.size === 0) {
            return;
        }

        // Get all feat features for the selected feats
        const featProgressions = await featureSystemService.getFeaturesByFeatIds(Array.from(featIds));

        this.addApplicableProgressions(featProgressions, { dedupeById: true });
    }

    /**
     * Resolves companion features from character's selected companions.
     * 
     * Fetches character companions from the companion service and for each CharacterCompanion
     * with a companionId, retrieves the corresponding FeatureWithRelations with sourceType: Companion
     * and adds it to resolved features.
     */
    private async resolveCompanionFeatures(): Promise<void> {
        // Fetch character companions from the companion service
        const companionsResponse = await companionService.getCharacterCompanions(this.character.id);

        if (!companionsResponse.results || companionsResponse.results.length === 0) {
            return;
        }

        // Collect all unique companion IDs from character companions
        const companionIds = new Set<number>();
        for (const characterCompanion of companionsResponse.results) {
            if (characterCompanion.companionId) {
                companionIds.add(characterCompanion.companionId);
            }
        }

        if (companionIds.size === 0) {
            return;
        }

        // Get all companion features for the selected companions
        for (const companionId of companionIds) {
            const companionProgressions = await featureSystemService.getFeaturesByCompanionId(companionId);
            this.addApplicableProgressions(companionProgressions, { dedupeById: true });
        }
    }

    /**
     * Process the result of entity processing
     */
    private processEntityResult(result: { grants: FeatureEntity[]; warnings?: string[]; errors?: string[] }, _progression: FeatureWithRelations): void {
        // Handle warnings and errors
        if (result.warnings) {
            this.warnings.push(...result.warnings);
        }
        if (result.errors) {
            this.errors.push(...result.errors);
        }

        // Process grants - the entities themselves contain all the information needed
        // The FeatureWithRelations already has source attribution (sourceType, classId, raceId, etc.)
    }
}
