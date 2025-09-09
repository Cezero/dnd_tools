# Class Skills Implementation

*Complete guide to how class skills are modeled and implemented in the feature system.*

## Overview

Class skills in the D&D Tools system are implemented using the **Feature System** with a special container pattern. Each class has a single `FeatureProgression` that contains multiple `FeatureEntity` records, each representing a different class skill.

## Database Schema Structure

### **Core Entities**

1. **`Feature`** - The base feature definition
   ```sql
   -- Special feature for class skills (doesn't exist in features table)
   -- Uses SpecialFeatureId.ClassSkill = 1
   ```

2. **`FeatureProgression`** - Links the feature to a specific class
   ```sql
   -- Container progression for all class skills
   featureId: SpecialFeatureId.ClassSkill (1)
   classId: The class that gets these skills
   level: 1 (class skills are level 1 features)
   sourceType: 1 (Class)
   appliesToType: FeatureAppliesToType.Skill (0)
   appliesTo: null (container progression)
   ```

3. **`FeatureEntity`** - Individual skills within the class skills feature
   ```sql
   -- Each class skill is an entity
   featureProgressionId: Links to the FeatureProgression
   type: EntityType.Other (not a bonus, just marking as class skill)
   appliesTo: EntityAppliesToType.Skill (1)
   appliesToId: The specific skill ID (e.g., Climb = 1, Jump = 2)
   value: 0 (no bonus value - just marking as class skill)
   bonusType: null
   ```

## Special Feature ID System

```typescript
export const SpecialFeatureId = {
    ClassSkill: 1,
    ClassProficiency: 2,
} as const;
```

Class skills use `SpecialFeatureId.ClassSkill` (value: 1) as a reserved feature ID that doesn't correspond to an actual feature in the database.

## Frontend Implementation

### **ClassSkillService**

The `ClassSkillService` provides three main functions for managing class skills:

#### **1. getClassSkills() - Extract skill IDs**
```typescript
getClassSkills(progressions: FeatureProgressionWithRelations[]): number[] {
    return progressions
        .filter(prog => prog.featureId === SpecialFeatureId.ClassSkill && 
                       prog.appliesToType === FeatureAppliesToType.Skill)
        .flatMap(prog =>
            prog.modifiers
                ?.filter(mod => mod.appliesTo === ModifierAppliesToType.Skill && mod.appliesToId)
                .map(mod => mod.appliesToId) || []
        )
        .filter(id => id > 0);
}
```

#### **2. addSkill() - Add a skill to class skills**
```typescript
addSkill(
    featureProgressions: FeatureProgressionWithRelations[],
    setFeatureProgressions: (progressions: FeatureProgressionWithRelations[]) => void,
    skillId: number,
    classId: number
) {
    // Check if class skills progression already exists
    let classSkillsProgression = featureProgressions.find(fp =>
        fp.featureId === SpecialFeatureId.ClassSkill && 
        fp.appliesToType === FeatureAppliesToType.Skill
    );

    if (!classSkillsProgression) {
        // Create the main class skills progression if it doesn't exist
        classSkillsProgression = {
            id: Date.now() + Math.random(), // Temporary ID for frontend state
            featureId: SpecialFeatureId.ClassSkill,
            sourceType: 1, // 1 for Class
            classId: classId,
            raceId: null,
            level: 1, // Class skills are level 1 features
            appliesToType: FeatureAppliesToType.Skill,
            appliesTo: null, // No specific skill, this is the container progression
            feature: {
                id: SpecialFeatureId.ClassSkill,
                slug: 'class-skill',
                name: 'Class Skill',
                description: 'Class skill feature',
            },
            modifiers: [],
            choices: [],
            effects: [],
        };
        setFeatureProgressions([...featureProgressions, classSkillsProgression]);
        return;
    }

    // Check if this specific skill is already added
    const existingSkillModifier = classSkillsProgression.modifiers?.find(m =>
        m.appliesTo === ModifierAppliesToType.Skill && m.appliesToId === skillId
    );

    if (existingSkillModifier) {
        // Skill already exists, don't add duplicate
        return;
    }

    // Add the skill as a modifier to the existing progression
    const newModifier = {
        id: Date.now() + Math.random(), // Temporary ID
        featureProgressionId: classSkillsProgression.id,
        type: EntityType.Other, // Not a bonus, just marking as class skill
        appliesTo: EntityAppliesToType.Skill,
        appliesToId: skillId,
        formulaParamsId: null,
        value: 0, // No bonus value - just marking as class skill
        bonusType: null, // No bonus type needed
        appliesIfChoiceKey: null,
        appliesIfChoiceValue: null,
    };

    // Create a new array with the updated progression
    const updatedProgressions = featureProgressions.map(p => {
        if (p.id === classSkillsProgression.id) {
            return {
                ...p,
                modifiers: [...(p.modifiers || []), newModifier]
            };
        }
        return p;
    });

    setFeatureProgressions(updatedProgressions);
}
```

#### **3. removeSkill() - Remove a skill from class skills**
```typescript
removeSkill(
    featureProgressions: FeatureProgressionWithRelations[],
    setFeatureProgressions: (progressions: FeatureProgressionWithRelations[]) => void,
    skillId: number
) {
    const updatedProgressions = featureProgressions.map(prog => {
        if (prog.featureId === SpecialFeatureId.ClassSkill && 
            prog.appliesToType === FeatureAppliesToType.Skill) {
            // Remove the specific skill modifier
            const updatedModifiers = prog.modifiers?.filter(mod =>
                !(mod.appliesTo === ModifierAppliesToType.Skill && mod.appliesToId === skillId)
            ) || [];

            return {
                ...prog,
                modifiers: updatedModifiers
            };
        }
        return prog;
    });

    // Remove the progression entirely if it has no modifiers left
    const finalProgressions = updatedProgressions.filter(prog =>
        !(prog.featureId === SpecialFeatureId.ClassSkill && 
          prog.appliesToType === FeatureAppliesToType.Skill) ||
        (prog.modifiers && prog.modifiers.length > 0)
    );

    setFeatureProgressions(finalProgressions);
}
```

## Backend Processing

### **Class Service Integration**

The `classService` handles class skills as part of the bulk feature operations:

1. **Creating/Updating Classes**: Class skills are included in the `features` array
2. **Database Storage**: Creates appropriate `FeatureProgression` and `FeatureEntity` records
3. **No Individual CRUD**: Class skills cannot be modified individually

### **Example Backend Data Structure**

```typescript
// FeatureProgression for class skills
{
    id: 123,
    featureId: SpecialFeatureId.ClassSkill, // 1
    classId: 5, // Fighter class
    level: 1,
    appliesToType: FeatureAppliesToType.Skill, // 0
    appliesTo: null,
    modifiers: [
        {
            id: 456,
            type: EntityType.Other, // 3
            appliesTo: EntityAppliesToType.Skill, // 1
            appliesToId: 1, // Climb skill
            value: 0,
            bonusType: null
        },
        {
            id: 457,
            type: EntityType.Other,
            appliesTo: EntityAppliesToType.Skill,
            appliesToId: 2, // Jump skill
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
const classSkills = cls.features
    ?.filter(progression =>
        progression.featureId === SpecialFeatureId.ClassSkill &&
        progression.appliesToType === FeatureAppliesToType.Skill
    )
    .flatMap(progression =>
        progression.modifiers
            ?.filter(modifier =>
                modifier.appliesTo === ModifierAppliesToType.Skill && modifier.appliesToId
            )
            .map(modifier => ({
                skillId: modifier.appliesToId,
                modifier: modifier
            })) || []
    ) || [];
```

## Key Design Principles

### **1. Container Pattern**
- One `FeatureProgression` contains multiple `FeatureEntity` records
- Each entity represents a different class skill
- The progression acts as a container for all class skills

### **2. Special Feature ID**
- Uses a reserved ID (`SpecialFeatureId.ClassSkill`) that doesn't exist in the features table
- Provides a consistent way to identify class skill progressions
- Allows filtering and processing of class skills specifically

### **3. Modifier-Based Approach**
- Each class skill is represented as an entity with `EntityType.Other`
- `value: 0` indicates no bonus value - just marking as class skill
- `appliesToId` contains the specific skill ID

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
            sourceType: 1, // Class
            level: 1,
            featureId: SpecialFeatureId.ClassSkill,
            appliesToType: FeatureAppliesToType.Skill,
            appliesTo: null,
            modifiers: [
                {
                    type: EntityType.Other,
                    appliesTo: EntityAppliesToType.Skill,
                    appliesToId: 1, // Climb
                    value: 0,
                    bonusType: null
                },
                {
                    type: EntityType.Other,
                    appliesTo: EntityAppliesToType.Skill,
                    appliesToId: 2, // Jump
                    value: 0,
                    bonusType: null
                }
            ],
            choices: [],
            effects: []
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
    prog.featureId === SpecialFeatureId.ClassSkill &&
    prog.appliesToType === FeatureAppliesToType.Skill
);

// Get skill IDs from modifiers
const skillIds = classSkillProgressions.flatMap(prog =>
    prog.modifiers
        ?.filter(mod => mod.appliesTo === ModifierAppliesToType.Skill && mod.appliesToId)
        .map(mod => mod.appliesToId) || []
);
```

### **Checking if Skill is Class Skill**
```typescript
const isClassSkill = (skillId: number): boolean => {
    return classSkillProgressions.some(prog =>
        prog.modifiers?.some(mod =>
            mod.appliesTo === ModifierAppliesToType.Skill &&
            mod.appliesToId === skillId
        )
    );
};
```

For more details on the feature system, see **[README.md](README.md)** and **[Examples](examples.md)**.
