# Feat Prerequisites Guide

Prerequisites are **requirements** that characters must meet to select and use feats. This system ensures logical progression and prevents characters from gaining abilities they shouldn't have access to. Proper prerequisite checking is crucial for character validation systems.

## Prerequisite Categories

### Ability Score Requirements
**Format:** "Ability Score X+"
- **Static values** - Must maintain minimum score
- **Ability damage** - Temporarily disables feat if score drops
- **Enhancement bonuses** - Count toward prerequisites
- **Racial modifiers** - Applied to base scores

**Examples:**
- **Combat Expertise** - Int 13+
- **Power Attack** - Str 13+
- **Dodge** - Dex 13+

**Implementation:**
```pseudocode
function checkAbilityPrerequisite(character, requirement) {
    currentScore = character.getAbilityScore(requirement.ability)
    return currentScore >= requirement.minimumValue
}
```

### Skill Rank Requirements
**Format:** "Skill Name X ranks"
- **Actual ranks** - Not skill bonus, just ranks invested
- **Cross-class ranks** - Count at reduced rate
- **Skill bonuses** - Do not count toward prerequisites
- **Maximum ranks** - Limited by character level

**Examples:**
- **Weapon Finesse** - No skill requirement
- **Skill Focus** - No requirement
- **Track** - Survival 1 rank (for rangers)

**Validation Logic:**
```pseudocode
function checkSkillPrerequisite(character, requirement) {
    ranks = character.getSkillRanks(requirement.skill)
    return ranks >= requirement.minimumRanks
}
```

### Base Attack Bonus Requirements
**Format:** "Base attack bonus +X"
- **Class BAB only** - No bonuses from other sources
- **Multiclass total** - Sum all class BAB contributions
- **Fractional advancement** - Use actual values, not rounded
- **Temporary bonuses** - Do not count

**Examples:**
- **Cleave** - BAB +1
- **Great Cleave** - BAB +4
- **Whirlwind Attack** - BAB +4

**Calculation:**
```pseudocode
function checkBABPrerequisite(character, requirement) {
    totalBAB = 0
    
    for (classLevel in character.classes) {
        totalBAB += getClassBAB(classLevel.class, classLevel.level)
    }
    
    return totalBAB >= requirement.minimumBAB
}
```

### Feat Prerequisites
**Format:** "Feat Name"
- **Must possess feat** - Character must have selected the feat
- **Feat must be active** - All prerequisites of required feat must be met
- **Temporary loss** - Disables dependent feats
- **Feat chains** - Create complex dependency trees

**Examples:**
- **Improved Trip** requires **Combat Expertise**
- **Greater Weapon Focus** requires **Weapon Focus**
- **Snatch Arrows** requires **Deflect Arrows** and **Improved Unarmed Strike**

**Chain Validation:**
```pseudocode
function checkFeatPrerequisite(character, requirement) {
    if (!character.hasFeat(requirement.requiredFeat)) {
        return false
    }
    
    return isFeatActive(character, requirement.requiredFeat)
}
```

### Class Feature Prerequisites
**Format:** "Class feature name"
- **Must have class feature** - Character must possess the specific ability
- **Multiclass characters** - May have feature from any class
- **Feature variants** - Some features have multiple versions
- **Lost features** - Ex-class members may lose prerequisites

**Examples:**
- **Stunning Fist** requires "Flurry of blows class feature"
- **Extra Turning** requires "Turn undead class feature"
- **Spell Focus** requires "Ability to cast spells of chosen school"

**Checking Logic:**
```pseudocode
function checkClassFeaturePrerequisite(character, requirement) {
    for (characterClass in character.classes) {
        if (characterClass.hasFeature(requirement.featureName)) {
            return true
        }
    }
    return false
}
```

### Size Requirements
**Format:** "Size X" or "Size X or larger/smaller"
- **Character size** - Determined by race's base size
- **Size categories** - Fine, Diminutive, Tiny, Small, Medium, Large, Huge, Gargantuan, Colossal
- **Size comparisons** - Can require exact size, minimum size, or maximum size
- **Size modifiers** - Size affects various game mechanics (AC, grapple, etc.)

**Examples:**
- **Powerful Build** - "Size Large or larger"
- **Small Frame** - "Size Small or smaller"
- **Giant Size** - "Size Large" (exact)

**Validation Logic:**
```pseudocode
function checkSizePrerequisite(character, requirement) {
    characterSize = character.race.sizeId
    
    if (requirement.comparison == "exact") {
        return characterSize == requirement.sizeId
    } else if (requirement.comparison == "or_larger") {
        return characterSize >= requirement.sizeId
    } else if (requirement.comparison == "or_smaller") {
        return characterSize <= requirement.sizeId
    }
    
    return false
}
```

**Size ID Order:**
- Fine (1) < Diminutive (2) < Tiny (3) < Small (4) < Medium (5) < Large (6) < Huge (7) < Gargantuan (8) < Colossal (9)
- Higher IDs represent larger sizes
- For "or larger" comparisons, higher size IDs satisfy the requirement
- For "or smaller" comparisons, lower size IDs satisfy the requirement

## Special Prerequisite Cases

### Multiple Requirements
**Format:** Multiple prerequisites listed
- **ALL must be met** - Every requirement is mandatory
- **Gained simultaneously** - Can gain prerequisite and feat at same level
- **Complex chains** - May require planning multiple levels ahead

**Example - Whirlwind Attack:**
- Dex 13
- BAB +4  
- Dodge
- Mobility
- Spring Attack

### Alternative Prerequisites
**Format:** "Requirement A OR Requirement B"
- **Any one sufficient** - Only need to meet one option
- **Different paths** - Multiple ways to qualify
- **Class-specific alternatives** - Different requirements for different classes

**Example - Turn Undead:**
- Cleric level 1st OR
- Paladin level 4th OR  
- Other class feature granting turn undead

### Spellcasting Prerequisites
**Format:** Various spellcasting requirements
- **"Able to cast X-level spells"** - Must have spell slots of that level
- **"Caster level Xth"** - Must have effective caster level
- **"Spellcaster level Xth"** - Must have levels in spellcasting class
- **Specific spells known** - Must know particular spells

**Examples:**
- **Craft Wand** - "Caster level 5th"
- **Spell Focus** - "Ability to cast 1st-level spells of chosen school"
- **Empower Spell** - "Ability to cast spells"

## Prerequisite Loss and Recovery

### Temporary Loss
**Causes:**
- **Ability damage** - Reduces ability scores below requirements
- **Level drain** - May reduce BAB, skill ranks, or class features
- **Dispelled magic** - Temporary removal of enhancement bonuses
- **Equipment loss** - If prerequisite depends on magic items

**Effects:**
- **Feat becomes inactive** - Cannot use feat benefits
- **Dependent feats disabled** - All feats requiring this feat also disabled
- **Automatic recovery** - When prerequisites are restored

### Permanent Loss
**Causes:**
- **Class feature loss** - Ex-paladin, ex-monk, etc.
- **Voluntary retraining** - Changing feat selections
- **Permanent ability drain** - Permanent reduction in ability scores

**Effects:**
- **Must retrain feat** - Replace with legal selection
- **Dependent feat chain** - May need to retrain multiple feats
- **Character revision** - May require significant changes

## Implementation Guidelines

### Character Creation Validation
```pseudocode
function validateCharacterFeats(character) {
    errors = []
    
    for (feat in character.feats) {
        if (!canSelectFeat(character, feat, character.level)) {
            errors.push({
                feat: feat.name,
                missing: getMissingPrerequisites(character, feat),
                level: character.level
            })
        }
    }
    
    return errors
}
```

### Advancement Planning
```pseudocode
function getFeatAvailabilityByLevel(character, targetFeat) {
    for (level = 1; level <= 20; level++) {
        testCharacter = character.simulateAdvancement(level)
        if (canSelectFeat(testCharacter, targetFeat, level)) {
            return level
        }
    }
    return null  // Never available
}
```

### Dynamic Prerequisite Checking
```pseudocode
function updateActiveFeatList(character) {
    activeFeats = []
    
    for (feat in character.feats) {
        if (areAllPrerequisitesMet(character, feat)) {
            activeFeats.push(feat)
        }
    }
    
    character.activeFeats = activeFeats
    recalculateCharacterBonuses(character)
}
```

### Prerequisite Tree Display
```pseudocode
function buildPrerequisiteTree(targetFeat) {
    tree = {
        feat: targetFeat,
        requirements: [],
        alternatives: []
    }
    
    for (prerequisite in targetFeat.prerequisites) {
        if (prerequisite.type == "feat") {
            tree.requirements.push(buildPrerequisiteTree(prerequisite.feat))
        } else {
            tree.requirements.push(prerequisite)
        }
    }
    
    return tree
}
```

---

> **🎯 AI Implementation**: Critical for character builders to validate feat selections and provide helpful prerequisite guidance to users.

**See Also**: [Feat System](feat-system.md) • [Character Advancement](../advancement/) • [Ability Scores](../abilities/) • [Skills](../../skills/)
