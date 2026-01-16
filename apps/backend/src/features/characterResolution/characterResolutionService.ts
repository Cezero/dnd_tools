import type { FeatureProgression, CharacterWithAllDetailsResponse, DnDClass, FeatInQueryResponse, FeatureEntity } from '@shared/schema';
import { EditionId } from '@shared/static-data';

import { CascadingResolver } from './cascadingResolver';
import { ChoiceResolver } from './choiceResolver';
import { FeatureEntityHandlers } from './featureEntityHandlers';
import { GestaltClassService } from './gestaltClassService';
import type { ResolutionContext, ResolutionResult, PendingChoice } from './types';
import { companionService } from '../companion/companionService';
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
     * 3. Pending choice identification
     * 4. User choice resolution
     * 5. Granted feature resolution (cascading)
     * 6. Final compilation
     * 
     * **Spell Operation Integration**:
     * The resolved progressions returned by this method are used by spell operations
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
     * @returns Complete resolution result with progressions, pending choices, warnings, and errors
     * 
     * @see characterService.addSpellKnown - Uses resolved progressions for validation
     * @see characterService.removeSpellKnown - Uses resolved progressions for validation
     * @see CharacterSessionService - Stores resolved progressions in session
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

        // Phase 3: Identify pending choices
        await resolution.identifyPendingChoices();

        // Phase 4: Resolve user choices (if provided)
        if (context.userChoices) {
            await resolution.resolveUserChoices(context.userChoices);
        }

        // Phase 5: Resolve granted features from choices
        await resolution.resolveGrantedFeatures();

        // Phase 6: Final feature compilation
        return resolution.compileFinalFeatures();
    }
}

/**
 * Internal class that manages the state and execution of feature resolution.
 * 
 * Maintains resolution state including progressions, pending choices, warnings, and errors.
 * Processes features in phases to handle dependencies and cascading effects.
 */
class FeatureResolution {
    private character: CharacterWithAllDetailsResponse;
    private targetLevel: number;
    private context: ResolutionContext;
    private resolvedProgressions: FeatureProgression[] = [];
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

        // Resolve edition features (feat progression, ability score increases, etc.)
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

        // Merge classes according to gestalt rules
        const mergedClass = GestaltClassService.mergeClasses(
            this.context.classDetails,
            this.context.secondaryClassDetails
        );

        // Update context with merged class
        this.context.effectiveClassDetails = mergedClass;

        // Process merged features
        await this.resolveClassFeatures(mergedClass);
    }

    /**
     * Identifies pending choices that require user input.
     * 
     * Scans resolved progressions for choice entities and filters out choices
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
                progressionId: choice.progressionId,
                featureEntityId: choice.featureEntityId
            }));

        // Get all feats for choice options (if needed)
        // This would need to be passed in or fetched
        const allFeats: FeatInQueryResponse[] = []; // TODO: Fetch from featService if needed

        this.pendingChoices = await ChoiceResolver.identifyPendingChoices(
            this.resolvedProgressions,
            this.character.editionId ?? undefined,
            existingChoices,
            allFeats,
            this.targetLevel,
            classLevels.size > 0 ? classLevels : undefined
        );
    }

    /**
     * Resolves user choices and processes the features they grant.
     * 
     * Iterates through user choices by appliesTo type and resolves each choice,
     * adding the granted features to the resolved progressions.
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
     * granted feature progressions to the resolved progressions array. Processes
     * entities in the granted progressions to handle cascading effects.
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

        // Add progressions using utility function with entity processing
        ChoiceResolver.addResolvedProgressions(this.resolvedProgressions, grantedProgressions, {
            processEntities: true,
            onEntityProcessed: (result, progression) => {
                this.processEntityResult(result, progression);
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
     * Assembles all resolved progressions, pending choices, warnings, and errors
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
    private async resolveRacialFeatures(): Promise<void> {
        if (!this.context.raceDetails || !this.context.raceDetails.features) {
            return;
        }

        // Use the feature progressions that are already available in the race data
        const racialProgressions = this.context.raceDetails.features;

        // Filter progressions to only include those at or below the target level
        const applicableProgressions = racialProgressions.filter(
            progression => progression.level <= this.targetLevel
        );

        // Process each applicable racial progression
        for (const progression of applicableProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    const result = FeatureEntityHandlers.processFeatureEntity(entity, progression);
                    this.processEntityResult(result, progression);
                }
            }
            this.resolvedProgressions.push(progression);
        }
    }

    private async resolveClassFeatures(classDetails: DnDClass): Promise<void> {
        if (!classDetails || !classDetails.features) {
            return;
        }

        // Use the feature progressions that are already available in the class data
        const classProgressions = classDetails.features;

        // Filter progressions to only include those at or below the target level
        const applicableProgressions = classProgressions.filter(
            progression => progression.level <= this.targetLevel
        );

        // Process each applicable class progression
        for (const progression of applicableProgressions) {
            if (progression.entities) {
                for (const entity of progression.entities) {
                    const result = FeatureEntityHandlers.processFeatureEntity(entity, progression);
                    this.processEntityResult(result, progression);
                }
            }
            this.resolvedProgressions.push(progression);
        }
    }

    /**
     * Resolves edition-specific features (feat progression, ability score increases, etc.).
     * 
     * Queries FeatureProgression with sourceType: Edition and editionId matching the character's edition.
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

        // Get all edition progressions for the character's edition(s)
        const allEditionProgressions: FeatureProgression[] = [];
        for (const editionId of editionIdsToQuery) {
            const progressions = await featureSystemService.getFeatureProgressionsByEditionId(editionId);
            allEditionProgressions.push(...progressions);
        }

        // Filter progressions to only include those at or below the target level
        const applicableProgressions = allEditionProgressions.filter(
            progression => progression.level <= this.targetLevel
        );

        // Process each edition progression
        for (const progression of applicableProgressions) {
            // Check if this progression already exists to avoid duplicates
            const existingProgression = this.resolvedProgressions.find(p => p.id === progression.id);
            if (existingProgression) {
                continue;
            }

            if (progression.entities) {
                for (const entity of progression.entities) {
                    const result = FeatureEntityHandlers.processFeatureEntity(entity, progression);
                    this.processEntityResult(result, progression);
                }
            }
            this.resolvedProgressions.push(progression);
        }
    }

    /**
     * Resolves feat features from character's selected feats.
     * 
     * For each AdvancementFeat, retrieves the corresponding FeatureProgression
     * with sourceType: Feat and adds it to resolved progressions.
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

        // Get all feat progressions for the selected feats
        const featProgressions = await featureSystemService.getFeatureProgressionsByFeatIds(Array.from(featIds));

        // Filter progressions to only include those at or below the target level
        const applicableProgressions = featProgressions.filter(
            progression => progression.level <= this.targetLevel
        );

        // Process each applicable feat progression
        for (const progression of applicableProgressions) {
            // Check if this progression already exists to avoid duplicates
            const existingProgression = this.resolvedProgressions.find(p => p.id === progression.id);
            if (existingProgression) {
                continue;
            }

            if (progression.entities) {
                for (const entity of progression.entities) {
                    const result = FeatureEntityHandlers.processFeatureEntity(entity, progression);
                    this.processEntityResult(result, progression);
                }
            }
            this.resolvedProgressions.push(progression);
        }
    }

    /**
     * Resolves companion features from character's selected companions.
     * 
     * Fetches character companions from the companion service and for each CharacterCompanion
     * with a companionId, retrieves the corresponding FeatureProgression with sourceType: Companion
     * and adds it to resolved progressions.
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

        // Get all companion progressions for the selected companions
        for (const companionId of companionIds) {
            const companionProgressions = await featureSystemService.getFeatureProgressionsByCompanionId(companionId);

            // Filter progressions to only include those at or below the target level
            const applicableProgressions = companionProgressions.filter(
                progression => progression.level <= this.targetLevel
            );

            // Process each applicable companion progression
            for (const progression of applicableProgressions) {
                // Check if this progression already exists to avoid duplicates
                const existingProgression = this.resolvedProgressions.find(p => p.id === progression.id);
                if (existingProgression) {
                    continue;
                }

                if (progression.entities) {
                    for (const entity of progression.entities) {
                        const result = FeatureEntityHandlers.processFeatureEntity(entity, progression);
                        this.processEntityResult(result, progression);
                    }
                }
                this.resolvedProgressions.push(progression);
            }
        }
    }

    /**
     * Process the result of entity processing
     */
    private processEntityResult(result: { grants: FeatureEntity[]; warnings?: string[]; errors?: string[] }, _progression: FeatureProgression): void {
        // Handle warnings and errors
        if (result.warnings) {
            this.warnings.push(...result.warnings);
        }
        if (result.errors) {
            this.errors.push(...result.errors);
        }

        // Process grants - the entities themselves contain all the information needed
        // The FeatureProgression already has source attribution (sourceType, classId, raceId, etc.)
    }
}










