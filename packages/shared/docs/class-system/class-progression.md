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

## ⚔️ **Base Attack Bonus (BAB) System**

### **Progression Types**

The BAB system supports three progression patterns that determine combat effectiveness.

**Good BAB Progression**:
- **Formula**: `BAB = level` (1:1 ratio)
- **Rate**: Full attack bonus progression
- **Examples**: Fighter, Paladin, Barbarian
- **Characteristics**: Combat-focused classes with high attack accuracy

**Average BAB Progression**:
- **Formula**: `BAB = level * 3/4` (3:4 ratio)
- **Rate**: Three-quarters attack bonus progression
- **Examples**: Cleric, Druid, Ranger
- **Characteristics**: Balanced classes with moderate combat ability

**Poor BAB Progression**:
- **Formula**: `BAB = level * 1/2` (1:2 ratio)
- **Rate**: Half attack bonus progression
- **Examples**: Wizard, Sorcerer, Rogue
- **Characteristics**: Non-combat focused classes with limited attack accuracy

**Source File**: `packages/shared/static-data/src/ClassData.ts` (BAB calculation functions)

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

## 🛡️ **Saving Throw System**

### **Progression Types**

The saving throw system uses two progression patterns for different save types.

**Good Save Progression**:
- **Formula**: `Save = floor(level / 2) + 2`
- **Rate**: Good saving throw progression
- **Examples**: Fighter (Fortitude), Rogue (Reflex), Cleric (Will)
- **Characteristics**: Classes with strong defensive capabilities in specific areas

**Poor Save Progression**:
- **Formula**: `Save = floor(level / 3)`
- **Rate**: Poor saving throw progression
- **Examples**: Wizard (Fortitude), Cleric (Reflex), Fighter (Will)
- **Characteristics**: Classes with limited defensive focus in specific areas

**Source File**: `packages/shared/static-data/src/ClassData.ts` (Saving throw functions)

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

**BAB Calculations**:
- **getGoodBAB(level)**: Calculate good BAB progression
- **getAverageBAB(level)**: Calculate average BAB progression
- **getPoorBAB(level)**: Calculate poor BAB progression
- **formatIterativeBAB(bab)**: Format BAB with iterative attacks

**Save Calculations**:
- **getGoodSave(level)**: Calculate good save progression
- **getPoorSave(level)**: Calculate poor save progression
- **getSaveProgression(level, type)**: Generic save calculation

**Advancement Calculations**:
- **getFeatCount(level)**: Calculate feats gained
- **getAbilityScoreIncreases(level)**: Calculate ability score increases
- **getClassSkillMaxRanks(level)**: Calculate class skill maximum ranks
- **getCrossClassSkillMaxRanks(level)**: Calculate cross-class skill maximum ranks

**Source File**: `packages/shared/static-data/src/ClassData.ts` (All calculation functions)

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
