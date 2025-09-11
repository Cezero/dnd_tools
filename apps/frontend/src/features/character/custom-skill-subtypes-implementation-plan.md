# Custom Skill Subtypes Implementation Plan

## Overview

This document outlines the implementation plan for adding custom skill subtypes to the D&D Tools application. The feature will allow users to specify subtypes for Craft, Knowledge, Perform, and Profession skills, with Craft and Knowledge using predefined enums and Perform/Profession using free-form text input.

## Architecture Changes

### Database Schema Changes

#### AdvancementSkill Model Extension
- Add `customSubtype` field to `AdvancementSkill` model
- Field type: `String?` (nullable)
- Purpose: Store custom subtype information for character skills

```prisma
model AdvancementSkill {
    advancementId Int
    skillId       Int
    pointsSpent   Int
    customSubtype String?  // NEW: For custom subtypes
    
    advancement CharacterAdvancement @relation(fields: [advancementId], references: [id])
    skill       Skill                @relation(fields: [skillId], references: [id])

    @@id([advancementId, skillId])
}
```

### Static Data Restructuring

#### Knowledge Skill Consolidation
- Replace individual Knowledge skills (IDs 19-28) with single consolidated Knowledge skill (ID 19)
- Create `KNOWLEDGE_SKILL_MAP` following the existing `CRAFT_SKILL_MAP` pattern
- Update `SKILL_MAP` to use consolidated Knowledge skill

#### New Static Data Structures
- `KNOWLEDGE_SKILL` enum with subtype IDs
- `KNOWLEDGE_SKILL_MAP` mapping enum to display names
- `KNOWLEDGE_SKILL_LIST` and `KNOWLEDGE_SKILL_SELECT_LIST` for UI components

### Feature System Integration

#### appliesToSubId Usage
- Use `appliesToSubId: -1` to represent "all subtypes" in Feature System
- Update class skill definitions to use single entries for Craft/Knowledge with `appliesToSubId: -1`
- Example: Bard's ClassSkill feature would have one entry for Knowledge with `appliesToSubId: -1` instead of 10 separate entries

## Implementation Tasks

### Phase 1: Database and Schema Foundation

#### Task 1.1: Database Schema Update
- [X] Add `customSubtype` field to `AdvancementSkill` model in `backend/prisma/schema.prisma`
- [X] Generate and apply database migration
- [X] Update Prisma client

#### Task 1.2: Zod Schema Updates
- [X] Update `AdvancementSkillSchema` in character advancement schema files
- [X] Add `customSubtype: z.string().max(100).optional()` field
- [X] Update related create/update schemas

#### Task 1.3: Static Data Restructuring
- [X] Create `KNOWLEDGE_SKILL` enum in `packages/shared/static-data/src/SkillData.ts`
- [X] Create `KNOWLEDGE_SKILL_MAP` following `CRAFT_SKILL_MAP` pattern
- [X] Create `KNOWLEDGE_SKILL_LIST` and `KNOWLEDGE_SKILL_SELECT_LIST`
- [X] Update `SKILL_MAP` to replace individual Knowledge skills (20-28) with consolidated Knowledge skill (19)
- [X] Export new Knowledge skill constants

### Phase 2: Feature System Updates

#### Task 2.1: Feature System Component Updates
- [X] Update `getAppliesToSelectOptions` function to include Craft and Knowledge subtypes
- [X] Add Craft subtypes as "Craft (subtype)" options to skill selection
- [X] Add Knowledge subtypes as "Knowledge (subtype)" options to skill selection
- [X] No changes needed to AppliesToSelector component (follows existing pattern)

#### Task 2.2: Class Skill Configuration Updates
- [X] Update class skill configuration UI to support subtype selection
- [X] Add Craft and Knowledge subtypes to skill selection dropdown
- [X] Update skill display logic to handle Craft and Knowledge subtypes
- [X] Handle skill name formatting for subtypes (e.g., "Craft (Alchemy)")
- [ ] Update class skill display to show subtype information

#### Task 2.3: Feature System Logic Updates
- [X] Update ClassSkillService to handle `appliesToSubId: -1` for "all subtypes"
- [X] Update character SkillsTab to use feature system for class skill checking
- [X] Handle Craft and Knowledge "all subtypes" expansion in getClassSkills()
- [ ] Update feature progression validation for subtype support
- [X] Update formatters to include ' (<subtype>)' suffix to Skill formatter based on appliesToSubId (for Craft and Knowledge skills)
- [X] Add helper function to get skill names including subtypes
- [X] Update classSkillLabeler to handle Craft and Knowledge subtypes
- [X] Update skillModifierLabeler to handle Craft and Knowledge subtypes

### Phase 3: Character System Updates

#### Task 3.1: SkillsTab Component Updates
- [X] Add `getSubtypeInputType()` function to determine input type for each skill
- [X] Add `getSubtypeOptions()` function for Craft and Knowledge skills
- [X] Add `handleCustomSubtypeChange()` function
- [X] Update `handleSkillChange()` to accept custom subtype parameter
- [X] Add subtype input UI to skill rows
- [X] Update skill display to show subtype in parentheses
- [X] Add helper functions for custom subtype management

#### Task 3.2: Character Skill Logic Updates
- [X] Update `isSkillClassSkill()` function to handle consolidated Knowledge skill
- [X] Update skill total calculation to handle custom subtypes
- [X] Update skill display logic to show only Knowledge subtypes with ranks
- [X] Add validation for custom subtype requirements

#### Task 3.3: Character Advancement Service Updates
- [X] Update character advancement service to handle custom subtypes
- [X] Add `customSubtype` parameter to skill update functions
- [X] Update skill creation/update logic to store custom subtypes
- [X] Add validation for custom subtype data

### Phase 4: UI/UX Enhancements

#### Task 4.1: SkillsTab UI Improvements
- [X] Add visual indicators for skills that support subtypes
- [X] Improve layout for subtype input fields
- [X] Add placeholder text for subtype inputs
- [X] Add validation messages for required subtypes

#### Task 4.2: Feature System UI Improvements
- [X] Add visual indicators for subtype selection in Feature System
- [X] Improve subtype selection dropdown styling
- [X] Add help text for "All Subtypes" option
- [X] Update feature display to show subtype information

#### Task 4.3: Class Configuration UI Improvements
- [X] Update class skill selection UI to show subtype options
- [X] Add visual grouping for skills with subtypes
- [X] Improve class skill display to show subtype information
- [X] Add validation feedback for subtype selection

### Phase 5: Documentation updates

#### Task 5.1: Update shared/docs
- [ ] Update skill-system documentation
- [ ] Update class-system documentation
- [ ] Update formatting-system documentation
- [ ] Update character-management documentation

## Technical Implementation Details

### Skill Subtype Input Types

```typescript
const getSubtypeInputType = (skillId: number): 'enum' | 'freeform' | 'none' => {
    if (skillId === 6) return 'enum'; // Craft - use CRAFT_SKILL_MAP
    if (skillId === 19) return 'enum'; // Knowledge - use KNOWLEDGE_SKILL_MAP
    if ([32, 33].includes(skillId)) return 'freeform'; // Perform, Profession - free text
    return 'none'; // Other skills
};
```

### Feature System Subtype Handling

```typescript
// Example: Bard ClassSkill feature progression
// BEFORE: Multiple entries for each Knowledge skill
[
    { appliesTo: EntityAppliesToType.Skill, appliesToId: 19, appliesToSubId: null },
    { appliesTo: EntityAppliesToType.Skill, appliesToId: 20, appliesToSubId: null },
    // ... 8 more entries
]

// AFTER: Single entry for all Knowledge subtypes
[
    { appliesTo: EntityAppliesToType.Skill, appliesToId: 19, appliesToSubId: -1 }
]
```

### Character Skill Display Logic

```typescript
const getDisplayedSkills = () => {
    const baseSkills = getAllocatableSkills();
    const displayedSkills = [];
    
    baseSkills.forEach(skill => {
        if (skill.id === 19) { // Knowledge skill
            // Only show Knowledge subtypes that have ranks
            const knowledgeSubtypes = getKnowledgeSubtypesWithRanks();
            knowledgeSubtypes.forEach(subtype => {
                displayedSkills.push({
                    ...skill,
                    id: skill.id,
                    name: `Knowledge (${subtype.name})`,
                    subtypeId: subtype.id
                });
            });
        } else {
            displayedSkills.push(skill);
        }
    });
    
    return displayedSkills;
};
```

## File Locations

### Database Schema
- `apps/backend/prisma/schema.prisma`

### Static Data
- `packages/shared/static-data/src/SkillData.ts`

### Character Components
- `apps/frontend/src/features/character/tabs/SkillsTab.tsx`

### Feature System Components
- `apps/frontend/src/components/feature-system/FeatureProgressionDetailEdit/EntityDetailForm.tsx`
- `apps/frontend/src/features/class/tabs/SkillsTab.tsx`

### Schemas
- Character advancement schemas in `packages/shared/schema/src/`

## Success Criteria

- [ ] Users can select Craft subtypes from predefined enum
- [ ] Users can select Knowledge subtypes from predefined enum
- [ ] Users can enter free-form text for Perform and Profession subtypes
- [ ] Class skill configuration supports subtype selection
- [ ] Feature System handles "all subtypes" with `appliesToSubId: -1`
- [ ] Character sheet only displays Knowledge subtypes that have ranks
- [ ] All existing functionality continues to work
- [ ] Data migration completes successfully
- [ ] UI is intuitive and user-friendly

## Notes

- This implementation consolidates individual Knowledge skills into a single skill with subtypes
- The Feature System integration allows for efficient class skill definitions
- Custom subtypes are stored at the character advancement level, not in the base skill definitions
- The system maintains backward compatibility with existing skill data through migration
- All changes follow existing architectural patterns and conventions
