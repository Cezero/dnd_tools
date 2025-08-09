# 13 — Touch Attack Considerations

*This document explains how the feature system handles touch attack mechanics from D&D 3.x.*

## Touch Attack Rules

In D&D 3.x, touch attacks ignore most AC bonuses. The feature system needs to model which bonuses apply against touch attacks and which don't.

### Bonuses That Apply to Touch AC

According to official rules, these bonuses **DO apply** against touch attacks:
- **Deflection bonuses** - Ring of Protection, etc.
- **Dodge bonuses** - Combat Expertise, Fighting Defensively
- **Size modifiers** - Creature size AC adjustments
- **Dexterity modifier** - Unless denied (flat-footed, etc.)

### Bonuses That DON'T Apply to Touch AC

These bonuses are **ignored** against touch attacks:
- **Armor bonuses** - Except force effects (Mage Armor, Shield spell)
- **Natural Armor bonuses** - Creature's tough hide
- **Shield bonuses** - Physical shields
- **Enhancement bonuses to armor/natural armor**

## Implementation Strategy

### Option 1: Boolean Field Approach

Add a `appliesToTouch` boolean field to `FeatureModifier`:

```typescript
model FeatureModifier {
  // ... existing fields ...
  appliesToTouch Boolean @default(true)
}
```

### Option 2: Bonus Type Based (Recommended)

Use the bonus type to automatically determine touch attack applicability:

```typescript
// In runtime calculation
function appliesToTouchAttack(modifier: FeatureModifier): boolean {
  if (modifier.appliesTo !== ModifierAppliesToType.AC) {
    return true; // Non-AC modifiers always apply
  }
  
  switch (modifier.bonusType) {
    case FeatureBonusType.Deflection:
    case FeatureBonusType.Dodge:
    case FeatureBonusType.Size:
      return true;
      
    case FeatureBonusType.Armor:
    case FeatureBonusType.NaturalArmor:
    case FeatureBonusType.Shield:
      return false;
      
    case FeatureBonusType.Enhancement:
      // Complex: depends on what it enhances
      return modifier.metadata?.enhancesArmor !== true;
      
    case null: // Untyped - usually applies
      return true;
      
    default:
      return true;
  }
}
```

## Special Cases

### Force Effects Exception

Some armor bonuses DO apply to touch attacks:

```typescript
// Mage Armor spell
{
  type: ModifierType.Bonus,
  appliesTo: ModifierAppliesToType.AC,
  bonusType: FeatureBonusType.Armor,
  value: 4,
  metadata: JSON.stringify({ forceEffect: true, appliesToTouch: true })
}
```

### Enhancement Bonuses

Enhancement bonuses to weapons always apply, but enhancement bonuses to armor/natural armor don't:

```typescript
// Enhancement to weapon (applies to touch)
{
  appliesTo: ModifierAppliesToType.Attack,
  bonusType: FeatureBonusType.Enhancement,
  // Always applies to touch attacks
}

// Enhancement to armor (doesn't apply to touch)
{
  appliesTo: ModifierAppliesToType.AC,
  bonusType: FeatureBonusType.Enhancement,
  metadata: JSON.stringify({ enhancesArmor: true })
  // Doesn't apply to touch attacks
}
```

## Implementation in Feature System

### FeatureModifierCondition Extension

Add touch attack conditions:

```typescript
// New condition type for touch attacks
export const FeatureModifierConditionType = {
  trigger: 0,
  attack_type: 1, 
  touch_attack: 2, // New: applies only to touch attacks
  normal_attack: 3, // New: applies only to normal attacks
  other: 4,
} as const;
```

### Examples

#### Ring of Protection
```typescript
{
  type: ModifierType.Bonus,
  appliesTo: ModifierAppliesToType.AC,
  bonusType: FeatureBonusType.Deflection,
  value: 2
  // Automatically applies to touch attacks (deflection bonus)
}
```

#### Bracers of Armor
```typescript
{
  type: ModifierType.Bonus,
  appliesTo: ModifierAppliesToType.AC,
  bonusType: FeatureBonusType.Armor,
  value: 4
  // Automatically doesn't apply to touch attacks (armor bonus)
}
```

#### Combat Expertise
```typescript
{
  type: ModifierType.Bonus,
  appliesTo: ModifierAppliesToType.AC,
  bonusType: FeatureBonusType.Dodge,
  value: 2
  // Automatically applies to touch attacks (dodge bonus)
}
```

## Runtime Calculation

### Touch AC Calculation
```typescript
function calculateTouchAC(character: Character, modifiers: FeatureModifier[]): number {
  let touchAC = 10; // Base AC
  
  for (const modifier of modifiers) {
    if (modifier.appliesTo === ModifierAppliesToType.AC && 
        appliesToTouchAttack(modifier)) {
      touchAC += modifier.value;
    }
  }
  
  return touchAC;
}
```

### UI Display
```typescript
// In character sheet UI
<div className="ac-display">
  <div>AC: {normalAC}</div>
  <div>Touch: {touchAC}</div>
  <div>Flat-footed: {flatFootedAC}</div>
</div>
```

## Database Considerations

### Migration Strategy

If adding `appliesToTouch` field:

```sql
-- Add column with sensible defaults
ALTER TABLE FeatureModifier 
ADD COLUMN appliesToTouch BOOLEAN DEFAULT true;

-- Update existing armor/natural armor bonuses
UPDATE FeatureModifier 
SET appliesToTouch = false 
WHERE bonusType IN (6, 10, 15) -- Armor, NaturalArmor, Shield
  AND appliesTo = 3; -- AC
```

### Performance

- Index on `(appliesTo, bonusType)` for efficient touch AC queries
- Consider computed columns for frequently-accessed touch AC values

---

**Related Documentation**:
- See `11-stacking-rules.md` for bonus type definitions
- Review `05-conditions.md` for condition system patterns
- Check `../dnd-rules/v3.x/modifiers.md` for official rules reference
