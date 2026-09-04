import { ZodError } from 'zod';

import {
    CreateFeatureRequest,
    CreateFeatureRequestSchema,
    CreateFeatureEntitySchema,
    CreateFeatureConditionRequest,
    CreateFeatureEntityConditionRequest,
    FeatureCondition,
    FeatureEntity,
    FeatureEntityCondition,
    FeatureFormulaParams,
    FeaturePrerequisite,
    FeatureState,
    FeatureWithRelations,
    FeatureWithRelationsSchema,
    UpdateFeature,
    UpdateFeatureSchema,
} from '@shared/schema';
import { DraftType, FeatureSourceType } from '@shared/static-data';

import type { FeatureSystemService } from './types';
import { DraftLockService } from '../shared/draftState/DraftLockService';
import { DraftStateService } from '../shared/draftState/DraftStateService';
import { mapZodErrorsToFieldPaths, ValidationErrorWithPaths, type JsonObject } from '../shared/utils';

/**
 * Service for managing feature states independently in Redis.
 * 
 * Features have their own state system, separate from parent entities (Class/Race).
 * The feature state is stored as `FeatureState` during editing,
 * allowing intermediate/invalid states. On save, the state is validated against `FeatureStateSchema`
 * and persisted.
 * 
 * **State Structure**: `FeatureState` (from @shared/schema)
 * 
 * **State Lifecycle**:
 * 1. State initialized from database when feature editing session starts
 * 2. State updated in Redis on each feature modification
 * 3. State persisted to MySQL on explicit save operation
 * 4. State remains in Redis until explicitly deleted or expired
 * 
 * **Integration**:
 * - Uses `EntityStateService` for Redis storage
 * - Uses `FeatureSystemService` for database operations
 * - Publishes state updates via pub/sub for real-time propagation
 * 
 * @see DraftStateService - For Redis state storage
 * @see FeatureSystemService - For database operations
 * @see packages/shared/docs/feature-system/backend-implementation.md - Full documentation
 * 
 * @example
 * ```typescript
 * const featureStateService = new FeatureStateService(featureSystemService);
 * 
 * // Initialize feature state from database
 * const state = await featureStateService.initializeFeatureState(123);
 * 
 * // Get feature state (from Redis or initialize if not exists)
 * const state = await featureStateService.getFeatureState(123);
 * 
 * // Update feature state
 * await featureStateService.updateFeatureState(123, updatedState, userId);
 * 
 * // Save feature state to database
 * await featureStateService.saveFeatureStateToDatabase(123);
 * ```
 */
export class FeatureStateService {
    private draftStateService: DraftStateService;
    private lockService: DraftLockService;
    private featureSystemService: FeatureSystemService;
    private readonly ENTITY_TYPE = DraftType.Feature;

    constructor(featureSystemService: FeatureSystemService) {
        this.draftStateService = new DraftStateService();
        this.lockService = new DraftLockService();
        this.featureSystemService = featureSystemService;
    }

    /**
     * Gets feature state from Redis or initializes from database if not found.
     * 
     * @param featureId - The feature ID (number). New drafts use a minted negative ID.
     * @returns The feature state (FeatureWithRelations), or null if feature doesn't exist
     * @throws Error if Redis or database operation fails
     * 
     * @example
     * ```typescript
     * const state = await featureStateService.getFeatureState(123);
     * if (state) {
     *   console.log('Feature state:', state);
     * }
     * ```
     */
    async getFeatureState(featureId: number): Promise<FeatureWithRelations | null> {
        try {
            // Try to get state from Redis first
            const cachedState = await this.draftStateService.getState<FeatureState>(
                this.ENTITY_TYPE,
                featureId
            );
            
            if (cachedState) {
                return cachedState as FeatureWithRelations;
            }
            
            // Not in Redis - check if feature is being edited (has a lock)
            // Only recreate state from database if there's an active editing session
            const lockedBy = await this.lockService.checkLock(this.ENTITY_TYPE, featureId);
            
            if (!lockedBy) {
                // No active editing session - state should not be in Redis
                // Return null instead of recreating from database
                return null;
            }
            
            // Only recreate state if there's an active editing session
            return await this.initializeFeatureState(featureId);
        } catch (error) {
            console.error(`Error getting feature state for feature ${featureId}:`, error);
            throw new Error(`Failed to get feature state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Updates feature state in Redis and publishes update.
     * 
     * @param featureId - The feature ID (number). New drafts use a minted negative ID.
     * @param state - The updated feature state (FeatureWithRelations)
     * @param userId - The user ID making the update (for audit/logging)
     * @throws Error if Redis operation fails
     * 
     * @example
     * ```typescript
     * await featureStateService.updateFeatureState(123, updatedState, userId);
     * ```
     */
    async updateFeatureState(
        featureId: number,
        state: FeatureWithRelations,
        userId: number
    ): Promise<void> {
        try {
            // Store as FeatureState
            // Update state in Redis (automatically publishes update via DraftStateService)
            await this.draftStateService.setState(this.ENTITY_TYPE, featureId, state as FeatureState);
            
            // Log the update for audit purposes
            console.log(`Feature state updated for feature ${featureId} by user ${userId}`);
        } catch (error) {
            console.error(`Error updating feature state for feature ${featureId}:`, error);
            throw new Error(`Failed to update feature state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Persists feature state from Redis to MySQL database.
     * 
     * This method loads the current state from Redis and saves it to the database
     * using the FeatureSystemService. The state is transformed into the appropriate
     * database format before saving.
     * 
     * For new drafts (featureId < 0), creates a new feature and returns its DB ID.
     * For existing features (featureId > 0), updates the feature and returns the existing ID.
     * 
     * @param featureId - The draft ID (negative for create, positive for update)
     * @param userId - The user ID saving the draft (used for audit/logging)
     * @returns The feature ID (newly created or existing)
     * @throws Error if Redis or database operation fails
     * 
     * @example
     * ```typescript
     * const featureId = await featureStateService.saveFeatureStateToDatabase(123, userId);
     * ```
     */
    async saveFeatureStateToDatabase(featureId: number, userId: number): Promise<number> {
        try {
            // Get current state from Redis (as flexible JSON)
            const flexibleState = await this.draftStateService.getState<FeatureState>(
                this.ENTITY_TYPE,
                featureId
            );
            
            if (!flexibleState) {
                throw new Error(`Feature state not found in Redis for feature ${featureId}`);
            }
            
            // Don't validate the raw transient state - it may contain entities with id: 0
            // We'll validate the transformed entities using CreateFeatureEntitySchema instead
            // Cast the flexible state to FeatureWithRelations for type safety, but don't validate yet
            const state = flexibleState as FeatureWithRelations;
            
            // Log state before save for debugging
            console.log(`[FeatureStateService] Saving feature state to database for feature ${featureId} (user ${userId}):`);
            const entitiesForLogging: FeatureEntity[] = Array.isArray(state.entities) ? state.entities : [];
            console.log(`[FeatureStateService] State retrieved from Redis - entities count: ${entitiesForLogging.length}`);
            if (entitiesForLogging.length > 0) {
                console.log(`[FeatureStateService] State entities:`, entitiesForLogging);
            } else {
                console.log(`[FeatureStateService] WARNING: State has no entities!`);
            }
            
            // Transform FeatureWithRelations to CreateFeatureRequest or UpdateFeature
            // Remove id, classes, races, and spellcasting (these are managed separately)
            const { id, classes, races, spellcasting, ...featureData } = state;
            
            // Transform entities to CreateFeatureEntityRequest format
            // Detect new entities (id: 0 or missing) and validate them using CreateFeatureEntitySchema
            const entitiesArray: FeatureEntity[] = Array.isArray(state.entities) ? state.entities : [];
            const entities = entitiesArray.map((entity: FeatureEntity) => {
                // Check if this is a new entity (id is 0, null, undefined, or missing)
                const entityId = entity.id;
                const isNewEntity = entityId === undefined || entityId === null || entityId <= 0;
                
                // Keep existing entity ids so updateFeatureEntities can update in place
                const { id: _entityId, featureId: _entityFeatureId, formulaParamsId, formulaParams, conditions, ...entityData } = entity;
                const transformedEntity = {
                    ...(!isNewEntity ? { id: entityId } : {}),
                    ...entityData,
                    conditions: Array.isArray(conditions) ? conditions.map((cond: FeatureEntityCondition) => {
                        const { id: _condId, featureEntityId: _condFeatureEntityId, ...condData } = cond;
                        return condData as CreateFeatureEntityConditionRequest;
                    }) : undefined,
                    formulaParams: formulaParams && typeof formulaParams === 'object' ? (() => {
                        const fp = formulaParams as FeatureFormulaParams;
                        const { id: _fpId, ...rest } = fp;
                        return {
                            ...rest,
                            thresholds: rest.thresholds ?? null,
                            values: rest.values ?? null,
                        };
                    })() : null,
                };
                
                // Only validate new entities (id: 0) using CreateFeatureEntitySchema
                // Existing entities (id > 0) are being updated, so validation happens at the service layer
                if (isNewEntity) {
                    try {
                        CreateFeatureEntitySchema.parse(transformedEntity);
                    } catch (error) {
                        if (error instanceof ZodError) {
                            const validationErrors = mapZodErrorsToFieldPaths(error);
                            throw new ValidationErrorWithPaths(validationErrors.map(err => ({
                                ...err,
                                path: `entities.${entitiesArray.indexOf(entity)}.${err.path}`
                            })));
                        }
                        throw error;
                    }
                }
                
                return transformedEntity;
            });
            
            // Transform prerequisites to CreateFeaturePrerequisiteRequest format
            const prerequisitesArray: FeaturePrerequisite[] = Array.isArray(state.prerequisites) ? state.prerequisites : [];
            const prerequisites = prerequisitesArray.map((prereq: FeaturePrerequisite) => {
                const { id: _prereqId, featureId: _prereqFeatureId, ...prereqData } = prereq;
                return prereqData;
            });
            
            // Transform displayConditions to CreateFeatureConditionRequest format
            const displayConditionsArray: FeatureCondition[] = Array.isArray(state.displayConditions) ? state.displayConditions : [];
            const displayConditions = displayConditionsArray.map((cond: FeatureCondition) => {
                const { id: _condId, featureId: _condFeatureId, ...condData } = cond;
                return condData as CreateFeatureConditionRequest;
            });
            
            // Log entities being saved
            console.log(`[FeatureStateService] Entities being saved to database: ${entities?.length || 0}`);
            if (entities && entities.length > 0) {
                console.log(`[FeatureStateService] Entities to save:`, entities);
            } else if (entitiesArray.length > 0) {
                console.warn(`[FeatureStateService] WARNING: State had ${entitiesArray.length} entities but transformed entities array is empty!`);
            }
            
            if (featureId < 0) {
                // Create new feature
                const createRequest: CreateFeatureRequest = {
                    ...featureData,
                    entities: entities as CreateFeatureRequest['entities'],
                    prerequisites: prerequisites as CreateFeatureRequest['prerequisites'],
                    displayConditions: displayConditions as CreateFeatureRequest['displayConditions'],
                };
                
                console.log(`[FeatureStateService] Creating new feature with ${entities?.length || 0} entities`);
                const validatedCreateRequest = CreateFeatureRequestSchema.parse(createRequest);
                const result = await this.featureSystemService.createFeatureWithRelations(validatedCreateRequest);
                const newFeatureId = parseInt(result.id, 10);
                console.log(`[FeatureStateService] Feature created with ID: ${newFeatureId}`);
                
                return newFeatureId;
            } else {
                // Update existing feature
                const updateRequest: UpdateFeature = {
                    ...featureData,
                    entities: entities as UpdateFeature['entities'],
                    prerequisites: prerequisites as UpdateFeature['prerequisites'],
                    displayConditions: displayConditions as UpdateFeature['displayConditions'],
                };
                
                console.log(`[FeatureStateService] Updating feature ${featureId} with ${entities?.length || 0} entities`);
                const validatedUpdateRequest = UpdateFeatureSchema.parse(updateRequest);
                await this.featureSystemService.updateFeature(
                    { id: featureId },
                    validatedUpdateRequest
                );
                console.log(`[FeatureStateService] Feature ${featureId} updated successfully`);
                
                return featureId;
            }
        } catch (error) {
            console.error(`Error saving feature state to database for feature ${featureId}:`, error);
            throw new Error(`Failed to save feature state to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    /**
     * Deletes temporary state for new features.
     * 
     * @param userId - The user ID (used to construct the temporary key)
     */
    async deleteNewFeatureState(userId: number): Promise<void> {
        try {
            // Use negative userId as the temporary key
            const stateKey = -userId;
            await this.draftStateService.deleteState(this.ENTITY_TYPE, stateKey);
        } catch (error) {
            console.error(`Error deleting new feature state for user ${userId}:`, error);
            throw new Error(`Failed to delete new feature state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Deletes feature state from Redis.
     * 
     * @param featureId - The feature ID
     */
    async deleteFeatureState(featureId: number): Promise<void> {
        try {
            console.log(`[FeatureStateService] Deleting feature state for feature ${featureId}`);
            await this.draftStateService.deleteState(this.ENTITY_TYPE, featureId);
            console.log(`[FeatureStateService] Successfully deleted feature state for feature ${featureId}`);
        } catch (error) {
            console.error(`Error deleting feature state for feature ${featureId}:`, error);
            throw new Error(`Failed to delete feature state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Validates if a cached state for a new feature is valid.
     * 
     * Checks for common invalid values from old code:
     * - id: 0 (should be positive integer)
     * - empty slug or name (should be non-empty)
     * - sourceType as string (should be number enum)
     * 
     * @param state - The state to validate
     * @returns true if state is valid, false otherwise
     */
    private isValidNewFeatureState(state: FeatureWithRelations): boolean {
        // Check for invalid id (0 or negative)
        if (!state.id || state.id <= 0) {
            return false;
        }
        
        // Empty strings are valid for new features (user will fill them in)
        // Only check that slug/name are strings (not undefined/null)
        if (state.slug === undefined || state.slug === null) {
            return false;
        }
        
        if (state.name === undefined || state.name === null) {
            return false;
        }
        
        // Check for invalid sourceType (string instead of number, or invalid enum value)
        if (typeof state.sourceType === 'string') {
            return false;
        }
        
        // Check if sourceType is a valid enum value (0-7)
        if (typeof state.sourceType !== 'number' || state.sourceType < 0 || state.sourceType > 7) {
            return false;
        }
        
        return true;
    }

    /**
     * Creates an empty feature state for new features.
     * 
     * Returns valid placeholder values that pass validation.
     * These values will be replaced when the user fills in the form.
     * 
     * @returns Empty FeatureWithRelations with valid placeholder values
     */
    private createEmptyFeatureState(): FeatureWithRelations {
        return {
            id: 1, // Placeholder ID (positive integer required by validation, will be replaced on save)
            slug: '', // Empty string - user will fill this in
            name: '', // Empty string - user will fill this in
            description: '',
            summary: null,
            displayInCharacterSheet: true,
            sourceType: FeatureSourceType.None, // Valid enum value (will be set by context if provided)
            level: 1,
            domainId: null,
            featId: null,
            companionId: null,
            editionId: null,
            prerequisites: [],
            entities: [],
            displayConditions: [],
        };
    }

    /**
     * Initializes feature state from database.
     * 
     * Loads the feature from the database with all relations (entities, prerequisites, etc.)
     * and stores it in Redis as the initial state.
     * 
     * @param featureId - The feature ID (must be a number, not 'new')
     * @returns The initialized feature state (FeatureWithRelations)
     * @throws Error if database operation fails or feature doesn't exist
     * 
     * @example
     * ```typescript
     * const state = await featureStateService.initializeFeatureState(123);
     * ```
     */
    async initializeFeatureState(featureId: number): Promise<FeatureWithRelations> {
        try {
            // Load feature from database with all relations
            const features = await this.featureSystemService.getFeatures(featureId);
            
            if (features.length === 0) {
                throw new Error(`Feature ${featureId} not found in database`);
            }
            
            const feature = features[0];
            
            // Store in Redis as FeatureState
            await this.draftStateService.setState(this.ENTITY_TYPE, featureId, feature as FeatureState);
            
            return feature;
        } catch (error) {
            console.error(`Error initializing feature state for feature ${featureId}:`, error);
            throw new Error(`Failed to initialize feature state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
