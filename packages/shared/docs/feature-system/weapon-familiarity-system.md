# Weapon Familiarity System

This document outlines the implementation strategy for the Weapon Familiarity system, which handles racial weapon familiarity features like dwarf and gnome weapon familiarity.

## Overview

Weapon Familiarity allows certain races to treat specific exotic weapons as martial weapons for proficiency purposes. This does **not** grant proficiency with the weapons - it only changes how proficiency is calculated.

### Official D&D 3.5 Rules

**Dwarf Weapon Familiarity:**
- Dwarves may treat **dwarven waraxes** and **dwarven urgroshes** as **martial weapons** rather than **exotic weapons**

**Gnome Weapon Familiarity:**
- Gnomes may treat **gnome hooked hammers** as **martial weapons** rather than **exotic weapons**

### Key Concept

Weapon familiarity **does not grant proficiency**. For example:
- A **gnome wizard** is not proficient with all martial weapons, so even though they can treat the gnome hooked hammer as a martial weapon, they still need to take "Martial Weapon Proficiency (gnome hooked hammer)" to be proficient with it
- A **gnome fighter** gets "all martial weapons" as a class proficiency, and since they can treat the gnome hooked hammer as a martial weapon, they are also proficient with it

## Implementation Strategy

### 1. New Special Effect Type

Add `FeatureSpecialEffectType.WeaponFamiliarity` (6) to handle racial weapon familiarity:

```typescript
export const FeatureSpecialEffectType = {
    Proficiency: 0,
    FavoredEnemy: 1,
    ConditionalUpgrade: 2,
    TurnUndead: 3,
    WildShapeForm: 4,
    WildShapeSize: 5,
    WeaponFamiliarity: 6,  // NEW
    Other: 7,              // Updated from 6 to 7
} as const;

export const FEATURE_SPECIAL_EFFECT_TYPES: BaseMap<CoreComponent> = {
    // ... existing types ...
    [FeatureSpecialEffectType.WeaponFamiliarity]: { 
        id: FeatureSpecialEffectType.WeaponFamiliarity, 
        name: 'Weapon Familiarity' 
    },
    [FeatureSpecialEffectType.Other]: { 
        id: FeatureSpecialEffectType.Other, 
        name: 'Other' 
    },
};
```

### 2. Data Model

Use the existing `FeatureSpecialEffect` schema with:
- `effectType: FeatureSpecialEffectType.WeaponFamiliarity` (6)
- `numericValue: itemId` - stores the ID of the weapon that benefits from familiarity
- No additional schema changes required

### 3. UI Implementation

#### FeatureProgressionDetailEdit.tsx Updates

Add exotic weapon selection when `WeaponFamiliarity` effect type is selected:

```typescript
// Add state for exotic weapons
const [exoticWeapons, setExoticWeapons] = useState<ProficiencyItem[]>([]);
const [loadingExoticWeapons, setLoadingExoticWeapons] = useState(false);

const isWeaponFamiliarityEffect = effect.effectType === FeatureSpecialEffectType.WeaponFamiliarity;

// Load exotic weapons when WeaponFamiliarity is selected
useEffect(() => {
    if (isWeaponFamiliarityEffect) {
        loadExoticWeapons();
    }
}, [isWeaponFamiliarityEffect]);

const loadExoticWeapons = async () => {
    setLoadingExoticWeapons(true);
    try {
        const items = await ItemService.itemQuery();
        const exoticWeaponItems = items
            .filter(item => 
                item.typeId === ITEM_TYPE_ENUM.WEAPON && 
                item.weapon?.category === WEAPON_CATEGORY_ENUM.EXOTIC
            )
            .map(item => ({
                id: item.id,
                name: item.name,
                typeId: item.typeId,
                weapon: item.weapon
            }))
            .sort((a, b) => a.name.localeCompare(b.name));
        
        setExoticWeapons(exoticWeaponItems);
    } catch (error) {
        console.error('Failed to load exotic weapons:', error);
    } finally {
        setLoadingExoticWeapons(false);
    }
};
```

#### UI Structure

```typescript
{isWeaponFamiliarityEffect ? (
    <ValidatedCustomSelect
        name="numericValue"
        label="Weapon"
        value={effect.numericValue || ''}
        onChange={handleEffectChange}
        options={exoticWeapons.map(weapon => ({
            value: weapon.id.toString(),
            label: weapon.name
        }))}
        loading={loadingExoticWeapons}
        placeholder="Select exotic weapon..."
        required
    />
) : isProficiencyEffect ? (
    // Existing proficiency effect UI
) : (
    // Existing generic effect UI
)}
```

### 4. Display Logic

#### Formatters.ts Updates

Update `formatProgression` function to handle weapon familiarity effects:

```typescript
export function formatProgression(progression: FeatureProgressionWithRelations): string {
    // ... existing logic ...
    
    // Handle weapon familiarity effects
    const weaponFamiliarityEffects = progression.effects.filter(
        effect => effect.effectType === FeatureSpecialEffectType.WeaponFamiliarity
    );
    
    if (weaponFamiliarityEffects.length > 0) {
        const familiarityDetails = weaponFamiliarityEffects
            .map(effect => {
                const weaponName = effect.item?.name || `weapon ${effect.numericValue}`;
                return `treat ${weaponName} as martial weapon`;
            })
            .join(', ');
        
        note = familiarityDetails;
    } else if (proficiencyEffects.length > 0) {
        // ... existing proficiency logic ...
    } else {
        // ... existing fallback logic ...
    }
    
    return `${levelText}${note ? ` (${note})` : ''}`;
}
```

### 5. Racial Feature Implementation

#### Dwarf Weapon Familiarity

```typescript
const dwarfWeaponFamiliarity: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Race,
    raceId: DWARF_RACE_ID,
    effects: [
        {
            effectType: FeatureSpecialEffectType.WeaponFamiliarity,
            numericValue: DWARVEN_WARAXE_ITEM_ID,
            description: "Treat dwarven waraxe as martial weapon"
        },
        {
            effectType: FeatureSpecialEffectType.WeaponFamiliarity,
            numericValue: DWARVEN_URGROSH_ITEM_ID,
            description: "Treat dwarven urgrosh as martial weapon"
        }
    ]
};
```

#### Gnome Weapon Familiarity

```typescript
const gnomeWeaponFamiliarity: FeatureProgression = {
    level: 1,
    sourceType: FeatureSourceType.Race,
    raceId: GNOME_RACE_ID,
    effects: [
        {
            effectType: FeatureSpecialEffectType.WeaponFamiliarity,
            numericValue: GNOME_HOOKED_HAMMER_ITEM_ID,
            description: "Treat gnome hooked hammer as martial weapon"
        }
    ]
};
```

### 6. Runtime Logic (Future Implementation)

The character calculation system will need to:

```typescript
// Pseudo-code for character proficiency calculation
function isProficientWithWeapon(character, weaponId) {
    // Check for weapon familiarity effects
    const familiarityEffects = character.getWeaponFamiliarityEffects();
    const familiarWeapon = familiarityEffects.find(effect => effect.numericValue === weaponId);
    
    // If weapon has familiarity, treat it as martial for proficiency purposes
    const effectiveCategory = familiarWeapon ? WEAPON_CATEGORY_ENUM.MARTIAL : weapon.category;
    
    // Check proficiency based on effective category
    return character.hasProficiencyForCategory(effectiveCategory);
}
```

## Benefits

1. **Semantic Accuracy**: Clearly represents "weapon familiarity" concept
2. **Simple Data Model**: Uses existing `numericValue` field for itemId
3. **Extensible**: Can handle future weapon familiarity rules
4. **Clear UI**: Dedicated dropdown for exotic weapons
5. **Consistent Display**: Uses existing formatting patterns
6. **No Breaking Changes**: Adds new enum value without affecting existing functionality

## Success Criteria

- [ ] Dwarf weapon familiarity displays correctly in race details
- [ ] Gnome weapon familiarity displays correctly in race details
- [ ] UI allows selection of exotic weapons for familiarity effects
- [ ] Formatters show weapon familiarity in readable format
- [ ] No impact on existing feature system functionality
- [ ] Future character calculation system correctly applies weapon familiarity

## Related Documentation

- [Feature System Overview](../feature-system/README.md)
- [Racial Features](../feature-system/racial-features.md)
- [Special Effects](../feature-system/component-selection.md)
- [Project Management](../../project-mgmt/feature-system-implementation-plan.md)
