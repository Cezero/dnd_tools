# Feature-Linked Skill Analogs

*Implementation guide for class-specific skills that use "class level + ability modifier" instead of skill ranks.*

## Overview

Feature-linked skill analogs are skills that exist in the core D&D 3.5 rules but are handled differently from normal skills. Instead of using skill ranks, they use a formula of "class level + ability modifier" and are only available to specific classes.

### Examples
- **Wild Empathy**: Available to Druids and Rangers, uses class level + Charisma modifier
- **Turn Undead**: Available to Clerics and experienced Paladins, uses class level + Charisma modifier
- **Lay on Hands**: Available to Paladins, uses class level + Charisma modifier

## Key Characteristics

### 1. Class-Specific Access
- Only available to specific classes that have features granting the skill
- Cannot be learned by other classes through skill points

### 2. No Skill Point Allocation
- Cannot be allocated skill points like normal skills
- Value is calculated automatically based on class levels and ability scores

### 3. Multiclass Support
- For multiclass characters, levels in all granting classes are summed
- Example: Druid 3/Ranger 2 would have Wild Empathy = 5 + CHA modifier

### 4. Formula-Based Calculation
- Uses "sum of granting class levels + ability modifier"
- Ability modifier is based on the skill's `abilityId`

## Database Schema

### Skill Model Extension
```prisma
model Skill {
    // ... existing fields
    isAnalog          Boolean  @default(false) // NEW: Feature-linked skill analog
}
```

### Feature System Integration

**Implementation Approach**: Use the unified `FeatureEntity` model to represent analog skill grants.

**Key Components**:
- Feature progression for the analog skill feature
- Entity with `EntityType.Other` and `EntityAppliesToType.Skill`
- Reference to the specific skill ID
- Proper entity configuration for analog skill behavior

**Source File**: See actual implementation in `apps/backend/src/features/featureSystem/featureSystemService.ts`

## Implementation Strategy

### Phase 1: Database Schema Updates
1. **Add `isAnalog` field to Skill model**
2. **Update Zod schemas for validation**
3. **Build schema package**

### Phase 2: Create Wild Empathy
1. **Add Wild Empathy skill with `isAnalog: true`**
2. **Create Wild Empathy feature**
3. **Add progressions for Druid and Ranger classes**

### Phase 3: Frontend Integration
1. **Extend SkillsTab to detect analog skills**
2. **Implement analog skill calculation**
3. **Prevent skill point allocation**
4. **Add visual distinction**

### Phase 4: Backend Calculation
1. **Extend character calculation service**
2. **Implement multiclass level summation**
3. **Add analog skill calculation methods**

## Frontend Implementation

### Analog Skill Detection
```typescript
const isAnalogSkill = (skillId: number): boolean => {
    const skill = SKILL_LIST.find(s => s.id === skillId);
    return skill?.isAnalog || false;
};
```

### Analog Skill Calculation
```typescript
const getAnalogSkillValue = (skillId: number): number => {
    if (!isAnalogSkill(skillId)) return 0;
    
    // Find all classes that grant this analog skill
    const grantingClasses = getClassesWithAnalogSkill(skillId);
    
    // Sum levels in granting classes
    const totalGrantingLevels = character.advancements
        .filter(adv => grantingClasses.includes(adv.classId))
        .reduce((sum, adv) => sum + adv.level, 0);
    
    // Get ability modifier
    const abilityModifier = getSkillAbilityModifier(skillId);
    
    return totalGrantingLevels + (abilityModifier || 0);
};
```

### Character Sheet Display
```typescript
{isAnalogSkill(skill.id) ? (
    <div className="analog-skill">
        <span>{skill.name}</span>
        <span className="analog-value">
            {getAnalogSkillValue(skill.id)} 
            <span className="text-sm text-gray-500">
                (Class level + {ABILITY_MAP[skill.abilityId]?.abbreviation})
            </span>
        </span>
    </div>
) : (
    <SkillInput skill={skill} />
)}
```

## Backend Implementation

### Character Calculation Service
```typescript
export const characterCalculationService = {
    async getAnalogSkillValue(characterId: number, skillId: number): Promise<number> {
        // Get character with all advancements
        const character = await prisma.userCharacter.findUnique({
            where: { id: characterId },
            include: {
                advancements: {
                    include: { class: true }
                }
            }
        });
        
        if (!character) return 0;
        
        // Find classes that grant this analog skill
        const grantingClasses = await this.getClassesWithAnalogSkill(skillId);
        
        // Sum levels in granting classes
        const totalGrantingLevels = character.advancements
            .filter(adv => grantingClasses.includes(adv.classId))
            .reduce((sum, adv) => sum + adv.level, 0);
        
        // Get ability modifier
        const skill = await prisma.skill.findUnique({
            where: { id: skillId }
        });
        
        if (!skill) return 0;
        
        const abilityScore = character.attributes.find(
            attr => attr.abilityId === skill.abilityId
        )?.value || 10;
        
        const abilityModifier = Math.floor((abilityScore - 10) / 2);
        
        return totalGrantingLevels + abilityModifier;
    },
    
    async getClassesWithAnalogSkill(skillId: number): Promise<number[]> {
        // Query feature system to find classes that grant this analog skill
        const progressions = await prisma.featureProgression.findMany({
            where: {
                modifiers: {
                    some: {
                        appliesTo: ModifierAppliesToType.Skill,
                        appliesToId: skillId
                    }
                }
            },
            include: { class: true }
        });
        
        return progressions.map(p => p.classId).filter(Boolean);
    }
};
```

## Testing Scenarios

### Single-Class Characters
- **Druid 5**: Wild Empathy = 5 + CHA modifier
- **Ranger 3**: Wild Empathy = 3 + CHA modifier

### Multiclass Characters
- **Druid 3/Ranger 2**: Wild Empathy = 5 + CHA modifier
- **Druid 1/Ranger 1**: Wild Empathy = 2 + CHA modifier

### Skill Allocation Prevention
- Verify analog skills cannot be allocated skill points
- Verify analog skills do not appear in skill point allocation interface

### Visual Distinction
- Analog skills should be visually distinct from normal skills
- Show calculation breakdown (e.g., "5 + CHA (3) = 8")

## Future Extensions

### Additional Analog Skills
- **Turn Undead**: Cleric and Paladin (level 4+)
- **Lay on Hands**: Paladin
- **Smite Evil**: Paladin
- **Rage**: Barbarian

### Formula Variations
- Some analog skills might use different formulas
- Extend system to support formula variations
- Add formula selection to analog skill configuration

## Integration with Existing Systems

### Feature System
- Uses existing unified `FeatureEntity` system
- Leverages existing class progression patterns
- Integrates with feature prerequisites

### Character System
- Extends existing skill calculation
- Integrates with character advancement
- Supports multiclass character progression

### UI System
- Extends existing SkillsTab component
- Maintains consistency with skill display
- Adds visual distinction for analog skills
