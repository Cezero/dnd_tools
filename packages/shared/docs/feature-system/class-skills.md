# Class Skills Implementation

*Complete guide to how class skills are modeled and implemented in the feature system.*

## Overview

Class skills in the D&D Tools system are implemented using the **Feature System** with normal features and `EntityType.Base` entities. Each class has a `Feature` (e.g., "Fighter Class Skills") that contains multiple `FeatureEntity` records with `EntityType.Base`, each representing a different class skill. The Feature is linked to the class via `FeatureClassMap`.

## Database Schema Structure

### **Core Entities**

1. **`Feature`** - The base feature definition
   ```sql
   -- Normal feature for class skills (e.g., "Fighter Class Skills")
   id: Auto-generated feature ID
   slug: "class-{classId}-skills"
   name: "{ClassName} Class Skills"
   description: "Class skills for {ClassName}"
   displayInCharacterSheet: true
   ```

2. **`FeatureProgression`** - Links the feature to a specific class
   ```sql
   -- Progression for class skills
   featureId: Normal feature ID (not a special ID)
   level: 1 (class skills are level 1 features)
   sourceType: FeatureSourceType.Class (1)
   -- Linked via FeatureClassMap many-to-many relationship
   ```

3. **`FeatureEntity`** - Individual skills within the class skills feature
   ```sql
   -- Each class skill is an entity with EntityType.Base
   featureId: Links to the Feature
   type: EntityType.Base (4) -- Base type for class mechanics
   appliesTo: EntityAppliesToType.Skill (1)
   appliesToId: The specific skill ID (e.g., Climb = 1, Jump = 2)
   appliesToSubId: SkillSubtype.id for a specific subtype (not a 1-based ordinal).
                   null = the whole skill; -1 = all subtypes (e.g. Wizard Knowledge)
   value: 0 (no bonus value - just marking as class skill)
   bonusType: null (Base entities don't use bonus types)
   ```

## EntityType.Base Pattern

Class skills use `EntityType.Base` entities to represent base mechanics. This is consistent with other class mechanics like BAB, saving throws, and skill points.

**Key Pattern**:
- `EntityType.Base` (4) - Identifies base mechanics entities
- `EntityAppliesToType.Skill` (1) - Identifies skill-related entities
- `sourceType: FeatureSourceType.Class` (1) - Identifies class-granted features

## Frontend Implementation

### **ClassSkillService**

The `ClassSkillService` provides three main functions for managing class skills:

#### **1. getClassSkills() - Extract skill IDs**
```typescript
getClassSkills(progressions: FeatureProgression[]): number[] {
    return progressions
        .filter(prog => prog.sourceType === FeatureSourceType.Class)
        .flatMap(prog =>
            prog.entities
                ?.filter(entity => 
                    entity.type === EntityType.Base &&
                    entity.appliesTo === EntityAppliesToType.Skill && 
                    entity.appliesToId
                )
                .map(entity => entity.appliesToId) || []
        )
        .filter(id => id > 0);
}
```

#### **2. addSkill() - Add a skill to class skills**
```typescript
addSkill(
    featureProgressions: FeatureProgression[],
    setFeatureProgressions: (progressions: FeatureProgression[]) => void,
    skillId: number,
    classId: number,
    subtypeId?: number | null
) {
    // Find existing class skills progression (class progression with Base skill entities)
    let classSkillsProgression = featureProgressions.find(fp =>
        fp.sourceType === FeatureSourceType.Class &&
        fp.classes?.some(c => c.classId === classId) &&
        fp.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Skill)
    );

    if (!classSkillsProgression) {
        // Create new progression - backend will create the feature
        const tempFeatureId = Math.floor(Date.now() + Math.random() * 1000);
        classSkillsProgression = {
            id: Math.floor(Date.now() + Math.random() * 1000),
            featureId: tempFeatureId,
            sourceType: FeatureSourceType.Class,
            level: 1,
            feature: {
                id: tempFeatureId,
                slug: `class-${classId}-skills`,
                name: 'Class Skills',
                description: 'Class skill feature',
                displayInCharacterSheet: true,
            },
            classes: [{ classId }],
            entities: [],
        };
    }

    // Check if this specific skill/subtype is already added
    const existingEntity = classSkillsProgression.entities?.find(e =>
        e.type === EntityType.Base &&
        e.appliesTo === EntityAppliesToType.Skill &&
        e.appliesToId === skillId &&
        e.appliesToSubId === subtypeId
    );

    if (existingEntity) {
        return; // Already exists
    }

    // Add the skill as a Base entity
    const newEntity = {
        id: Math.floor(Date.now() + Math.random() * 1000),
        progressionId: classSkillsProgression.id,
        type: EntityType.Base,
        appliesTo: EntityAppliesToType.Skill,
        appliesToId: skillId,
        appliesToSubId: subtypeId || null,
        value: 0,
        bonusType: null,
        displayInDetail: true,
        filterType: null,
        groupingId: 1,
    };

    const updatedProgressions = featureProgressions.map(p => 
        p.id === classSkillsProgression.id
            ? { ...p, entities: [...(p.entities || []), newEntity] }
            : p
    );

    if (!featureProgressions.some(p => p.id === classSkillsProgression.id)) {
        updatedProgressions.push({ ...classSkillsProgression, entities: [newEntity] });
    }

    setFeatureProgressions(updatedProgressions);
}
```

#### **3. removeSkill() - Remove a skill from class skills**
```typescript
removeSkill(
    featureProgressions: FeatureProgression[],
    setFeatureProgressions: (progressions: FeatureProgression[]) => void,
    skillId: number
) {
    const updatedProgressions = featureProgressions.map(prog => {
        if (prog.sourceType === FeatureSourceType.Class &&
            prog.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Skill)) {
            // Remove the specific skill entity
            const updatedEntities = prog.entities?.filter(entity =>
                !(entity.type === EntityType.Base &&
                  entity.appliesTo === EntityAppliesToType.Skill &&
                  entity.appliesToId === skillId)
            ) || [];

            return { ...prog, entities: updatedEntities };
        }
        return prog;
    });

    // Remove the progression entirely if it has no entities left
    const finalProgressions = updatedProgressions.filter(prog =>
        !(prog.sourceType === FeatureSourceType.Class &&
          prog.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Skill)) ||
        (prog.entities && prog.entities.length > 0)
    );

    setFeatureProgressions(finalProgressions);
}
```

## Backend Processing

### **Class Service Integration**

The `classService` handles class skills as part of the bulk feature operations:

1. **Creating/Updating Classes**: Class skills are included in the `features` array
2. **Database Storage**: Creates appropriate `Feature` and `FeatureEntity` records
3. **No Individual CRUD**: Class skills cannot be modified individually

### **Example Backend Data Structure**

```typescript
// Feature for class skills
{
    id: 1001,
    slug: "class-5-skills",
    name: "Fighter Class Skills",
    description: "Class skills for Fighter",
    displayInCharacterSheet: true
}

// FeatureProgression for class skills
{
    id: 123,
    featureId: 1001, // Normal feature ID
    sourceType: FeatureSourceType.Class, // 1
    level: 1,
    // Linked via FeatureClassMap to classId: 5
    entities: [
        {
            id: 456,
            type: EntityType.Base, // 4
            appliesTo: EntityAppliesToType.Skill, // 1
            appliesToId: 1, // Climb skill
            appliesToSubId: null,
            value: 0,
            bonusType: null
        },
        {
            id: 457,
            type: EntityType.Base,
            appliesTo: EntityAppliesToType.Skill,
            appliesToId: 2, // Jump skill
            appliesToSubId: null,
            value: 0,
            bonusType: null
        }
    ]
}
```

## Frontend UI Integration

### **Skills Tab**

The `SkillsTab` component uses the `ClassSkillService` to manage class skills:

```typescript
// Add skill handler
const handleAddSkill = (skillId: number) => {
    if (!setFeatureProgressions) return;
    ClassSkillService.addSkill(
        featureProgressions as FeatureProgressionWithRelations[],
        setFeatureProgressions,
        skillId,
        parseInt(id || '0')
    );
};

// Remove skill handler
const handleRemoveSkill = (skillId: number) => {
    if (!setFeatureProgressions) return;
    ClassSkillService.removeSkill(
        featureProgressions as FeatureProgressionWithRelations[],
        setFeatureProgressions,
        skillId
    );
};

// Get current class skills
const classSkills = ClassSkillService.getClassSkills(
    featureProgressions as FeatureProgressionWithRelations[]
);
```

### **Class Display**

The `ClassDisplay` component extracts and displays class skills:

```typescript
// Class skills are identified by checking for EntityType.Base + EntityAppliesToType.Skill entities
const hasClassSkills = progression.sourceType === FeatureSourceType.Class &&
    progression.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Skill);

// Extract skill IDs from entities
const classSkills = progression.entities
    ?.filter(entity =>
        entity.type === EntityType.Base &&
        entity.appliesTo === EntityAppliesToType.Skill &&
        entity.appliesToId
    )
    .map(entity => ({
        skillId: entity.appliesToId,
                modifier: modifier
            })) || []
    ) || [];
```

## Key Design Principles

### **1. Container Pattern**
- One `FeatureProgression` contains multiple `FeatureEntity` records
- Each entity represents a different class skill
- The progression acts as a container for all class skills

### **2. Normal Feature Pattern**
- Uses normal `Feature` records with descriptive names (e.g., "Fighter Class Skills")
- Each class has its own feature for class skills
- Features are linked via `FeatureClassMap` many-to-many relationship

### **3. Base Entity Approach**
- Each class skill is represented as an entity with `EntityType.Base`
- `EntityType.Base` is used for all class mechanics (BAB, saves, skills, proficiencies)
- `value: 0` indicates no bonus value - just marking as class skill
- `appliesToId` contains the specific skill ID
- `appliesToSubId` is `SkillSubtype.id` (for example Knowledge (nature) is 92, not ordinal 7). Use `null` for a skill with no subtype and `-1` when every subtype is a class skill.

### **4. Bulk Operations Only**
- Class skills are only modified as part of class creation/update
- No individual CRUD operations on class skills
- Maintains consistency with the broader feature system

## Usage Examples

### **Creating a Fighter with Class Skills**

```typescript
const fighterClass = {
    name: "Fighter",
    hitDie: 10,
    skillPoints: 4,
    features: [
        {
            sourceType: FeatureSourceType.Class, // 1
            level: 1,
            featureId: null, // Backend will create feature
            feature: {
                name: "Fighter Class Skills",
                slug: "class-5-skills",
                description: "Class skills for Fighter",
                displayInCharacterSheet: true
            },
            entities: [
                {
                    type: EntityType.Base, // 4
                    appliesTo: EntityAppliesToType.Skill, // 1
                    appliesToId: 1, // Climb
                    appliesToSubId: null,
                    value: 0,
                    bonusType: null
                },
                {
                    type: EntityType.Base,
                    appliesTo: EntityAppliesToType.Skill,
                    appliesToId: 2, // Jump
                    appliesToSubId: null,
                    value: 0,
                    bonusType: null
                }
            ]
        }
    ]
};

await ClassService.createClass(fighterClass);
```

### **Adding a Skill via Frontend**

```typescript
// In SkillsTab component
const handleAddSkill = (skillId: number) => {
    ClassSkillService.addSkill(
        featureProgressions,
        setFeatureProgressions,
        skillId,
        classId
    );
};

// Usage
<CustomSelect
    onValueChange={(value) => {
        if (value) {
            handleAddSkill(value as number);
        }
    }}
    options={SKILL_SELECT_LIST.filter(skill => !classSkills.includes(skill.value))}
    placeholder="Select a skill to add"
/>
```

## Benefits of This Approach

1. **Consistency**: Uses the same feature system as other class abilities
2. **Flexibility**: Easy to add/remove skills dynamically
3. **Performance**: Efficient querying and filtering
4. **Maintainability**: Clear separation of concerns
5. **Extensibility**: Can easily add skill-specific bonuses or conditions

## Common Patterns

### **Filtering Class Skills**
```typescript
// Get all class skill progressions
const classSkillProgressions = progressions.filter(prog =>
    prog.sourceType === FeatureSourceType.Class &&
    prog.entities?.some(e => e.type === EntityType.Base && e.appliesTo === EntityAppliesToType.Skill)
);

// Get skill IDs from entities
const skillIds = classSkillProgressions.flatMap(prog =>
    prog.entities
        ?.filter(entity => 
            entity.type === EntityType.Base &&
            entity.appliesTo === EntityAppliesToType.Skill && 
            entity.appliesToId
        )
        .map(entity => entity.appliesToId) || []
);
```

### **Checking if Skill is Class Skill**
```typescript
const isClassSkill = (skillId: number, skillSubId: number | null): boolean => {
    return progressions.some(prog =>
        prog.sourceType === FeatureSourceType.Class &&
        prog.entities?.some(entity =>
            entity.type === EntityType.Base &&
            entity.appliesTo === EntityAppliesToType.Skill &&
            entity.appliesToId === skillId &&
            (entity.appliesToSubId === skillSubId || entity.appliesToSubId === -1)
        )
    );
};
```

For more details on the feature system, see **[README.md](README.md)** and **[Examples](examples.md)**.
