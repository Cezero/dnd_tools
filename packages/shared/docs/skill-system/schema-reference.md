# Skill System Schema Reference

*Database schema and enum definitions for skill definitions, skill checks, and skill mechanics.*

## Core Skill Models

### **Skill Schema**
**Source**: `packages/shared/schema/src/skill.ts`

The skill schema defines the core structure for skill definitions, including all skill properties, descriptions, and mechanical details. This is the central schema for all skill-related functionality.

**Key Fields**:
- `name`: Skill name (required, max 100 characters)
- `abilityId`: Associated ability score (required, 0 or higher)
- `trainedOnly`: Whether skill requires training (optional boolean)
- `affectedByArmor`: Whether skill is affected by armor check penalty (defaults to false)
- `isAnalog`: Whether skill is an analog skill (defaults to false)
- `description`: General skill description (optional, max 10000 characters)
- `checkDescription`: How to make skill checks (optional, max 10000 characters)
- `actionDescription`: Action type for using the skill (optional, max 10000 characters)
- `retryTypeId`: Retry type reference (optional, 0 or higher)
- `retryDescription`: Retry rules description (optional, max 10000 characters)
- `specialNotes`: Special rules and exceptions (optional, max 10000 characters)
- `synergyNotes`: Synergy bonuses with other skills (optional, max 10000 characters)
- `untrainedNotes`: Rules for untrained use (optional, max 10000 characters)
- `restrictionNotes`: Restrictions and limitations (optional, max 10000 characters)

## Skill Classification Models

### **Skill Types**
**Source**: `packages/shared/static-data/src/SkillData.ts`

The skill system supports three main types of skills:

#### **Standard Skills**
- Can be used by anyone (trained or untrained)
- Examples: Climb, Jump, Swim, Listen, Spot
- `trainedOnly: false`, `isAnalog: false`

#### **Trained-Only Skills**
- Require at least 1 rank to use
- Examples: Decipher Script, Disable Device, Spellcraft
- `trainedOnly: true`, `isAnalog: false`

#### **Analog Skills**
- Special skills that use different calculation methods
- Examples: Wild Empathy (uses class level + ability modifier)
- `trainedOnly: true`, `isAnalog: true`

### **Skill Retry Types**
**Source**: `packages/shared/static-data/src/SkillData.ts`

Defines the retry rules for skill checks:

- **0 - No**: Cannot retry failed checks
- **1 - Yes**: Can retry failed checks
- **2 - Special**: Special retry rules apply

## Character Skill Models

### **AdvancementSkill Schema**
**Source**: `packages/shared/schema/src/character.ts`

Defines the relationship between characters and their skill investments:

**Key Fields**:
- `characterId`: Reference to the character
- `classId`: Reference to the class (for multiclassing)
- `skillId`: Reference to the skill
- `pointsSpent`: Number of skill points invested
- `ranks`: Number of skill ranks gained

### **Skill Calculation**
The total skill bonus is calculated as:
```
Total Bonus = Skill Ranks + Ability Modifier + Class Skill Bonus + Other Bonuses
```

Where:
- **Skill Ranks**: Points invested in the skill
- **Ability Modifier**: Modifier from the associated ability score
- **Class Skill Bonus**: +3 if it's a class skill and has at least 1 rank
- **Other Bonuses**: From feats, features, equipment, etc.

## Class Skills Integration

### **Feature System Integration**
**Source**: `packages/shared/docs/feature-system/class-skills.md`

Class skills are implemented through the feature system using a special container pattern:

#### **FeatureProgression Container**
```typescript
{
    id: 123,
    featureId: SpecialFeatureId.ClassSkill, // 1
    classId: 5, // Fighter class
    level: 1,
    appliesToType: FeatureAppliesToType.Skill, // 0
    appliesTo: null, // Container progression
}
```

#### **FeatureModifier Skills**
```typescript
{
    id: 456,
    featureProgressionId: 123,
    type: ModifierType.Other, // 3
    appliesTo: ModifierAppliesToType.Skill, // 1
    appliesToId: 1, // Climb skill ID
    value: 0, // No bonus value - just marking as class skill
    bonusType: null
}
```

## Skill Data Structure

### **Core Skill Database**
**Source**: `packages/shared/static-data/src/SkillData.ts`

The skill system includes 46 core skills with complete definitions:

#### **Physical Skills**
- **Climb** (Str): Climbing walls and surfaces
- **Jump** (Str): Jumping distances and heights
- **Swim** (Str): Swimming and water movement
- **Balance** (Dex): Balancing on narrow surfaces
- **Escape Artist** (Dex): Escaping bonds and restraints
- **Hide** (Dex): Concealing oneself
- **Move Silently** (Dex): Moving without making noise
- **Open Lock** (Dex): Picking locks
- **Ride** (Dex): Riding mounts
- **Sleight of Hand** (Dex): Pickpocketing and sleight of hand
- **Tumble** (Dex): Acrobatic movement
- **Use Rope** (Dex): Working with ropes and knots

#### **Mental Skills**
- **Appraise** (Int): Evaluating item values
- **Craft** (Int): Creating items and structures
- **Decipher Script** (Int): Reading ancient or coded texts
- **Disable Device** (Int): Disarming traps and devices
- **Forgery** (Int): Creating fake documents
- **Search** (Int): Finding hidden objects and secret doors
- **Spellcraft** (Int): Identifying and understanding magic

#### **Knowledge Skills**
- **Knowledge (arcana)** (Int): Magic and magical creatures
- **Knowledge (architecture and engineering)** (Int): Buildings and structures
- **Knowledge (dungeoneering)** (Int): Underground environments
- **Knowledge (geography)** (Int): Lands and terrain
- **Knowledge (history)** (Int): Historical events and figures
- **Knowledge (local)** (Int): Local customs and people
- **Knowledge (nature)** (Int): Natural environments and creatures
- **Knowledge (nobility and royalty)** (Int): Nobility and social structures
- **Knowledge (religion)** (Int): Religions and divine beings
- **Knowledge (the planes)** (Int): Other planes of existence

#### **Social Skills**
- **Bluff** (Cha): Deceiving others
- **Diplomacy** (Cha): Influencing others through negotiation
- **Disguise** (Cha): Concealing identity
- **Gather Information** (Cha): Learning rumors and information
- **Handle Animal** (Cha): Training and controlling animals
- **Intimidate** (Cha): Coercing others through threats
- **Perform** (Cha): Entertaining others
- **Use Magic Device** (Cha): Using magical items

#### **Other Skills**
- **Concentration** (Con): Maintaining spells and abilities
- **Heal** (Wis): Treating wounds and diseases
- **Listen** (Wis): Hearing sounds and conversations
- **Profession** (Wis): Professional knowledge and abilities
- **Sense Motive** (Wis): Detecting lies and motives
- **Spot** (Wis): Noticing details and hidden things
- **Survival** (Wis): Surviving in wilderness
- **Speak Language** (N/A): Learning additional languages
- **Wild Empathy** (Cha): Communicating with animals (Analog skill)

## Integration with Character System

### **Skill Point Calculation**
Characters gain skill points based on their class and intelligence:

```
Skill Points = (Class Skill Points + Intelligence Modifier) × 4 (at 1st level)
Skill Points = Class Skill Points + Intelligence Modifier (at higher levels)
```

### **Skill Rank Limits**
- **Maximum Ranks**: Character level + 3 for class skills, (Character level + 3) ÷ 2 for cross-class skills
- **Minimum Ranks**: 0 for standard skills, 1 for trained-only skills
- **Cross-Class Investment**: Costs 2 skill points per rank

### **Class Skill Bonuses**
- **Class Skills**: Get +3 bonus when invested in (minimum 1 rank)
- **Cross-Class Skills**: No bonus, higher cost per rank
- **Synergy Bonuses**: +2 bonus from related skills with 5+ ranks

## Key Relationships

### **Skill Definition Flow**
```
Skill (Skill Definition)
├── Ability Association (Strength, Dexterity, etc.)
├── Skill Properties (Trained Only, Armor Check Penalty)
├── Skill Descriptions (Check, Action, Retry, Special)
├── Class Skills (Feature System Integration)
└── Character Skills (Skill Ranks and Points)
```

### **Character Skill Management**
```
Character → AdvancementSkill → Skill
├── Skill Points Investment
├── Skill Ranks Calculation
├── Class Skill Bonuses
└── Total Skill Bonus
```

This schema provides a comprehensive foundation for all skill-related functionality, with excellent integration across the character, class, and feature systems.
