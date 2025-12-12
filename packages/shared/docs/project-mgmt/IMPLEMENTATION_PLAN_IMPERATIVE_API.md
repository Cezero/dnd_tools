# Implementation Plan: Replace Query Hooks with Imperative API

## Overview
This plan completely replaces the existing TanStack Query hooks with imperative API methods across the entire codebase. This will eliminate Rules of Hooks violations, simplify GenericList components, and enable true dynamic query management.

## Current State Analysis

### Files Using Query Hooks (37 files identified):
- **GenericList Components**: 8 files (DeityList, DomainList, FeatList, ItemList, ClassList, CharacterList, FeatsTab, FeaturesList)
- **Character Tabs**: 4 files (AbilitiesRaceTab, ClassTab, FeatsTab, ChoicesTab)
- **Edit Components**: 9 files (DomainEdit, FeatEdit, ItemEdit, SpellEdit, SkillEdit, DeityEdit, etc.)
- **Detail Components**: 6 files (DomainDetail, FeatDetail, ItemDetail, SpellDetail, SkillDetail, DeityDetail)
- **Cache Functions**: 1 file (CacheFunctions.ts)
- **SelectedEntityDisplay**: 1 file
- **Service Components**: 8 files (FeatureSystemService, ClassProficiencyService, etc.)

### Current QueryHooksFactory Structure:
```typescript
// Current: Returns hooks
return {
    useQuery: useQueryHook,
    useMutation: useMutationHook,
};
```

## Implementation Plan

### Phase 1: Update QueryHooksFactory

#### 1.1 Modify QueryHooksFactory.ts
**File**: `frontend/src/services/query/QueryHooksFactory.ts`

**Changes**:
```typescript
// Add to return object
return {
    useQuery: useQueryHook,
    useMutation: useMutationHook,
    // Add imperative methods
    queryFn: (params?: unknown) => {
        if (config.requestSchema) {
            return apiFunction(params as never, undefined);
        }
        const typedParams = params as { requestData?: unknown; pathParams?: unknown } | undefined;
        return apiFunction(typedParams?.requestData as never, typedParams?.pathParams as never);
    },
    queryKeyBuilder: queryKeyBuilder,
    // Add imperative fetch method
    fetch: async (params?: unknown, options?: { staleTime?: number; cacheTime?: number }) => {
        const queryClient = useQueryClient();
        return queryClient.fetchQuery({
            queryKey: queryKeyBuilder(params),
            queryFn: () => queryFn(params),
            staleTime: options?.staleTime || 5 * 60 * 1000,
            cacheTime: options?.cacheTime || 10 * 60 * 1000,
        });
    },
};
```

#### 1.2 Update All QueryHooks Files
**Files to update**:
- `DomainQueryHooks.ts`
- `FeatQueryHooks.ts`
- `RaceQueryHooks.ts`
- `ClassQueryHooks.ts`
- `SpellQueryHooks.ts`
- `SkillQueryHooks.ts`
- `ItemQueryHooks.ts`
- `DeityQueryHooks.ts`
- `CharacterQueryHooks.ts`
- `FeatureQueryHooks.ts`
- `CacheQueryHooks.ts`

**Pattern for each file**:
```typescript
// Example: DomainQueryHooks.ts
const domainByIdConfig = createQueryHooks({
    path: '/domains/:id',
    method: 'GET',
    paramsSchema: DomainIdParamSchema,
    responseSchema: DomainSchema,
    queryKey: 'domains',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['domains', 'item', typedParams?.pathParams?.id];
    },
});

export const DomainQueryHooks = {
    // Keep existing hooks for backward compatibility during transition
    useGetDomainById: domainByIdConfig.useQuery,
    useCreateDomain: domainByIdConfig.useMutation,
    useUpdateDomain: domainByIdConfig.useMutation,
    useDeleteDomain: domainByIdConfig.useMutation,
    
    // Add imperative methods
    getDomainById: (domainId: number) => domainByIdConfig.fetch({ pathParams: { id: domainId } }),
    createDomain: (data: CreateDomainRequest) => domainByIdConfig.mutate({ requestData: data }),
    updateDomain: (domainId: number, data: UpdateDomainRequest) => domainByIdConfig.mutate({ 
        requestData: data, 
        pathParams: { id: domainId } 
    }),
    deleteDomain: (domainId: number) => domainByIdConfig.mutate({ 
        pathParams: { id: domainId } 
    }),
    
    // Expose query functions for advanced usage
    getDomainByIdQueryFn: domainByIdConfig.queryFn,
    getDomainByIdQueryKey: (domainId: number) => domainByIdConfig.queryKeyBuilder({ pathParams: { id: domainId } }),
};
```

### Phase 2: Update GenericList Component

#### 2.1 Modify GenericList.tsx
**File**: `frontend/src/components/generic-list/GenericList.tsx`

**Changes**:
```typescript
// Update GenericListProps interface
interface GenericListProps<T> {
    storageKey: string;
    columns: ColumnDef<T>[];
    dataFetcher?: () => Promise<{ results: T[]; total: number }>; // New prop
    queryHook?: (params: any) => any; // Keep for backward compatibility
    // ... other existing props
}

// Update GenericList component
export function GenericList<T>({
    storageKey,
    columns,
    dataFetcher, // New prop
    queryHook, // Keep for backward compatibility
    // ... other props
}: GenericListProps<T>) {
    const [data, setData] = useState<T[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Use imperative API if dataFetcher provided, otherwise fall back to queryHook
    const fetchData = useCallback(async () => {
        if (dataFetcher) {
            try {
                setIsLoading(true);
                setError(null);
                const result = await dataFetcher();
                setData(result.results);
                setTotal(result.total);
            } catch (err) {
                setError(err as Error);
            } finally {
                setIsLoading(false);
            }
        } else if (queryHook) {
            // Fallback to existing hook-based approach
            const queryResult = queryHook({});
            // ... existing hook-based logic
        }
    }, [dataFetcher, queryHook]);

    // Fetch data on mount and when dependencies change
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ... rest of component logic
}
```

### Phase 3: Update All List Components

#### 3.1 Update List Components to Use Imperative API
**Files to update**:
- `DeityList.tsx`
- `DomainList.tsx`
- `FeatList.tsx`
- `ItemList.tsx`
- `ClassList.tsx`
- `CharacterList.tsx`
- `SpellList.tsx`
- `SkillList.tsx`
- `RaceList.tsx`

**Pattern for each file**:
```typescript
// Example: DomainList.tsx
export function DomainList() {
    const navigate = useNavigate();
    const { isAdmin } = useAuthAuto();

    const dataFetcher = useCallback(async () => {
        return await DomainQueryHooks.getDomains();
    }, []);

    return (
        <div className="p-6">
            {/* ... existing header logic ... */}
            <GenericList<DomainSummary>
                storageKey="domains-list"
                columns={DOMAIN_COLUMNS}
                dataFetcher={dataFetcher} // Use imperative API
                itemDesc="domain"
                routes={routes}
                // ... other props
            />
        </div>
    );
}
```

### Phase 4: Update Character Components

#### 4.1 Update Character Tabs
**Files to update**:
- `AbilitiesRaceTab.tsx`
- `ClassTab.tsx`
- `FeatsTab.tsx`
- `ChoicesTab.tsx`

**Pattern for each file**:
```typescript
// Example: AbilitiesRaceTab.tsx
export function AbilitiesRaceTab({ state, updateState, resolvedData, isLoading, triggerFeatureResolution }: TabComponentProps) {
    const [selectedRaceDetails, setSelectedRaceDetails] = useState<Race | null>(null);
    const [isLoadingRace, setIsLoadingRace] = useState(false);
    const [raceError, setRaceError] = useState<Error | null>(null);

    // Fetch race data when raceId changes
    useEffect(() => {
        if (state.raceId) {
            setIsLoadingRace(true);
            setRaceError(null);
            RaceQueryHooks.getRaceById(state.raceId)
                .then(race => {
                    setSelectedRaceDetails(race);
                    triggerFeatureResolution();
                })
                .catch(err => setRaceError(err))
                .finally(() => setIsLoadingRace(false));
        } else {
            setSelectedRaceDetails(null);
        }
    }, [state.raceId, triggerFeatureResolution]);

    // ... rest of component logic
}
```

#### 4.2 Update ChoicesTab for Dynamic Queries
**File**: `frontend/src/features/character/tabs/ChoicesTab.tsx`

**Complete rewrite**:
```typescript
export function ChoicesTab({ state, updateState, resolvedData, isLoading, triggerFeatureResolution, handleChoiceSelection }: TabComponentProps) {
    const { getDomainSelectByEdition } = useCacheFunctions();
    
    const [selectedChoices, setSelectedChoices] = useState<Record<string, number[]>>(() => {
        const choices: Record<string, number[]> = {};
        state.featureChoices.forEach(choice => {
            const choiceId = `${choice.progressionId}-${choice.featureEntityId}`;
            if (!choices[choiceId]) {
                choices[choiceId] = [];
            }
            choices[choiceId].push(choice.appliesToId);
        });
        return choices;
    });

    // Track pending queries keyed by choiceId
    const [pendingQueries, setPendingQueries] = useState<Record<string, { type: number; id: number }>>({});

    const handleSelectionChange = useCallback(async (choiceId: string, selectedValues: number[]) => {
        setSelectedChoices(prev => ({
            ...prev,
            [choiceId]: selectedValues
        }));

        if (selectedValues.length > 0) {
            const choice = resolvedData.pendingChoices.find(c => c.id === choiceId);
            if (choice) {
                const selectedId = selectedValues[0];
                
                // Add to pending queries map
                setPendingQueries(prev => ({
                    ...prev,
                    [choiceId]: { type: choice.type, id: selectedId }
                }));

                // Handle the choice immediately with imperative API
                if (choice.type === EntityAppliesToType.Domain) {
                    try {
                        const domainData = await DomainQueryHooks.getDomainById(selectedId);
                        if (domainData?.features && handleChoiceSelection) {
                            await handleChoiceSelection(choice.type, selectedId, domainData.features);
                        }
                    } catch (error) {
                        console.error(`Error fetching domain ${selectedId}:`, error);
                    }
                } else if (handleChoiceSelection) {
                    await handleChoiceSelection(choice.type, selectedId, []);
                }
            }
        } else {
            setPendingQueries(prev => {
                const newQueries = { ...prev };
                delete newQueries[choiceId];
                return newQueries;
            });
        }
    }, [resolvedData.pendingChoices, handleChoiceSelection]);

    // ... rest of component logic
}
```

### Phase 5: Update Cache Functions

#### 5.1 Update CacheFunctions.ts
**File**: `frontend/src/services/cache/CacheFunctions.ts`

**Changes**:
```typescript
export const useCacheFunctions = () => {
    // Use imperative API instead of hooks
    const getClassNameById = useCallback(async (id: number): Promise<ClassCacheEntry | undefined> => {
        try {
            const classesData = await CacheQueryHooks.getClassesCache();
            return classesData.results.find(item => item.id === id);
        } catch {
            return undefined;
        }
    }, []);

    const getRaceNameById = useCallback(async (id: number): Promise<RaceCacheEntry | undefined> => {
        try {
            const racesData = await CacheQueryHooks.getRacesCache();
            return racesData.results.find(item => item.id === id);
        } catch {
            return undefined;
        }
    }, []);

    // ... update all other cache functions similarly

    return {
        getClassNameById,
        getRaceNameById,
        // ... other functions
    };
};
```

### Phase 6: Update Edit Components

#### 6.1 Update Edit Components
**Files to update**:
- `DomainEdit.tsx`
- `FeatEdit.tsx`
- `ItemEdit.tsx`
- `SpellEdit.tsx`
- `SkillEdit.tsx`
- `DeityEdit.tsx`

**Pattern for each file**:
```typescript
// Example: DomainEdit.tsx
export function DomainEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [domain, setDomain] = useState<Domain | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch domain data
    useEffect(() => {
        if (id && id !== 'new') {
            setIsLoading(true);
            DomainQueryHooks.getDomainById(parseInt(id))
                .then(setDomain)
                .catch(err => setError(err.message))
                .finally(() => setIsLoading(false));
        }
    }, [id]);

    const handleSave = useCallback(async (formData: DomainFormData) => {
        try {
            if (id === 'new') {
                await DomainQueryHooks.createDomain(formData);
            } else {
                await DomainQueryHooks.updateDomain(parseInt(id!), formData);
            }
            navigate('/domains');
        } catch (err) {
            setError(err.message);
        }
    }, [id, navigate]);

    // ... rest of component logic
}
```

### Phase 7: Update SelectedEntityDisplay

#### 7.1 Update SelectedEntityDisplay.tsx
**File**: `frontend/src/features/character/SelectedEntityDisplay.tsx`

**Changes**:
```typescript
// Domain Display Wrapper
function DomainDisplayWrapper({ domainId, showHeader }: { domainId: number; showHeader: boolean }): React.JSX.Element | null {
    const [domain, setDomain] = useState<Domain | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (domainId) {
            setIsLoading(true);
            setError(null);
            DomainQueryHooks.getDomainById(domainId)
                .then(setDomain)
                .catch(setError)
                .finally(() => setIsLoading(false));
        }
    }, [domainId]);

    if (isLoading) {
        return (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="animate-pulse">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-red-600 dark:text-red-400">Error loading domain: {error.message}</p>
            </div>
        );
    }

    if (!domain) return null;

    return <DomainDisplay domain={domain} showHeader={showHeader} />;
}

// ... update other display wrappers similarly
```

### Phase 8: Update Service Components

#### 8.1 Update Service Components
**Files to update**:
- `FeatureSystemService.ts`
- `ClassProficiencyService.ts`
- `utils.ts` files

**Pattern**:
```typescript
// Example: FeatureSystemService.ts
export class FeatureSystemService {
    static async getFeatureById(featureId: number): Promise<Feature | null> {
        try {
            return await FeatureQueryHooks.getFeatureById(featureId);
        } catch {
            return null;
        }
    }

    static async getFeaturesBySource(sourceType: FeatureSourceType, sourceId: number): Promise<Feature[]> {
        try {
            const features = await FeatureQueryHooks.getFeatures();
            return features.results.filter(f => f.sourceType === sourceType && f.sourceId === sourceId);
        } catch {
            return [];
        }
    }
}
```

### Phase 9: Remove Hook Dependencies

#### 9.1 Update QueryHooksFactory.ts
**File**: `frontend/src/services/query/QueryHooksFactory.ts`

**Final version**:
```typescript
export function createQueryHooks<
    TRequestSchema extends ZodType | undefined,
    TResponseSchema extends ZodType,
    TParamsSchema extends ZodType | undefined = undefined
>(config: {
    path: string;
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    requestSchema?: TRequestSchema;
    paramsSchema?: TParamsSchema;
    responseSchema: TResponseSchema;
    queryKey: string;
    queryKeyBuilder?: (params?: unknown) => (string | number | object)[];
}) {
    const apiFunction = typedApi(config);
    const queryKeyBuilder = config.queryKeyBuilder || ((params?: unknown) => [config.queryKey, params]);

    const queryFn = (params?: unknown) => {
        if (config.requestSchema) {
            return apiFunction(params as never, undefined);
        }
        const typedParams = params as { requestData?: unknown; pathParams?: unknown } | undefined;
        return apiFunction(typedParams?.requestData as never, typedParams?.pathParams as never);
    };

    return {
        queryFn,
        queryKeyBuilder,
        // Remove useQuery and useMutation - no longer needed
    };
}
```

#### 9.2 Update All QueryHooks Files
**Remove all hook exports, keep only imperative methods**:

```typescript
// Example: DomainQueryHooks.ts
const domainByIdConfig = createQueryHooks({
    path: '/domains/:id',
    method: 'GET',
    paramsSchema: DomainIdParamSchema,
    responseSchema: DomainSchema,
    queryKey: 'domains',
    queryKeyBuilder: (params) => {
        const typedParams = params as { pathParams?: { id?: number } } | undefined;
        return ['domains', 'item', typedParams?.pathParams?.id];
    },
});

export const DomainQueryHooks = {
    // Only imperative methods
    getDomainById: (domainId: number) => domainByIdConfig.fetch({ pathParams: { id: domainId } }),
    createDomain: (data: CreateDomainRequest) => domainByIdConfig.mutate({ requestData: data }),
    updateDomain: (domainId: number, data: UpdateDomainRequest) => domainByIdConfig.mutate({ 
        requestData: data, 
        pathParams: { id: domainId } 
    }),
    deleteDomain: (domainId: number) => domainByIdConfig.mutate({ 
        pathParams: { id: domainId } 
    }),
};
```

### Phase 10: Update GenericList Final Version

#### 10.1 Remove Hook Support from GenericList
**File**: `frontend/src/components/generic-list/GenericList.tsx`

**Final version**:
```typescript
interface GenericListProps<T> {
    storageKey: string;
    columns: ColumnDef<T>[];
    dataFetcher: () => Promise<{ results: T[]; total: number }>; // Required, no more queryHook
    itemDesc?: string;
    initialLimit?: number;
    routes?: RouteConfig[];
    functions?: GenericListFunctions<T>;
    deleteServiceFunction?: (id: string | number) => Promise<void>;
    basePath?: string;
    isOptionSelector?: boolean;
    selectedIds?: (string | number)[];
    onSelectedIdsChange?: (selectedIds: (string | number)[]) => void;
}

export function GenericList<T>({
    storageKey,
    columns,
    dataFetcher, // Only imperative API
    // ... other props
}: GenericListProps<T>) {
    const [data, setData] = useState<T[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const result = await dataFetcher();
            setData(result.results);
            setTotal(result.total);
        } catch (err) {
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [dataFetcher]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ... rest of component logic
}
```

## Implementation Order

### Step 1: Update QueryHooksFactory
1. Add imperative methods to QueryHooksFactory
2. Update all QueryHooks files to include imperative methods
3. Test that both hooks and imperative methods work

### Step 2: Update GenericList
1. Add dataFetcher prop to GenericList
2. Update GenericList to support both dataFetcher and queryHook
3. Test GenericList with both approaches

### Step 3: Update List Components
1. Update all list components to use dataFetcher
2. Test all list pages

### Step 4: Update Character Components
1. Update character tabs to use imperative API
2. Test character creation and editing

### Step 5: Update Edit Components
1. Update all edit components to use imperative API
2. Test all edit functionality

### Step 6: Update Cache Functions
1. Update cache functions to use imperative API
2. Test cache functionality

### Step 7: Update SelectedEntityDisplay
1. Update SelectedEntityDisplay to use imperative API
2. Test entity display functionality

### Step 8: Update Service Components
1. Update all service components to use imperative API
2. Test service functionality

### Step 9: Remove Hook Dependencies
1. Remove useQuery and useMutation from QueryHooksFactory
2. Remove all hook exports from QueryHooks files
3. Remove queryHook support from GenericList

### Step 10: Final Testing
1. Test entire application
2. Verify no hook-related errors
3. Verify all functionality works

## Benefits After Implementation

### ✅ Eliminated Problems:
- No more Rules of Hooks violations
- No more hardcoded query limits
- No more complex hook dependencies
- No more unnecessary re-renders

### ✅ Simplified Components:
- GenericList becomes much simpler
- Character tabs become more predictable
- Edit components become more straightforward
- Cache functions become more reliable

### ✅ Better Performance:
- Only fetch data when needed
- Better cache control
- No unnecessary re-renders
- More predictable data flow

### ✅ Dynamic Query Management:
- True dynamic query creation
- No hardcoded limits
- Perfect for ChoicesTab use case
- Scalable to any number of queries

## Testing Strategy

### Unit Tests:
- Test all imperative methods
- Test error handling
- Test loading states

### Integration Tests:
- Test GenericList with dataFetcher
- Test character creation flow
- Test edit component flows

### End-to-End Tests:
- Test complete user workflows
- Test all CRUD operations
- Test character feature system

## Rollback Plan

If issues arise, the implementation can be rolled back by:
1. Reverting QueryHooksFactory changes
2. Reverting GenericList changes
3. Reverting component changes
4. All changes are isolated and can be reverted independently

## Success Criteria

- [ ] All list components work with dataFetcher
- [ ] All character tabs work with imperative API
- [ ] All edit components work with imperative API
- [ ] ChoicesTab supports unlimited dynamic queries
- [ ] No Rules of Hooks violations
- [ ] No hardcoded query limits
- [ ] All existing functionality preserved
- [ ] Performance improved or maintained
- [ ] Code is simpler and more maintainable
