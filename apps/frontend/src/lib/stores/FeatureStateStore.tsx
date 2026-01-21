import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

import type { FeatureState, FeatureWithRelations } from '@shared/schema';

import { FeatureSystemApi } from '../../components/feature-system/FeatureSystemApi';

/**
 * Feature state store context value.
 * 
 * Provides access to feature states cached from the database.
 * Feature states are stored by feature ID and fetched from the database
 * via FeatureSystemApi. This store does NOT subscribe to editing state changes.
 * 
 * For viewing features, use loadFeatureData to fetch from the database.
 * For editing features, use useFeatureResolution hook which manages
 * isolated editing state (Redis) that doesn't affect viewers.
 * 
 * @see FeatureStateStoreProvider - Provider component
 * @see packages/shared/docs/feature-system/frontend-components.md - Full documentation
 */
interface FeatureStateStoreContextValue {
    /**
     * Get feature state by ID.
     * 
     * @param featureId - The feature ID
     * @returns The feature state, or null if not loaded
     */
    getFeatureState: (featureId: number) => FeatureState | null;

    /**
     * Load feature state from backend.
     * 
     * Fetches feature state and subscribes to updates via WebSocket.
     * Creates a session for editing. For read-only viewing, use loadFeatureData instead.
     * 
     * @param featureId - The feature ID
     * @returns Promise resolving to feature state
     */
    loadFeatureState: (featureId: number) => Promise<FeatureState>;

    /**
     * Load feature data from backend without creating a session.
     * 
     * Use this for read-only viewing to avoid unnecessary session creation.
     * 
     * @param featureId - The feature ID
     * @returns Promise resolving to feature data
     */
    loadFeatureData: (featureId: number) => Promise<FeatureWithRelations>;

    /**
     * Check if feature state is loaded.
     * 
     * @param featureId - The feature ID
     * @returns True if feature state is loaded
     */
    isFeatureStateLoaded: (featureId: number) => boolean;

    /**
     * Update feature state in store.
     * 
     * Used internally to cache feature data fetched from the database.
     * 
     * @param featureId - The feature ID
     * @param state - The updated feature state
     */
    updateFeatureState: (featureId: number, state: FeatureState) => void;
}

const FeatureStateStoreContext = createContext<FeatureStateStoreContextValue | null>(null);

/**
 * Feature state store provider component.
 * 
 * Provides global feature state caching for database data.
 * Components can access feature states via `useFeatureStateStore` hook.
 * 
 * **State Management**:
 * - Feature states are stored in memory by feature ID
 * - States are fetched from the database via FeatureSystemApi
 * - States are NOT updated via WebSocket (editing state is isolated)
 * 
 * **Viewing vs Editing**:
 * - Viewing: Use loadFeatureData to fetch from database (cached here)
 * - Editing: Use useFeatureResolution hook for isolated editing state (Redis)
 * - Editing state changes do NOT affect viewers (no WebSocket subscriptions)
 * 
 * @see useFeatureStateStore - Hook for accessing the store
 * @see packages/shared/docs/feature-system/frontend-components.md - Full documentation
 * 
 * @example
 * ```typescript
 * // In App.tsx or root component
 * <FeatureStateStoreProvider>
 *   <App />
 * </FeatureStateStoreProvider>
 * 
 * // In component (viewing)
 * const store = useFeatureStateStore();
 * const featureData = await store.loadFeatureData(123);
 * 
 * // In component (editing)
 * const resolution = useFeatureResolution(123);
 * // Editing state is isolated, doesn't affect viewers
 * ```
 */
export function FeatureStateStoreProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
    const [featureStates, setFeatureStates] = useState<Map<number, FeatureState>>(new Map());

    /**
     * Get feature state by ID.
     */
    const getFeatureState = useCallback((featureId: number): FeatureState | null => {
        return featureStates.get(featureId) || null;
    }, [featureStates]);

    /**
     * Check if feature state is loaded.
     */
    const isFeatureStateLoaded = useCallback((featureId: number): boolean => {
        return featureStates.has(featureId);
    }, [featureStates]);

    /**
     * Update feature state in store.
     */
    const updateFeatureState = useCallback((featureId: number, state: FeatureState): void => {
        setFeatureStates(prev => {
            const next = new Map(prev);
            next.set(featureId, state);
            return next;
        });
    }, []);

    /**
     * Load feature data from backend without creating a session.
     * 
     * Use this for read-only viewing to avoid unnecessary session creation.
     * This gets feature data directly from the database via FeatureSystemApi.
     * 
     * To edit a feature (which requires a lock), use useFeatureResolution hook
     * which will initialize a session via FeatureResolutionApi.initializeSession.
     * 
     * @throws Error if feature is not found (404) or other API errors occur
     */
    const loadFeatureData = useCallback(async (featureId: number): Promise<FeatureWithRelations> => {
        // Check if already loaded in store
        if (featureStates.has(featureId)) {
            return featureStates.get(featureId)!;
        }

        try {
            // Use the regular feature API to get feature data without creating a session
            const featureData = await FeatureSystemApi.getFeatureById(undefined, { id: featureId });

            // Store in local store for caching
            // FeatureState and FeatureWithRelations are the same type (aliases)
            updateFeatureState(featureId, featureData as FeatureState);

            return featureData;
        } catch (error) {
            // Re-throw with a more specific error message for 404s
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (errorMessage.includes('404') || errorMessage.includes('not found') || errorMessage.includes('Not Found')) {
                throw new Error(`Feature not found: ${featureId}`);
            }
            throw error;
        }
    }, [featureStates, updateFeatureState]);

    /**
     * Load feature state from backend.
     * 
     * **Note**: This method does NOT create a session or acquire a lock. It just gets
     * the feature data from the database. For viewing features, use loadFeatureData instead.
     * 
     * To actually edit a feature (which requires a lock), use the useFeatureResolution hook
     * which will call startEditing to acquire a lock and get the state from Redis.
     * 
     * @deprecated Use loadFeatureData for viewing. Use useFeatureResolution for editing.
     */
    const loadFeatureState = useCallback(async (featureId: number): Promise<FeatureState> => {
        // Just delegate to loadFeatureData - they do the same thing now
        return await loadFeatureData(featureId);
    }, [loadFeatureData]);

    const value: FeatureStateStoreContextValue = useMemo(
        () => ({
            getFeatureState,
            loadFeatureState,
            loadFeatureData,
            isFeatureStateLoaded,
            updateFeatureState,
        }),
        [getFeatureState, loadFeatureState, loadFeatureData, isFeatureStateLoaded, updateFeatureState]
    );

    return (
        <FeatureStateStoreContext.Provider value={value}>
            {children}
        </FeatureStateStoreContext.Provider>
    );
}

/**
 * Hook for accessing the feature state store.
 * 
 * Provides access to feature states and subscription management.
 * Must be used within a `FeatureStateStoreProvider`.
 * 
 * @returns Feature state store context value
 * @throws Error if used outside of FeatureStateStoreProvider
 * 
 * @example
 * ```typescript
 * const store = useFeatureStateStore();
 * const featureState = store.getFeatureState(123);
 * 
 * if (!store.isFeatureStateLoaded(123)) {
 *   await store.loadFeatureState(123);
 * }
 * ```
 */
export function useFeatureStateStore(): FeatureStateStoreContextValue {
    const context = useContext(FeatureStateStoreContext);

    if (!context) {
        throw new Error('useFeatureStateStore must be used within FeatureStateStoreProvider');
    }

    return context;
}
