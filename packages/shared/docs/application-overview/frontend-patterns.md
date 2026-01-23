# Frontend Patterns

*Consolidated documentation for shared frontend patterns, architecture principles, and best practices across all systems in D&D Tools.*

## 📋 **Overview**

This document consolidates shared frontend patterns, architecture principles, and best practices that are common across all systems. It provides a single source of truth for frontend development standards and patterns.

**Related Documentation**:
- [Frontend API Patterns](frontend-api-patterns.md) - API calling patterns using typedApi
- [Frontend Components](frontend-components.md) - Shared component patterns
- [Character Management Frontend Components](../character-management/frontend-components.md) - Character-specific frontend components
- [Backend Implementation Patterns](backend-implementation.md) - Backend patterns including ID handling

## 🏗️ **State Synchronization Patterns**

### **State → useEffect → applyUpdate Pattern**

The standardized pattern for synchronizing local state changes with backend services.

**Purpose**: Centralize state synchronization logic, ensure consistency, and reduce bugs from forgotten sync calls.

**How It Works**:
1. **Component updates state**: Component calls `updateState()` to modify local state
2. **Parent component syncs automatically**: Parent component has `useEffect` hooks that watch state changes
3. **Automatic sync**: When state changes, useEffect automatically calls backend API to sync changes
4. **State flows back**: Backend updates are reflected back in state/resolved data

**Benefits**:
- **Centralized sync logic**: All sync happens in parent component, easier to maintain
- **Components are simpler**: Child components don't need to know about backend APIs
- **Automatic sync**: No risk of forgetting to sync - it's automatic
- **React-idiomatic**: Uses effects to react to state changes
- **Consistent**: All components work the same way
- **Easier to test**: Can test state updates separately from sync logic

**When to Use**:
- When state changes need to be synced to a backend service
- When multiple components update the same state
- When you want centralized sync logic
- When state is the source of truth and sync is derived

**When NOT to Use**:
- For operations that update the database directly (use API call → refreshState pattern instead)
- When you need immediate, synchronous sync (use direct API calls instead)
- When sync logic is component-specific and shouldn't be centralized

**Example Implementation**:

```typescript
// In child component (tab)
updateState({ type: SET_SKILL_RANKS, payload: { skillRanks: newRanks } });

// In parent component (CharacterEdit)
useEffect(() => {
  if (state.skillRanks !== prevSkillRanksRef.current) {
    resolution.applyUpdate({
      type: 'SET_SKILL_RANK',
      payload: { ...skillRankData }
    });
  }
  prevSkillRanksRef.current = state.skillRanks;
}, [state.skillRanks]);
```

**Canonical Example**: Character Edit Tabs
- All character edit tabs follow this pattern
- CharacterEdit component has useEffect hooks for each state field
- Tabs just update state, sync happens automatically

**Source Files**:
- CharacterEdit: `apps/frontend/src/features/character/CharacterEdit.tsx`
- Tab Components: `apps/frontend/src/features/character/tabs/*Tab.tsx`

**Related Documentation**:
- [Character Management Frontend Components](../character-management/frontend-components.md#character-edit-tab-architecture) - Detailed tab architecture documentation

### **API Call → refreshState Pattern**

The standardized pattern for operations that update the database directly.

**Purpose**: Handle operations that bypass state and update the database directly, then refresh derived state.

**How It Works**:
1. **Component calls API**: Component calls backend API that updates database directly
2. **Backend updates session**: Backend automatically updates resolution session if one exists
3. **Frontend refreshes state**: Frontend calls `refreshState()` to refresh resolution state from server
4. **State updates**: Resolved data flows back to components via props

**Benefits**:
- **Clear separation**: Database operations vs. state synchronization
- **Consistent responses**: Response schemas don't include derived state
- **Flexible**: Works for any direct database operation
- **Maintainable**: Clear pattern for when to use vs. state-based updates

**When to Use**:
- For operations that update the database directly (e.g., spell add/remove)
- When backend automatically updates related state (e.g., resolution session)
- When response should only contain operation-specific data

**When NOT to Use**:
- For state-based updates (use state → useEffect → applyUpdate pattern instead)
- When you need to include derived state in response (use state-based pattern)

**Example Implementation**:

```typescript
// In component
await CharacterQueryHooks.addSpellKnown({...});

// Refresh resolution state to sync with backend changes
if (resolution.sessionId) {
  await resolution.refreshState();
}
```

**Canonical Example**: Spell Selection Tab
- Spell operations update database directly
- Backend updates resolution session automatically
- Frontend refreshes state separately

**Source Files**:
- SpellSelectionTab: `apps/frontend/src/features/character/tabs/SpellSelectionTab.tsx`
- useCharacterResolution: `apps/frontend/src/features/character/useCharacterResolution.ts`

**Related Documentation**:
- [Character Resolution System](../character-management/character-resolution-system.md) - Resolution system documentation

### **Always Send IDs Pattern**

The standardized pattern for frontend→backend data flow where the frontend always includes IDs for all items, regardless of whether they are new or existing.

**Purpose**: Eliminate frontend logic for distinguishing new vs existing items by always sending IDs and letting the backend handle ID resolution.

**How It Works**:
1. **Frontend always generates IDs**: For new items, frontend generates temporary IDs using `Date.now() + Math.random()`
2. **Frontend always sends IDs**: All items (new and existing) are sent with IDs included
3. **Backend distinguishes IDs**: Backend uses `isTemporaryId()` to identify temporary vs real database IDs
4. **Backend handles resolution**: Backend creates new items for temporary IDs, updates existing items for real IDs

**Temporary ID Format**:
- Generated using `Date.now() + Math.random()`
- Creates very large numbers (Date.now() is ~1.7 trillion as of 2024)
- May have decimal parts (from Math.random())
- Always >= 1 billion

**Real Database ID Format**:
- Positive integers (no decimals)
- Typically much smaller (< 1 billion in practice)
- Assigned by database auto-increment

**Benefits**:
- **No frontend logic needed**: Frontend doesn't need to track whether items are new or existing
- **Consistent data flow**: All items follow the same pattern
- **Simpler frontend code**: No conditional logic for new vs existing items
- **Backend handles complexity**: Backend is responsible for ID resolution logic
- **Type safety**: Schemas allow optional IDs, enabling this pattern

**When to Use**:
- ✅ When creating or updating entities with nested relationships (e.g., classes with feature progressions)
- ✅ When frontend needs to track items before they're saved
- ✅ When you want to eliminate frontend logic for new vs existing items
- ✅ For all frontend→backend interactions involving entities with IDs

**When NOT to Use**:
- ❌ For simple CRUD operations where new vs existing is obvious from context
- ❌ When IDs would add unnecessary complexity

**Example Implementation**:

```typescript
// Frontend: Always generate temporary IDs for new items
const createFeatureProgression = (baseProgression: Partial<FeatureProgression>): FeatureProgression => {
    return {
        id: Date.now() + Math.random(), // Temporary ID - always generated
        sourceType: FeatureSourceType.Class,
        level: 1,
        ...baseProgression,
    } as FeatureProgression;
};

// Frontend: Always send IDs (temporary for new, real for existing)
const classData = {
    ...formData,
    features: featureProgressions.map(prog => {
        // Include id - backend will handle resolution
        return { ...prog };
    })
};

// Backend: Distinguish temporary vs real IDs
function isTemporaryId(id: number): boolean {
    return !Number.isInteger(id) || id >= 1000000000;
}

const hasRealId = (p: Progression): boolean => {
    return 'id' in p && typeof p.id === 'number' && !isTemporaryId(p.id);
};
```

**Canonical Examples**:
- **ClassEdit**: `apps/frontend/src/features/class/ClassEdit.tsx`
  - `createFeatureProgression` always generates temporary IDs
  - Form submission always includes IDs
- **RaceEdit**: `apps/frontend/src/features/race/RaceEdit.tsx`
  - `handleAddFeature` always generates temporary IDs
  - Form submission always includes IDs

**Backend Implementation**:
- **classService**: `apps/backend/src/features/class/classService.ts`
  - `isTemporaryId()` distinguishes temporary vs real IDs
  - `hasId()` filters out temporary IDs to identify updates

**Schema Requirements**:
- Request schemas must allow optional `id` field
- Use `UpdateFeatureProgressionSchema` instead of `CreateFeatureProgressionRequestSchema` for schemas that need to support both create and update operations

**Related Documentation**:
- [Backend Implementation Patterns](backend-implementation.md#id-handling-pattern) - Backend ID handling documentation

## 🔧 **Pattern Selection Guide**

### **When to Use State → useEffect → applyUpdate**:
- ✅ State changes that need backend sync
- ✅ Multiple components updating same state
- ✅ Want centralized sync logic
- ✅ State is source of truth

### **When to Use API Call → refreshState**:
- ✅ Direct database operations
- ✅ Backend updates related state automatically
- ✅ Response should only contain operation data
- ✅ Operations that bypass state

## 📚 **Related Documentation**

- **[Character Management Frontend Components](../character-management/frontend-components.md)** - Character-specific frontend components with tab architecture
- **[Character Resolution System](../character-management/character-resolution-system.md)** - Backend resolution system and frontend integration
- **[Frontend Components](frontend-components.md)** - Shared component patterns and architecture
