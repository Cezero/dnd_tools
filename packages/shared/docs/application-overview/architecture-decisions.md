# Architecture Decision Records

*Documentation of key architectural decisions, their rationale, and trade-offs.*

## 📋 **Overview**

This document contains Architecture Decision Records (ADRs) for key architectural decisions made in the D&D Tools project. Each ADR documents the decision, context, rationale, and trade-offs.

## 🏗️ **Character Edit Tab State Synchronization Pattern**

**Status**: Accepted  
**Date**: 2024  
**Decision**: Use state → useEffect → applyUpdate pattern for all character edit tabs

### **Context**

Character edit tabs had inconsistent patterns for synchronizing state changes with the backend resolution session:

- **Pattern 1**: Tabs update state, CharacterEdit useEffect hooks automatically sync (used by AbilitiesRaceTab, ClassTab, FeatsTab)
- **Pattern 2**: Tabs update state AND directly call `resolution.applyUpdate()` (used by ChoicesTab, SkillsTab)
- **Pattern 3**: Tabs call API directly and use `updateResolvedCharacter()` with response data (used by SpellSelectionTab)

This inconsistency made the codebase harder to maintain and understand.

### **Decision**

Standardize on **Pattern 1: State → useEffect → applyUpdate** for all tabs that update state.

For operations that update the database directly (e.g., spell add/remove), use **API Call → refreshState** pattern.

### **Rationale**

**Benefits of State → useEffect → applyUpdate Pattern**:
1. **Centralized sync logic**: All sync happens in CharacterEdit, easier to maintain
2. **Tabs are simpler**: Tabs don't need to know about resolution API
3. **Automatic sync**: No risk of forgetting to sync - it's automatic
4. **React-idiomatic**: Uses effects to react to state changes
5. **Consistent**: All tabs work the same way
6. **Easier to add new tabs**: Just update state, sync happens automatically
7. **Single source of truth**: State is the source, sync is derived

**Benefits of API Call → refreshState Pattern**:
1. **Clear separation**: Database operations vs. state synchronization
2. **Consistent responses**: Response schemas don't include derived state
3. **Flexible**: Works for any direct database operation
4. **Maintainable**: Clear pattern for when to use vs. state-based updates

### **Trade-offs**

**State → useEffect → applyUpdate Pattern**:
- **Slight delay**: useEffect runs after render (usually imperceptible < 16ms)
- **Need refs for tracking**: Must track previous values to avoid initial sync
- **CharacterEdit complexity**: More useEffect hooks (but centralized)
- **Potential for multiple syncs**: If not careful with dependencies

**API Call → refreshState Pattern**:
- **Extra API call**: Requires additional call to refresh state
- **Slightly more complex**: Two-step process (API call + refresh)

### **Consequences**

**Positive**:
- All tabs now work consistently
- Easier to maintain and extend
- Clear patterns for future development
- Reduced bugs from forgotten sync calls

**Negative**:
- CharacterEdit has more useEffect hooks (but they're centralized)
- Slight delay from useEffect (usually imperceptible)
- Need to track previous values with refs

### **Implementation**

1. Added useEffect hooks in CharacterEdit for:
   - `skillRanks` → sync to `SET_SKILL_RANK` updates
   - `featureChoices` → sync to `MAKE_CHOICE` updates

2. Removed direct `applyUpdate` calls from tabs:
   - Removed `handleSkillRankUpdate` calls from SkillsTab
   - Removed `handleChoiceSelection` calls from ChoicesTab

3. Updated SpellSelectionTab:
   - Removed `resolvedCharacter` from response schemas
   - Uses `resolution.refreshState()` after operations

4. Added comprehensive documentation:
   - JSDoc comments in code
   - Shared documentation files
   - Architecture decision record

### **Related Documentation**

- [Character Management Frontend Components](../character-management/frontend-components.md#character-edit-tab-architecture) - Detailed tab architecture documentation
- [Frontend Patterns](frontend-patterns.md) - General frontend patterns documentation
- [Character Resolution System](../character-management/character-resolution-system.md) - Resolution system documentation

### **References**

- CharacterEdit: `apps/frontend/src/features/character/CharacterEdit.tsx`
- Tab Components: `apps/frontend/src/features/character/tabs/*Tab.tsx`
- useCharacterResolution: `apps/frontend/src/features/character/useCharacterResolution.ts`
