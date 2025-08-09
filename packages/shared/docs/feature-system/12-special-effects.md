# 12 — FeatureSpecialEffect (non-numeric effects)

*This document explains `FeatureSpecialEffect` - how to model non-numeric game mechanics that don't fit into the `FeatureModifier` system.*

## Purpose and Scope

`FeatureSpecialEffect` handles structured metadata for features that provide:
- Proficiencies (weapons, armor, skills)
- Special abilities with complex rules (Turn Undead, Wild Shape)
- Conditional effects that can't be expressed as simple modifiers
- Favored enemy types and similar categorical benefits

## When to Use FeatureSpecialEffect vs FeatureModifier

### Use FeatureModifier for:
- Numeric bonuses and penalties
- Dice modifications (additional damage dice)
- Uses per day/week
- Distance modifiers
- Simple quantity changes

### Use FeatureSpecialEffect for:
- Proficiency grants
- Favored enemy selections  
- Wild Shape form options
- Turn Undead attempts
- Special rules that require custom UI/logic

## FeatureSpecialEffect Types

```typescript
// From FeatureData.ts
export const FeatureSpecialEffectType = {
    Proficiency: 0,         // Weapon/armor/skill proficiencies
    FavoredEnemy: 1,        // Ranger favored enemy types
    ConditionalUpgrade: 2,  // "When X, then Y" effects
    TurnUndead: 3,          // Turn/rebuke undead mechanics
    WildShapeForm: 4,       // Available wild shape forms
    WildShapeSize: 5,       // Wild shape size limitations
    Other: 6                // Custom special effects
}
```

## Implementation Patterns

### 1. Proficiency Effects

Grant weapon, armor, or skill proficiencies:

```typescript
// Martial Weapon Proficiency
{
  featureProgressionId: progressionId,
  effectType: FeatureSpecialEffectType.Proficiency,
  targetId: PROFICIENCY_TYPE_ENUM.MARTIAL_WEAPON, // From ItemData.ts
  metadata: null
}

// Specific weapon proficiency (Exotic)
{
  effectType: FeatureSpecialEffectType.Proficiency,
  targetId: weaponId, // Specific weapon from database
  metadata: JSON.stringify({ proficiencyType: 'weapon' })
}
```

### 2. Favored Enemy Effects

Ranger favored enemy selections:

```typescript
// Base favored enemy choice
{
  effectType: FeatureSpecialEffectType.FavoredEnemy,
  targetId: null, // Set by player choice
  metadata: JSON.stringify({ 
    bonusType: 'base', // vs 'improved' 
    categories: ['humanoid', 'magical_beast', 'undead'] // allowed choices
  })
}
```

### 3. Wild Shape Effects

Druid wild shape capabilities:

```typescript
// Wild shape size restriction
{
  effectType: FeatureSpecialEffectType.WildShapeSize,
  targetId: SIZE_MAP.SMALL, // From CommonData.ts
  metadata: JSON.stringify({ 
    maxSize: 'Large',
    minSize: 'Tiny',
    restrictions: ['no_magical_beasts'] 
  })
}

// Specific form availability
{
  effectType: FeatureSpecialEffectType.WildShapeForm,
  targetId: animalId, // Reference to creature
  metadata: JSON.stringify({ 
    usesPerDay: 1,
    duration: 'hours_per_level' 
  })
}
```

### 4. Turn Undead Effects

Cleric/Paladin turning:

```typescript
{
  effectType: FeatureSpecialEffectType.TurnUndead,
  targetId: null,
  metadata: JSON.stringify({
    turningLevel: 'cleric_level', // or 'paladin_level - 3'
    usesPerDay: 3 + charisma_modifier,
    canDestroy: false, // becomes true at higher levels
    affectedTypes: ['undead']
  })
}
```

### 5. Conditional Upgrades

Complex "if-then" effects:

```typescript
// Improved Critical (weapon-specific)
{
  effectType: FeatureSpecialEffectType.ConditionalUpgrade,
  targetId: weaponId,
  metadata: JSON.stringify({
    condition: 'using_weapon',
    effect: 'threat_range_19_20',
    description: 'Threat range becomes 19-20 with chosen weapon'
  })
}
```

## Integration with Character Resolution

### Reading Special Effects

```typescript
// During character sheet calculation
const specialEffects = await getCharacterSpecialEffects(characterId);

for (const effect of specialEffects) {
  switch (effect.effectType) {
    case FeatureSpecialEffectType.Proficiency:
      grantProficiency(character, effect.targetId);
      break;
      
    case FeatureSpecialEffectType.FavoredEnemy:
      const choice = await getCharacterChoice(effect.progressionId, 'favored_enemy');
      if (choice) {
        applyFavoredEnemyBonus(character, choice.value);
      }
      break;
      
    case FeatureSpecialEffectType.TurnUndead:
      const metadata = JSON.parse(effect.metadata);
      character.turnUndeadUsesPerDay = calculateTurnUses(metadata, character);
      break;
  }
}
```

### UI Presentation

```typescript
// Render special effects in character sheet
function renderSpecialEffect(effect: FeatureSpecialEffect) {
  switch (effect.effectType) {
    case FeatureSpecialEffectType.Proficiency:
      return `Proficient with ${getProficiencyName(effect.targetId)}`;
      
    case FeatureSpecialEffectType.FavoredEnemy:
      const enemy = getCharacterChoice(effect.progressionId);
      return `Favored Enemy: ${enemy?.name || 'Choose...'}`;
      
    case FeatureSpecialEffectType.WildShapeForm:
      return `Wild Shape: ${getCreatureName(effect.targetId)}`;
  }
}
```

## Database Schema Considerations

```sql
-- Minimal FeatureSpecialEffect table structure
CREATE TABLE FeatureSpecialEffect (
  id INT PRIMARY KEY,
  featureProgressionId INT NOT NULL,
  effectType INT NOT NULL, -- FeatureSpecialEffectType
  targetId INT NULL,       -- References various tables based on effectType
  metadata TEXT NULL,      -- JSON for complex data
  FOREIGN KEY (featureProgressionId) REFERENCES FeatureProgression(id)
);
```

## Best Practices

### 1. Metadata Structure
- Keep metadata JSON simple and flat when possible
- Include version info for complex metadata structures
- Validate JSON schema on insert/update

### 2. Target ID Usage  
- Use `targetId` for primary references (proficiency types, creature IDs, etc.)
- Store secondary data in `metadata` JSON
- Prefer static data references over free-form text

### 3. Choice Integration
- Link special effects to `CharacterFeatureChoice` for player-selected options
- Store choice-dependent data in metadata, not separate tables
- Validate choices against allowed options

### 4. Performance
- Index `effectType` for filtering by effect category
- Consider denormalization for frequently-accessed special effects
- Cache resolved special effects per character

---

**Related Documentation**: 
- See `06-choices-allocations.md` for choice integration patterns
- Review `02-schema-map.md` for database relationships
- Check `07-examples.md` for complete implementation examples
