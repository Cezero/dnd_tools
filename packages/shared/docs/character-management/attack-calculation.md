# Attack Calculation Library

*Complete documentation for the attack calculation library, which calculates combat statistics for character attacks including attack bonuses, damage, and special properties.*

## 📋 **Overview**

The attack calculation library is a frontend utility library that calculates combat statistics for character attacks. It processes attack definitions and character data to produce formatted attack statistics including attack bonuses, damage dice, critical hit ranges, weapon properties, and special attack mechanics.

The library supports four attack types: unarmed strikes, main hand melee attacks, ranged attacks, and dual-wield attacks. It integrates with the feature system to determine proficiencies, feats, and special abilities that affect attack calculations.

**Source Files**:
- Main Entry: `frontend/src/lib/attack-calculation/main.ts` - Primary calculation function
- Calculations: `frontend/src/lib/attack-calculation/calculations.ts` - Attack type-specific calculations
- Types: `frontend/src/lib/attack-calculation/types.ts` - Type definitions and interfaces
- Utilities: `frontend/src/lib/attack-calculation/utils.ts` - Helper functions for calculations
- Proficiencies: `frontend/src/lib/attack-calculation/proficiencies.ts` - Proficiency extraction from features
- Feats: `frontend/src/lib/attack-calculation/feats.ts` - Feat detection from features
- Monk Damage: `frontend/src/lib/attack-calculation/monk-damage.ts` - Monk unarmed strike damage calculation
- Index: `frontend/src/lib/attack-calculation/index.ts` - Public API exports

**Related Documentation**:
- [Character Management System](README.md) - Character system overview
- [Character Frontend Components](frontend-components.md) - Character UI components
- [Feature System Runtime Calculation](../feature-system/runtime-calculation.md) - Feature system calculation patterns
- [Class System Progression](../class-system/class-progression.md) - Base Attack Bonus calculations

## 🏗️ **Library Architecture**

The attack calculation library follows a modular architecture that separates concerns and enables extensibility:

### **Core Calculation Flow**

**Input Processing** → **Attack Type Routing** → **Specialized Calculation** → **Result Formatting** → **Output**

The library receives an `AttackCalculationInput` object containing character data, attack definition, and resolved feature progressions. It routes to the appropriate calculation function based on attack type, performs the calculation using utility functions, and returns a formatted `AttackCalculationResult`.

### **Modular Component Structure**

**Main Entry Point**: Routes attack definitions to appropriate calculation functions
**Calculation Functions**: Attack type-specific calculation logic
**Utility Functions**: Reusable helper functions for common calculations
**Feature Integration**: Extracts proficiencies, feats, and special abilities from resolved progressions
**Formatting Functions**: Formats damage types, ranges, and other display values

## ⚔️ **Attack Types**

The library supports four distinct attack types, each with unique calculation rules:

### **Unarmed Strike (Type 1)**

Unarmed strikes represent natural weapon attacks without equipment. The calculation considers:
- Base Attack Bonus (BAB) from character classes
- Strength modifier for attack bonus and damage
- Improved Unarmed Strike feat (removes -4 penalty for lethal damage)
- Monk unarmed strike damage replacement (if applicable)
- Character size for monk damage scaling

**Source**: `frontend/src/lib/attack-calculation/calculations.ts` - `calculateUnarmedStrike()`

### **Main Hand Melee (Type 2)**

Main hand melee attacks use a weapon held in the primary hand. The calculation considers:
- Base Attack Bonus (BAB) from character classes
- Strength modifier for attack bonus and damage
- Weapon proficiency (non-proficient weapons have -4 penalty)
- Two-handed weapon bonus (1.5x Strength modifier for damage)
- Weapon properties (damage dice, critical range, damage type)

**Source**: `frontend/src/lib/attack-calculation/calculations.ts` - `calculateMainHandAttack()`

### **Ranged Attack (Type 4)**

Ranged attacks use ranged weapons such as bows or crossbows. The calculation considers:
- Base Attack Bonus (BAB) from character classes
- Dexterity modifier for attack bonus (no damage modifier)
- Weapon proficiency (non-proficient weapons have -4 penalty)
- Weapon properties (damage dice, critical range, range increment)

**Source**: `frontend/src/lib/attack-calculation/calculations.ts` - `calculateRangedAttack()`

### **Dual Wield (Type 3)**

Dual wield attacks involve attacking with both a main hand and off-hand weapon simultaneously. The calculation considers:
- Base Attack Bonus (BAB) from character classes
- Strength modifier for both hands
- Weapon proficiency for both weapons
- Two-Weapon Fighting penalties (base -6/-10, reduced by light off-hand and feat)
- Two-Weapon Fighting feat (reduces penalties)
- Light weapon bonus (reduces penalties by 2)
- Off-hand damage modifier (0.5x Strength modifier, rounded down)

**Source**: `frontend/src/lib/attack-calculation/calculations.ts` - `calculateDualWield()`

## 🔧 **Core Functions**

### **Main Calculation Function**

**`calculateAttackStats(input: AttackCalculationInput): AttackCalculationResult`**

The primary entry point for attack calculations. Routes attack definitions to the appropriate specialized calculation function based on attack type.

**Parameters**:
- `input`: Complete attack calculation input including character data, attack definition, items, and resolved progressions

**Returns**: Formatted attack calculation result with all combat statistics

**Source**: `frontend/src/lib/attack-calculation/main.ts`

**Usage Example**:
```typescript
import { calculateAttackStats } from '@/lib/attack-calculation';

const result = calculateAttackStats({
    attackDefinition: characterAttackDefinition,
    character: characterData,
    characterItems: characterItems,
    items: itemDetails,
    classDetailsMap: classMap,
    resolvedProgressions: progressions,
    stats: calculatedStats
});
```

### **Calculation Functions**

**`calculateUnarmedStrike(input: AttackCalculationInput): AttackCalculationResult`**

Calculates unarmed strike attack statistics, including monk damage scaling and Improved Unarmed Strike feat handling.

**`calculateMainHandAttack(input, characterItem, item): AttackCalculationResult`**

Calculates main hand melee attack statistics with proficiency checks and two-handed weapon bonuses.

**`calculateRangedAttack(input, characterItem, item): AttackCalculationResult`**

Calculates ranged attack statistics using Dexterity modifier and weapon properties.

**`calculateDualWield(input: AttackCalculationInput): AttackCalculationResult`**

Calculates dual-wield attack statistics for both main hand and off-hand weapons with appropriate penalties and bonuses.

**Source**: `frontend/src/lib/attack-calculation/calculations.ts`

## 🛠️ **Utility Functions**

### **Proficiency Functions**

**`isProficientWithWeapon(resolvedProgressions, weapon, baseItemId): boolean`**

Determines if a character is proficient with a specific weapon by checking resolved feature progressions for weapon category or specific item proficiencies.

**Source**: `frontend/src/lib/attack-calculation/utils.ts`

**`extractProficiencies(resolvedProgressions): ProficiencyResult`**

Extracts all weapon and armor proficiencies from resolved feature progressions, returning weapon categories, armor categories, and specific item IDs.

**Source**: `frontend/src/lib/attack-calculation/proficiencies.ts`

### **Feat Functions**

**`hasFeat(resolvedProgressions, character, featName): boolean`**

Checks if a character has a specific feat by searching resolved feature progressions for granted feats matching the feat name.

**Source**: `frontend/src/lib/attack-calculation/feats.ts`

### **Monk Functions**

**`getMonkUnarmedDamage(resolvedProgressions, characterLevel, characterSizeId): string | null`**

Calculates monk unarmed strike damage by finding Replacement entities with `appliesTo: UnarmedDamage` in resolved progressions and applying the formula system to determine damage dice based on character level and size.

**Source**: `frontend/src/lib/attack-calculation/monk-damage.ts`

### **Character Stat Functions**

**`getCharacterBAB(character, classDetailsMap): number`**

Calculates total Base Attack Bonus by summing BAB from all character classes, handling multiclassing and different BAB progressions (good, average, poor).

**Source**: `frontend/src/lib/attack-calculation/utils.ts`

**`getAbilityModifier(character, abilityId): number`**

Retrieves ability score from character and calculates modifier using the standard D&D 3.5 formula: `(score - 10) / 2` (rounded down).

**Source**: `frontend/src/lib/attack-calculation/utils.ts`

**`getCharacterSizeId(character): number`**

Retrieves character size ID from race data. Currently defaults to Medium size if race size is not available.

**Source**: `frontend/src/lib/attack-calculation/utils.ts`

### **Weapon Classification Functions**

**`isLightWeapon(weapon): boolean`**

Determines if a weapon is a light weapon by checking weapon type against `WEAPON_TYPE_ENUM.LightMeleeWeapon`.

**Source**: `frontend/src/lib/attack-calculation/utils.ts`

**`isTwoHandedWeapon(weapon): boolean`**

Determines if a weapon is a two-handed weapon by checking weapon type against `WEAPON_TYPE_ENUM.TwoHandedMeleeWeapon`.

**Source**: `frontend/src/lib/attack-calculation/utils.ts`

### **Formatting Functions**

**`formatDamageType(damageType): string`**

Formats damage type IDs into abbreviations: B (Bludgeoning), P (Piercing), S (Slashing). Handles complex damage types with `|` (or) and `&` (and) operators.

**Source**: `frontend/src/lib/attack-calculation/utils.ts`

**`formatRange(range): string | null`**

Formats weapon range by adding " ft." suffix if not already present. Returns null for melee weapons.

**Source**: `frontend/src/lib/attack-calculation/utils.ts`

## 📊 **Type Definitions**

### **AttackCalculationInput**

Complete input structure for attack calculations, containing all necessary character and attack data.

**Fields**:
- `attackDefinition`: Attack definition with attack type and weapon references
- `character`: Complete character data with ability scores and advancements
- `characterItems`: Character-owned item instances
- `items`: Base item definitions with weapon data
- `classDetailsMap`: Map of class IDs to class details for BAB calculation
- `resolvedProgressions`: Resolved feature progressions for proficiency and feat detection
- `stats`: Pre-calculated character statistics

**Source**: `frontend/src/lib/attack-calculation/types.ts`

### **AttackCalculationResult**

Formatted output structure containing all calculated attack statistics.

**Fields**:
- `weaponName`: Display name of the weapon or attack type
- `totalAttackBonus`: Calculated total attack bonus (BAB + ability modifier + penalties/bonuses)
- `damage`: Formatted damage string (e.g., "1d6+3")
- `critical`: Critical hit range and multiplier (e.g., "20/x2")
- `range`: Weapon range in feet (null for melee)
- `weight`: Weapon weight in pounds (null if not applicable)
- `type`: Damage type abbreviation (B, P, S, or combinations)
- `size`: Weapon size category (null for unarmed strikes)
- `specialProperties`: Special weapon properties or attack notes
- `isDualWield`: Boolean flag indicating dual-wield attack (optional)
- `offHandResult`: Off-hand attack result for dual-wield attacks (optional)

**Source**: `frontend/src/lib/attack-calculation/types.ts`

### **ProficiencyResult**

Structure containing extracted proficiencies from feature progressions.

**Fields**:
- `weaponCategories`: Array of weapon category IDs the character is proficient with
- `armorCategories`: Array of armor category IDs the character is proficient with
- `itemIds`: Array of specific item IDs the character is proficient with

**Source**: `frontend/src/lib/attack-calculation/types.ts`

## 🔗 **Integration Points**

### **Feature System Integration**

The attack calculation library integrates with the feature system to determine character capabilities:

**Proficiency Detection**: Extracts weapon and armor proficiencies from resolved feature progressions by finding Other entities with `appliesTo: Proficiency` and using appliesToId to identify proficiency types (PROFICIENCY_TYPE_ENUM values).

**Feat Detection**: Checks for specific feats (e.g., Improved Unarmed Strike, Two-Weapon Fighting) by searching resolved progressions for granted feats matching feat names.

**Monk Damage Calculation**: Uses Replacement entities with `appliesTo: UnarmedDamage` to determine monk unarmed strike damage, applying the formula system to scale damage based on character level and size.

**Source Files**:
- Proficiency Extraction: `frontend/src/lib/attack-calculation/proficiencies.ts`
- Feat Detection: `frontend/src/lib/attack-calculation/feats.ts`
- Monk Damage: `frontend/src/lib/attack-calculation/monk-damage.ts`

**Related Documentation**: [Feature System Runtime Calculation](../feature-system/runtime-calculation.md)

### **Class System Integration**

The library integrates with the class system to calculate Base Attack Bonus:

**BAB Calculation**: Sums Base Attack Bonus from all character classes, handling multiclassing by calculating BAB for each class separately and combining results. Supports different BAB progressions (good, average, poor) based on class type.

**Class Details**: Uses class details map to access BAB progression types and calculate appropriate BAB values for each class level.

**Source**: `frontend/src/lib/attack-calculation/utils.ts` - `getCharacterBAB()`

**Related Documentation**: [Class System Progression](../class-system/class-progression.md)

### **Equipment System Integration**

The library integrates with the equipment system to access weapon properties:

**Item Data**: Retrieves base item definitions and character item instances to access weapon properties including damage dice, critical range, damage type, range, and weapon type.

**Weapon Classification**: Uses weapon type from item data to determine if weapons are light, two-handed, or have other special properties.

**Source**: Calculation functions in `frontend/src/lib/attack-calculation/calculations.ts`

**Related Documentation**: [Equipment System](../equipment-system/README.md)

### **Character System Integration**

The library integrates with the character system to access character data:

**Character Data**: Uses complete character data including ability scores, advancements, and race information to calculate attack statistics.

**Ability Scores**: Retrieves ability scores from character data to calculate modifiers for attack bonuses and damage.

**Character Items**: Accesses character-owned item instances to retrieve weapon data and custom item names.

**Source**: All calculation functions receive `CharacterWithAllDetailsResponse` as input

**Related Documentation**: [Character Management System](README.md)

## 📝 **Calculation Logic**

### **Attack Bonus Calculation**

Attack bonus is calculated using the following formula:

**Melee Attacks**: `BAB + Strength Modifier + Proficiency Bonus (0 or -4) + Special Penalties/Bonuses`

**Ranged Attacks**: `BAB + Dexterity Modifier + Proficiency Bonus (0 or -4)`

**Dual Wield**: Base calculation plus two-weapon fighting penalties:
- Base penalties: -6 (main hand) / -10 (off-hand)
- Light off-hand weapon: +2 to both penalties
- Two-Weapon Fighting feat: +2 (main hand) / +6 (off-hand)

### **Damage Calculation**

Damage is calculated using the following formulas:

**Unarmed Strike**: `Damage Dice + Strength Modifier (nonlethal)`
- Default: 1d3
- Monk: Scaled damage based on level and size (from feature system)

**Main Hand Melee**: `Weapon Damage + Strength Modifier`
- Two-handed weapons: `Weapon Damage + (Strength Modifier × 1.5, rounded down)`

**Ranged Attack**: `Weapon Damage` (no ability modifier)

**Dual Wield**:
- Main hand: `Weapon Damage + Strength Modifier`
- Off-hand: `Weapon Damage + (Strength Modifier / 2, rounded down)`

### **Proficiency Penalties**

Non-proficient weapons apply a -4 penalty to attack bonus. Proficiency is determined by:
1. Weapon category proficiency from feature progressions
2. Specific item proficiency from feature progressions
3. Default proficiency based on character class

### **Special Attack Mechanics**

**Improved Unarmed Strike**: Removes -4 penalty for dealing lethal damage with unarmed strikes. Without this feat, unarmed strikes deal nonlethal damage with a -4 penalty for lethal damage.

**Two-Weapon Fighting**: Reduces two-weapon fighting penalties. Base penalties are -6/-10, reduced by 2 for light off-hand weapons and further reduced by the Two-Weapon Fighting feat.

**Monk Unarmed Strike**: Monks gain improved unarmed strike damage that scales with level and size. The damage is determined by Replacement entities in resolved feature progressions using the formula system.

## 🎯 **Usage Examples**

### **Basic Attack Calculation**

```typescript
import { calculateAttackStats } from '@/lib/attack-calculation';
import type { AttackCalculationInput } from '@/lib/attack-calculation';

const input: AttackCalculationInput = {
    attackDefinition: {
        id: 1,
        attackTypeId: 2, // Main hand
        attackSlot: 1,
        mainHandCharacterItemId: 5,
        offHandCharacterItemId: null
    },
    character: characterData,
    characterItems: characterItems,
    items: itemDetails,
    classDetailsMap: classMap,
    resolvedProgressions: progressions,
    stats: calculatedStats
};

const result = calculateAttackStats(input);
console.log(`${result.weaponName}: +${result.totalAttackBonus} (${result.damage})`);
```

### **Dual Wield Attack Calculation**

```typescript
const dualWieldInput: AttackCalculationInput = {
    attackDefinition: {
        id: 2,
        attackTypeId: 3, // Dual wield
        attackSlot: 2,
        mainHandCharacterItemId: 5,
        offHandCharacterItemId: 6
    },
    // ... other input fields
};

const dualWieldResult = calculateAttackStats(dualWieldInput);
if (dualWieldResult.isDualWield && dualWieldResult.offHandResult) {
    console.log(`Main: ${dualWieldResult.weaponName} +${dualWieldResult.totalAttackBonus}`);
    console.log(`Off-hand: ${dualWieldResult.offHandResult.weaponName} +${dualWieldResult.offHandResult.totalAttackBonus}`);
}
```

### **Proficiency Checking**

```typescript
import { isProficientWithWeapon } from '@/lib/attack-calculation';

const isProficient = isProficientWithWeapon(
    resolvedProgressions,
    weaponData,
    baseItemId
);

if (!isProficient) {
    console.log('Character is not proficient with this weapon (-4 penalty)');
}
```

### **Feat Detection**

```typescript
import { hasFeat } from '@/lib/attack-calculation';

const hasImprovedUnarmed = hasFeat(
    resolvedProgressions,
    character,
    'Improved Unarmed Strike'
);

if (hasImprovedUnarmed) {
    console.log('Character can deal lethal damage with unarmed strikes');
}
```

## 🔍 **Implementation Details**

### **Error Handling**

The library throws errors for invalid input conditions:
- Missing character items for main hand or ranged attacks
- Missing weapon data for weapon-based attacks
- Missing off-hand items for dual-wield attacks

All errors include descriptive messages to aid debugging.

### **Data Requirements**

The library requires complete character data including:
- All character advancements for BAB calculation
- Resolved feature progressions for proficiency and feat detection
- Complete item definitions with weapon data
- Character items with base item references

### **Performance Considerations**

The library performs calculations synchronously and is designed for efficient execution:
- Proficiency extraction processes all progressions once
- Feat detection searches progressions linearly
- BAB calculation sums class BABs efficiently
- No external API calls required (uses resolved progressions)

### **Extensibility**

The library is designed for extensibility:
- New attack types can be added by extending the main routing function
- New utility functions can be added for specialized calculations
- Feature system integration allows new feats and abilities to be detected automatically
- Formatting functions can be extended for new display formats

## 📚 **Related Documentation**

### **System Documentation**
- [Character Management System](README.md) - Character system overview
- [Character Frontend Components](frontend-components.md) - Character UI components
- [Feature System](../feature-system/README.md) - Feature system and entity types
- [Class System](../class-system/README.md) - Class system and BAB progressions
- [Equipment System](../equipment-system/README.md) - Equipment and weapon system

### **Application Overview**
- [Frontend Components Overview](../application-overview/frontend-components.md) - Shared frontend patterns
- [Feature System Runtime Calculation](../feature-system/runtime-calculation.md) - Feature calculation patterns

## Summary

The attack calculation library provides comprehensive combat statistic calculations for character attacks. It integrates seamlessly with the feature system, class system, equipment system, and character system to produce accurate attack statistics based on character capabilities, equipment, and special abilities.

The library's modular architecture enables extensibility while maintaining clear separation of concerns. All calculations follow D&D 3.5 rules and properly handle special cases such as monk unarmed strikes, two-weapon fighting, and proficiency penalties.

