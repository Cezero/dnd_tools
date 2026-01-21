import { FeatureWithRelations } from '@shared/schema';

import { EntityStateService } from '../shared/entityState/EntityStateService';
import type { FeatureSystemService } from './types';

/**
 * Service for managing feature states independently in Redis.
 * 
 * Features have their own state system, separate from parent entities (Class/Race).
 * The feature state contains the full `FeatureWithRelations` data, including entities,
 * prerequisites, and all related information.
 * 
 * **State Structure**: `FeatureState` = `FeatureWithRelations` (full feature data)
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
 * @see EntityStateService - For Redis state storage
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
    private entityStateService: EntityStateService;
    private featureSystemService: FeatureSystemService;
    private readonly ENTITY_TYPE = 'feature';

    constructor(featureSystemService: FeatureSystemService) {
        this.entityStateService = new EntityStateService();
        this.featureSystemService = featureSystemService;
    }

    /**
     * Gets feature state from Redis or initializes from database if not found.
     * 
     * @param featureId - The feature ID (number) or 'new' for new features
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
    async getFeatureState(featureId: number | 'new', userId?: number): Promise<FeatureWithRelations | null> {
        try {
            // For new features, check Redis first (using negative userId as key)
            if (featureId === 'new') {
                if (!userId) {
                    // If no userId provided, return empty state
                    return this.createEmptyFeatureState();
                }
                const stateKey = -userId;
                const cachedState = await this.entityStateService.getState<FeatureWithRelations>(
                    this.ENTITY_TYPE,
                    stateKey
                );
                return cachedState || this.createEmptyFeatureState();
            }
            
            // Try to get state from Redis first
            const cachedState = await this.entityStateService.getState<FeatureWithRelations>(
                this.ENTITY_TYPE,
                featureId
            );
            
            if (cachedState) {
                return cachedState;
            }
            
            // Not in Redis, initialize from database
            return await this.initializeFeatureState(featureId);
        } catch (error) {
            console.error(`Error getting feature state for feature ${featureId}:`, error);
            throw new Error(`Failed to get feature state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Updates feature state in Redis and publishes update.
     * 
     * @param featureId - The feature ID (number) or 'new' for new features
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
        featureId: number | 'new',
        state: FeatureWithRelations,
        userId: number
    ): Promise<void> {
        try {
            // For new features, use a temporary negative ID based on userId
            // This allows us to use EntityStateService which expects numeric IDs
            const stateKey = featureId === 'new' ? -userId : featureId;
            
            // Update state in Redis (automatically publishes update via EntityStateService)
            await this.entityStateService.setState(this.ENTITY_TYPE, stateKey, state);
            
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
     * For new features (featureId === 'new'), creates a new feature and returns its ID.
     * For existing features, updates the feature and returns the existing ID.
     * 
     * @param featureId - The feature ID (number) or 'new' for new features
     * @param userId - The user ID (used for temporary key lookup for new features)
     * @returns The feature ID (newly created or existing)
     * @throws Error if Redis or database operation fails
     * 
     * @example
     * ```typescript
     * const featureId = await featureStateService.saveFeatureStateToDatabase(123, userId);
     * ```
     */
    async saveFeatureStateToDatabase(featureId: number | 'new', userId: number): Promise<number> {
        try {
            // Get current state from Redis
            // For new features, use temporary negative ID based on userId
            const stateKey = featureId === 'new' ? -userId : featureId;
            const state = await this.entityStateService.getState<FeatureWithRelations>(
                this.ENTITY_TYPE,
                stateKey
            );
            
            if (!state) {
                throw new Error(`Feature state not found in Redis for feature ${featureId}`);
            }
            
            // Transform FeatureWithRelations to CreateFeatureRequest or UpdateFeature
            // Remove id, classes, races, and spellcasting (these are managed separately)
            const { id, classes, races, spellcasting, ...featureData } = state;
            
            // Transform entities to CreateFeatureEntityRequest format
            const entities = state.entities?.map(entity => {
                const { id: entityId, featureId: entityFeatureId, formulaParamsId, formulaParams, conditions, ...entityData } = entity;
                return {
                    ...entityData,
                    conditions: conditions?.map(cond => {
                        const { id: condId, featureEntityId, ...condData } = cond;
                        return condData;
                    }),
                    formulaParams: formulaParams ? (() => {
                        const { id: fpId, ...fpData } = formulaParams;
                        return fpData;
                    })() : null,
                };
            });
            
            // Transform prerequisites to CreateFeaturePrerequisiteRequest format
            const prerequisites = state.prerequisites?.map(prereq => {
                const { id: prereqId, featureId: prereqFeatureId, ...prereqData } = prereq;
                return prereqData;
            });
            
            // Transform displayConditions to CreateFeatureConditionRequest format
            const displayConditions = state.displayConditions?.map(cond => {
                const { id: condId, featureId: condFeatureId, ...condData } = cond;
                return condData;
            });
            
            if (featureId === 'new') {
                // Create new feature
                const createRequest = {
                    ...featureData,
                    entities,
                    prerequisites,
                    displayConditions,
                };
                
                const result = await this.featureSystemService.createFeatureWithRelations(createRequest);
                const newFeatureId = parseInt(result.id);
                
                // Clear the temporary state from Redis
                await this.entityStateService.deleteState(this.ENTITY_TYPE, -userId);
                
                return newFeatureId;
            } else {
                // Update existing feature
                const updateRequest = {
                    ...featureData,
                    entities,
                    prerequisites,
                    displayConditions,
                };
                
                await this.featureSystemService.updateFeature(
                    { id: featureId },
                    updateRequest
                );
                
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
            await this.entityStateService.deleteState(this.ENTITY_TYPE, stateKey);
        } catch (error) {
            console.error(`Error deleting new feature state for user ${userId}:`, error);
            throw new Error(`Failed to delete new feature state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    /**
     * Creates an empty feature state for new features.
     * 
     * @returns Empty FeatureWithRelations with default values
     */
    private createEmptyFeatureState(): FeatureWithRelations {
        return {
            id: 0, // Temporary ID, will be replaced on save
            slug: '',
            name: '',
            description: '',
            summary: null,
            displayInCharacterSheet: true,
            sourceType: 'Class' as any, // Will be set by context
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
            
            // Store in Redis as initial state
            await this.entityStateService.setState(this.ENTITY_TYPE, featureId, feature);
            
            return feature;
        } catch (error) {
            console.error(`Error initializing feature state for feature ${featureId}:`, error);
            throw new Error(`Failed to initialize feature state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
