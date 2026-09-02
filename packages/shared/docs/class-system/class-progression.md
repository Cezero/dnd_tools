# Class System Progression Calculations

*Complete documentation for class progression calculations, including Base Attack Bonus, saving throws, skill points, feats, and ability score increases.*

## 📋 **Overview**

The class progression system calculates character advancement values based on class level, including combat effectiveness, defensive capabilities, and character development. The system provides mathematical formulas and calculation logic for all progression types.

**Source Files**: 
- Static Data: `packages/shared/static-data/src/ClassData.ts` (Progression calculation functions)
- Frontend: `frontend/src/lib/ClassProgression.ts` (Progression utilities)

## 🏗️ **Progression System Architecture**

The progression system calculates character advancement across multiple dimensions:

### **Core Progression Types**

**Combat Progression**: Base Attack Bonus (BAB) calculations
**Defensive Progression**: Saving throw calculations  
**Skill Progression**: Skill point calculations and rank limits
**Character Development**: Feat and ability score increase calculations

### **Calculation Pattern**

**Level Input** → **Progression Type** → **Formula Application** → **Result Formatting** → **Display Output**

### **Display Strategy and Formatters**

The class progression grid is built by `buildClassProgressionFromDetail` in `frontend/src/lib/ClassProgression.ts`.

- **BAB and saves** come from `generateClassProgression`, which evaluates each class feature’s formula entities via `applyFeatureFormula`. Shared features such as `poor-bab` and `good-will-save` use `displayInDetail = false` so they stay out of the narrative feature list; the Detail display strategy therefore cannot populate those columns.
- **Spell columns** are filled from the Detail display strategy breakdowns (`includeNonTransitionLevels: true`):
  - **Spells per Day** ← totals for `EntityAppliesToType.SpellcastingProgression` by spell level
  - **Spells Known** ← totals for `EntityAppliesToType.SpellsKnownProgression` by spell level

`buildClassProgressionFromDetail` writes those values onto each `ProgressionRow` (`spells` / `spellsKnown`). `ClassProgressionTable` renders the columns when any row has data.

Source: [`apps/frontend/src/lib/ClassProgression.ts`](../../../apps/frontend/src/lib/ClassProgression.ts).

## ⚔️ **Base Attack Bonus (BAB) System**

### **Formula-Based Progression**

BAB progressions are now stored as formula-based `FeatureEntity` records in the database, using the feature system's formula resolution. This replaces the previous hard-coded `ProgressionType` enum approach.

**Good BAB Progression**:
- **Formula**: `LINEAR_SCALING` with `scalingValue = 1` (stored in `entity.value`)
- **Calculation**: `level × 1` (1:1 ratio)
- **Rate**: Full attack bonus progression
- **Examples**: Fighter, Paladin, Barbarian
- **Characteristics**: Combat-focused classes with high attack accuracy
- **Database**: `FeatureEntity` with `appliesTo = BaseAttackBonus`, `formulaParams.formulaId = LINEAR_SCALING`, `value = 1.0`

**Average BAB Progression**:
- **Formula**: `LEVEL_TIMES_VALUE` with `scalingValue = 0.75` (stored in `entity.value`)
- **Calculation**: `floor(level × 0.75)` (3:4 ratio)
- **Rate**: Three-quarters attack bonus progression
- **Examples**: Cleric, Druid, Ranger
- **Characteristics**: Balanced classes with moderate combat ability
- **Database**: `FeatureEntity` with `appliesTo = BaseAttackBonus`, `formulaParams.formulaId = LEVEL_TIMES_VALUE`, `value = 0.75`

**Poor BAB Progression**:
- **Formula**: `LEVEL_TIMES_VALUE` with `scalingValue = 0.5` (stored in `entity.value`)
- **Calculation**: `floor(level × 0.5)` (1:2 ratio)
- **Rate**: Half attack bonus progression
- **Examples**: Wizard, Sorcerer, Rogue
- **Characteristics**: Non-combat focused classes with limited attack accuracy
- **Database**: `FeatureEntity` with `appliesTo = BaseAttackBonus`, `formulaParams.formulaId = LEVEL_TIMES_VALUE`, `value = 0.5`

**Source Files**: 
- Formula Definitions: `packages/shared/static-data/src/FormulaDefinitions.ts`
- Resolution: `apps/backend/src/features/characterResolution/resolvedFeatureService.ts` (resolveFormulaValues)
- Calculation: `apps/frontend/src/lib/attack-calculation/utils.ts` (getCharacterBAB)

**Note**: The old `getBABProgression()` function in `packages/shared/utils/src/ClassUtils.ts` is deprecated. Use formula-based resolution instead.

### **Iterative Attacks**

The BAB system calculates iterative attacks for high-level characters.

**Attack Progression**:
- **Primary Attack**: At full BAB
- **Secondary Attack**: At BAB -5
- **Tertiary Attack**: At BAB -10
- **Quaternary Attack**: At BAB -15

**Calculation Logic**:
- **Attack Count**: Number of attacks based on BAB value
- **Attack Bonuses**: Each attack uses reduced BAB
- **Minimum BAB**: Attacks stop when BAB reaches 1 or lower
- **Formatting**: Display as "+16/+11/+6/+1" format

**User Experience**:
- **Visual Display**: Clear representation of attack progression
- **Level Preview**: Show attack progression for future levels
- **Multi-classing**: Handle BAB from multiple classes
- **Real-time Calculation**: Update BAB when class levels change

### **Multi-Class BAB Calculation Examples**

**Example 1: Fighter 5 / Wizard 3**
- **Fighter BAB**: 5 levels × 1 = 5
- **Wizard BAB**: 3 levels × 0.5 = 1.5 (rounded down to 1)
- **Total BAB**: 5 + 1 = 6
- **Attack Progression**: +6/+1

**Example 2: Cleric 4 / Ranger 4**
- **Cleric BAB**: 4 levels × 0.75 = 3
- **Ranger BAB**: 4 levels × 0.75 = 3
- **Total BAB**: 3 + 3 = 6
- **Attack Progression**: +6/+1

**Example 3: Fighter 6 / Rogue 4 / Wizard 2**
- **Fighter BAB**: 6 levels × 1 = 6
- **Rogue BAB**: 4 levels × 0.5 = 2
- **Wizard BAB**: 2 levels × 0.5 = 1
- **Total BAB**: 6 + 2 + 1 = 9
- **Attack Progression**: +9/+4

**Example 4: Paladin 8 / Sorcerer 4**
- **Paladin BAB**: 8 levels × 1 = 8
- **Sorcerer BAB**: 4 levels × 0.5 = 2
- **Total BAB**: 8 + 2 = 10
- **Attack Progression**: +10/+5

## 🛡️ **Saving Throw System**

### **Formula-Based Progression**

Saving throw progressions are now stored as formula-based `FeatureEntity` records in the database, using the feature system's formula resolution. This replaces the previous hard-coded `ProgressionType` enum approach.

**Good Save Progression**:
- **Formula**: `LEVEL_DIVIDED_BY_PLUS_BASE` with `divisor = 2`, `baseValue = 2`
- **Calculation**: `floor(level / 2) + 2`
- **Rate**: Good saving throw progression
- **Examples**: Fighter (Fortitude), Rogue (Reflex), Cleric (Will)
- **Characteristics**: Classes with strong defensive capabilities in specific areas
- **Database**: `FeatureEntity` with `appliesTo = SavingThrow`, `appliesToId = saveType`, `formulaParams.formulaId = LEVEL_DIVIDED_BY_PLUS_BASE`, `formulaParams.divisor = 2`, `formulaParams.baseValue = 2`

**Poor Save Progression**:
- **Formula**: `LEVEL_DIVIDED_BY` with `divisor = 3`
- **Calculation**: `floor(level / 3)`
- **Rate**: Poor saving throw progression
- **Examples**: Wizard (Fortitude), Cleric (Reflex), Fighter (Will)
- **Characteristics**: Classes with limited defensive focus in specific areas
- **Database**: `FeatureEntity` with `appliesTo = SavingThrow`, `appliesToId = saveType`, `formulaParams.formulaId = LEVEL_DIVIDED_BY`, `formulaParams.divisor = 3`

**Source Files**: 
- Formula Definitions: `packages/shared/static-data/src/FormulaDefinitions.ts`
- Resolution: `apps/backend/src/features/characterResolution/resolvedFeatureService.ts` (resolveFormulaValues)
- Calculation: `apps/frontend/src/lib/character-calculation/calculations/savingThrows.ts` (getSavingThrow)

**Note**: The old `getSaveProgression()` function in `packages/shared/utils/src/ClassUtils.ts` is deprecated. Use formula-based resolution instead.

### **Save Types and Characteristics**

**Fortitude Saves**:
- **Purpose**: Resistance to disease, poison, and physical effects
- **Primary Ability**: Constitution
- **Good Progression**: Classes with strong physical resilience
- **Examples**: Fighter, Paladin, Barbarian

**Reflex Saves**:
- **Purpose**: Resistance to area effects and quick reactions
- **Primary Ability**: Dexterity
- **Good Progression**: Classes with high agility and reflexes
- **Examples**: Rogue, Ranger, Monk

**Will Saves**:
- **Purpose**: Resistance to mental effects and magic
- **Primary Ability**: Wisdom
- **Good Progression**: Classes with strong mental discipline
- **Examples**: Cleric, Paladin, Monk

**User Experience**:
- **Save Display**: Show all three saves with progression
- **Ability Integration**: Integrate with character ability scores
- **Multi-classing**: Handle saves from multiple classes
- **Progression Preview**: Show save progression for future levels

### **Multi-Class Saving Throw Calculation Examples**

**Example 1: Fighter 5 / Wizard 3**
- **Fortitude**: Fighter 5 (Good) = floor(5/2) + 2 = 4, Wizard 3 (Poor) = floor(3/3) = 1 → **Total: 4**
- **Reflex**: Fighter 5 (Poor) = floor(5/3) = 1, Wizard 3 (Poor) = floor(3/3) = 1 → **Total: 1**
- **Will**: Fighter 5 (Poor) = floor(5/3) = 1, Wizard 3 (Good) = floor(3/2) + 2 = 3 → **Total: 3**

**Example 2: Cleric 4 / Ranger 4**
- **Fortitude**: Cleric 4 (Good) = floor(4/2) + 2 = 4, Ranger 4 (Good) = floor(4/2) + 2 = 4 → **Total: 4**
- **Reflex**: Cleric 4 (Poor) = floor(4/3) = 1, Ranger 4 (Good) = floor(4/2) + 2 = 4 → **Total: 4**
- **Will**: Cleric 4 (Good) = floor(4/2) + 2 = 4, Ranger 4 (Poor) = floor(4/3) = 1 → **Total: 4**

**Example 3: Rogue 6 / Sorcerer 4**
- **Fortitude**: Rogue 6 (Poor) = floor(6/3) = 2, Sorcerer 4 (Poor) = floor(4/3) = 1 → **Total: 2**
- **Reflex**: Rogue 6 (Good) = floor(6/2) + 2 = 5, Sorcerer 4 (Poor) = floor(4/3) = 1 → **Total: 5**
- **Will**: Rogue 6 (Poor) = floor(6/3) = 2, Sorcerer 4 (Good) = floor(4/2) + 2 = 4 → **Total: 4**

**Example 4: Paladin 8 / Bard 2**
- **Fortitude**: Paladin 8 (Good) = floor(8/2) + 2 = 6, Bard 2 (Poor) = floor(2/3) = 0 → **Total: 6**
- **Reflex**: Paladin 8 (Poor) = floor(8/3) = 2, Bard 2 (Good) = floor(2/2) + 2 = 3 → **Total: 3**
- **Will**: Paladin 8 (Good) = floor(8/2) + 2 = 6, Bard 2 (Good) = floor(2/2) + 2 = 3 → **Total: 6**

## 📚 **Skill Point System**

### **Skill Point Calculation**

Skill points determine character skill development and specialization.

**Base Calculation**:
- **Formula**: `Skill Points = (Class Skill Points + Intelligence Modifier) × 4` at 1st level
- **Subsequent Levels**: `Skill Points = Class Skill Points + Intelligence Modifier`
- **Human Bonus**: +4 skill points at 1st level, +1 per level
- **Favored Class**: No penalty for multi-classing

**Source File**: `packages/shared/static-data/src/ClassData.ts` (Skill point functions)

### **Skill Rank Limits**

The system enforces limits on skill rank investment.

**Class Skills**:
- **Maximum Ranks**: `level + 3`
- **Cost**: 1 skill point per rank
- **Examples**: Fighter's class skills include Climb, Jump, Swim
- **Characteristics**: Skills the class is naturally good at

**Cross-Class Skills**:
- **Maximum Ranks**: `(level + 3) / 2`
- **Cost**: 2 skill points per rank
- **Examples**: Fighter's cross-class skills include Spellcraft, Use Magic Device
- **Characteristics**: Skills the class is not naturally good at

**User Experience**:
- **Point Display**: Show skill points available and spent
- **Rank Limits**: Display maximum ranks for each skill
- **Cost Calculation**: Show skill point costs for investments
- **Validation**: Prevent exceeding rank limits

## 🎯 **Feat Progression System**

### **Feat Calculation**

Feats represent character development and specialization opportunities.

**Feat Progression**:
- **Formula**: `1 + floor((level - 1) / 3)`
- **Pattern**: Feats gained at 1st, 3rd, 6th, 9th, 12th, 15th, 18th level
- **Human Bonus**: +1 feat at 1st level
- **Fighter Bonus**: +1 feat every 2 levels (1st, 2nd, 4th, 6th, etc.)

**Source File**: `packages/shared/static-data/src/ClassData.ts` (Feat calculation functions)

### **Feat Categories**

**General Feats**: Available to all characters
**Combat Feats**: Focus on combat abilities
**Metamagic Feats**: Modify spell casting
**Item Creation Feats**: Create magical items
**Class Feats**: Specific to certain classes

**User Experience**:
- **Feat Display**: Show feats gained by level
- **Prerequisite Checking**: Validate feat prerequisites
- **Feat Selection**: Interface for choosing feats
- **Progression Planning**: Plan feat progression across levels

## 💪 **Ability Score Increase System**

### **Ability Score Calculation**

Ability score increases represent character growth and development.

**Increase Progression**:
- **Formula**: `floor(level / 4)`
- **Pattern**: Increases at 4th, 8th, 12th, 16th, 20th level
- **Points Per Increase**: +1 to any ability score
- **Maximum**: +5 total from level advancement

**Source File**: `packages/shared/static-data/src/ClassData.ts` (Ability score functions)

### **Ability Score Impact**

**Combat Impact**: Strength affects attack and damage
**Defensive Impact**: Constitution affects hit points and Fortitude saves
**Skill Impact**: Intelligence affects skill points and knowledge skills
**Social Impact**: Charisma affects social skills and spellcasting (for some classes)

**User Experience**:
- **Increase Display**: Show ability score increases by level
- **Impact Preview**: Show how increases affect derived statistics
- **Planning Interface**: Plan ability score progression
- **Validation**: Ensure increases are applied correctly

## 🔄 **Multi-classing Integration**

### **BAB Multi-classing**

Combining BAB from multiple classes.

**Calculation Method**:
- **Sum BAB**: Add BAB from all classes
- **Maximum Limit**: Cannot exceed character level + 20
- **Iterative Attacks**: Calculate based on total BAB
- **Example**: Fighter 5/Wizard 5 = BAB 7 (5 + 2.5 rounded down)

**User Experience**:
- **Class Display**: Show BAB contribution from each class
- **Total Calculation**: Display total BAB and iterative attacks
- **Level Planning**: Plan BAB progression across classes
- **Validation**: Ensure BAB calculations are correct

### **Save Multi-classing**

Combining saving throws from multiple classes.

**Calculation Method**:
- **Best Save**: Take the highest save bonus from each class
- **No Stacking**: Saves don't stack between classes
- **Ability Modifiers**: Add ability score modifiers to final save
- **Example**: Fighter 5/Wizard 5 Fortitude uses Fighter's good progression

**User Experience**:
- **Save Breakdown**: Show save contribution from each class
- **Total Display**: Display final save bonuses
- **Ability Integration**: Integrate with character ability scores
- **Progression Planning**: Plan save progression across classes

### **Skill Multi-classing**

Managing skill points across multiple classes.

**Calculation Method**:
- **Favored Class**: No penalty for first level in any class
- **Multi-class Penalty**: -1 skill point per level if not favored class
- **Skill Ranks**: Track ranks separately for each skill
- **Maximum Ranks**: Based on total character level

**User Experience**:
- **Point Calculation**: Show skill points from each class
- **Penalty Display**: Show multi-class penalties
- **Rank Tracking**: Track skill ranks across classes
- **Validation**: Ensure skill point calculations are correct

## 🎨 **Progression Display**

### **Visual Representation**

The system provides visual displays of progression data.

**Progression Tables**:
- **Level-based Display**: Show progression by character level
- **Class Breakdown**: Show contribution from each class
- **Total Calculation**: Display final calculated values
- **Future Planning**: Show progression for future levels

**Chart Visualization**:
- **Progression Lines**: Visual representation of progression trends
- **Milestone Markers**: Highlight important progression points
- **Interactive Elements**: Allow interaction with progression data
- **Comparison Tools**: Compare progression between classes

### **Character Sheet Integration**

**Progression Section**:
- **Combat Values**: Display BAB and iterative attacks
- **Defensive Values**: Display saving throw bonuses
- **Skill Summary**: Show skill points and key skills
- **Development Summary**: Show feats and ability score increases

**Real-time Updates**:
- **Level Changes**: Update progression when levels change
- **Class Changes**: Update progression when classes change
- **Ability Changes**: Update progression when abilities change
- **Feature Integration**: Update progression when features are applied

## 🔧 **Calculation Engine**

### **Calculation Functions**

**BAB Calculations** (Formula-Based):
- **ResolvedFeatureService.resolveFormulaValues()**: Resolves BAB and save formulas for all classes
- **getCharacterBAB()**: Frontend function that uses pre-resolved formula values

**Save Calculations** (Formula-Based):
- **ResolvedFeatureService.resolveFormulaValues()**: Resolves save formulas for all classes
- **getSavingThrow()**: Frontend function that uses pre-resolved formula values

**Advancement Calculations**:
- **getClassSkillMaxRanks(level)**: Calculate class skill maximum ranks
- **getCrossClassSkillMaxRanks(level)**: Calculate cross-class skill maximum ranks

**Feature-Based Calculations**:
- **Feat counts**: Use `ResolvedFeatureService.getAvailableFeatsCount()` to get feat counts from resolved progressions
- **Ability score increases**: Use `ResolvedFeatureService.getAvailableAbilityScoreIncreases()` to get ability score increase counts from resolved progressions

**Source Files**: 
- Formula Resolution: `apps/backend/src/features/characterResolution/resolvedFeatureService.ts`
- Frontend Calculations: `apps/frontend/src/lib/attack-calculation/utils.ts`, `apps/frontend/src/lib/character-calculation/calculations/savingThrows.ts`
- Utility Functions: `packages/shared/utils/src/ClassUtils.ts` (XP, skill ranks, formatting utilities)

### **Performance Optimization**

**Calculation Caching**:
- **Result Caching**: Cache calculation results for performance
- **Level Caching**: Cache results by level to avoid recalculation
- **Class Caching**: Cache results by class to avoid recalculation
- **Invalidation**: Clear cache when data changes

**Efficient Algorithms**:
- **Mathematical Optimization**: Use efficient mathematical formulas
- **Early Termination**: Stop calculation when possible
- **Batch Processing**: Process multiple calculations together
- **Memory Management**: Optimize memory usage for calculations

## 🛡️ **Validation and Error Handling**

### **Input Validation**

**Level Validation**:
- **Range Checking**: Ensure levels are 1-20
- **Type Validation**: Ensure levels are integers
- **Multi-class Validation**: Validate multi-class level combinations
- **Prerequisite Checking**: Check level prerequisites for features

**Progression Validation**:
- **Formula Validation**: Ensure progression formulas are correct
- **Result Validation**: Validate calculation results
- **Boundary Checking**: Check boundary conditions
- **Consistency Checking**: Ensure consistency across calculations

### **Error Handling**

**Calculation Errors**:
- **Division by Zero**: Handle division by zero in formulas
- **Overflow Errors**: Handle numeric overflow
- **Rounding Errors**: Handle rounding errors appropriately
- **Invalid Input**: Handle invalid input gracefully

**User Feedback**:
- **Error Messages**: Provide clear error messages
- **Suggestion System**: Suggest fixes for calculation errors
- **Fallback Values**: Provide fallback values when calculations fail
- **Debug Information**: Provide debug information for troubleshooting

## 🔧 **Testing and Quality Assurance**

### **Calculation Testing**

**Unit Testing**:
- **Formula Testing**: Test individual calculation formulas
- **Boundary Testing**: Test boundary conditions
- **Edge Case Testing**: Test edge cases and unusual inputs
- **Multi-class Testing**: Test multi-class calculations

**Integration Testing**:
- **System Integration**: Test integration with other systems
- **Data Flow Testing**: Test data flow through calculation system
- **Performance Testing**: Test calculation performance
- **User Workflow Testing**: Test complete user workflows

### **Quality Assurance**

**Accuracy Verification**:
- **Formula Verification**: Verify mathematical formulas are correct
- **Result Verification**: Verify calculation results are accurate
- **Cross-reference Testing**: Cross-reference with official rules
- **Regression Testing**: Test for regressions in calculations

**Performance Monitoring**:
- **Calculation Speed**: Monitor calculation performance
- **Memory Usage**: Monitor memory usage for calculations
- **Cache Efficiency**: Monitor cache hit rates
- **User Experience**: Monitor user experience with calculations
