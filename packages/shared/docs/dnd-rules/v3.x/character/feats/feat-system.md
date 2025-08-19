# Feat System Overview

Feats represent **special abilities**, **training**, and **talents** that characters develop beyond their basic class and racial capabilities. Understanding the feat system is essential for character builders, advancement tracking, and prerequisite validation in D&D applications.

## Core Feat Mechanics

### Feat Acquisition
- **1st level** - All characters gain one feat
- **3rd, 6th, 9th, 12th, 15th, 18th level** - Everyone gains bonus feats
- **Humans** - Gain extra feat at 1st level
- **Fighter bonus feats** - Fighters gain additional combat feats
- **Class bonus feats** - Some classes grant specific feat categories

### Prerequisite System
**Validation Rules:**
- Must meet **ALL prerequisites** at time of selection
- Can gain feat **same level** as gaining prerequisite
- **Lose feat benefits** if prerequisites are lost
- **Cannot use feat** while missing prerequisites

**Implementation Logic:**
```pseudocode
function canSelectFeat(character, feat, targetLevel) {
    for (prerequisite in feat.prerequisites) {
        if (!character.meetsPrerequisite(prerequisite, targetLevel)) {
            return false
        }
    }
    return true
}

function isFeatActive(character, feat) {
    for (prerequisite in feat.prerequisites) {
        if (!character.currentlyMeets(prerequisite)) {
            return false
        }
    }
    return true
}
```

## Feat Categories

### General Feats
- **Available to all characters** - No class restrictions
- **Most common type** - Broad utility and specialization
- **Examples**: Alertness, Skill Focus, Toughness

### Fighter Bonus Feats
- **Combat-focused** - Improve martial capabilities
- **Fighter exclusive pool** - Fighters can select from this list for bonus feats
- **Open to all classes** - Other classes can select if they meet prerequisites
- **Examples**: Weapon Focus, Combat Reflexes, Power Attack

### Item Creation Feats
- **Enable magic item creation** - Required for crafting
- **Spellcaster prerequisites** - Require spellcasting ability
- **Economic impact** - Major gold and XP investment
- **Examples**: Craft Magic Arms and Armor, Brew Potion, Scribe Scroll

### Metamagic Feats
- **Modify spells** - Change spell effects and power
- **Increase spell slot** - Use higher-level slots for enhanced effects
- **Preparation time** - May increase casting time
- **Examples**: Empower Spell, Maximize Spell, Silent Spell

## Prerequisite Types

### Ability Score Prerequisites
```pseudocode
class AbilityPrerequisite {
    ability: AbilityScore
    minimumValue: number
    
    function isMet(character) {
        return character.getAbilityScore(this.ability) >= this.minimumValue
    }
}
```

### Skill Prerequisites
```pseudocode
class SkillPrerequisite {
    skill: SkillType
    minimumRanks: number
    
    function isMet(character) {
        return character.getSkillRanks(this.skill) >= this.minimumRanks
    }
}
```

### Base Attack Bonus Prerequisites
```pseudocode
class BABPrerequisite {
    minimumBAB: number
    
    function isMet(character) {
        return character.getBaseAttackBonus() >= this.minimumBAB
    }
}
```

### Feat Prerequisites
```pseudocode
class FeatPrerequisite {
    requiredFeat: FeatType
    
    function isMet(character) {
        return character.hasFeat(this.requiredFeat) && 
               character.canUseFeat(this.requiredFeat)
    }
}
```

### Class Feature Prerequisites
```pseudocode
class ClassFeaturePrerequisite {
    classFeature: ClassFeatureType
    
    function isMet(character) {
        return character.hasClassFeature(this.classFeature)
    }
}
```

## Feat Chains and Dependencies

### Prerequisite Trees
Many feats form **chains** where one feat requires another:

**Combat Expertise Chain:**
```
Combat Expertise (Int 13)
├─ Improved Disarm (BAB +1)
├─ Improved Feint (BAB +1)
└─ Improved Trip (BAB +1)
   └─ Whirlwind Attack (Dex 13, BAB +4, Dodge, Mobility, Spring Attack)
```

**Two-Weapon Fighting Chain:**
```
Two-Weapon Fighting (Dex 15)
├─ Improved Two-Weapon Fighting (Dex 17, BAB +6)
└─ Greater Two-Weapon Fighting (Dex 19, BAB +11)
```

### Implementation Strategy
```pseudocode
class FeatTree {
    function getAvailableFeats(character, level) {
        availableFeats = []
        
        for (feat in allFeats) {
            if (canSelectFeat(character, feat, level)) {
                availableFeats.push(feat)
            }
        }
        
        return availableFeats
    }
    
    function getFeatDependencies(feat) {
        dependencies = []
        
        function findDependents(currentFeat) {
            for (otherFeat in allFeats) {
                if (otherFeat.requires(currentFeat)) {
                    dependencies.push(otherFeat)
                    findDependents(otherFeat)
                }
            }
        }
        
        findDependents(feat)
        return dependencies
    }
}
```

## Special Considerations

### Human Bonus Feat
- **1st level only** - Cannot be retrained or changed
- **Any feat** - No restrictions beyond prerequisites
- **Popular choices** - Often used for feat chain initiation

### Fighter Bonus Feats
- **Every even level** - 2nd, 4th, 6th, 8th, etc.
- **Combat feat list** - Restricted to specific list
- **Multiclass interaction** - Only fighter levels count

### Metamagic Interaction
```pseudocode
class MetamagicFeat {
    spellLevelIncrease: number
    
    function applyToSpell(spell, casterLevel) {
        newSpell = spell.copy()
        newSpell.effectiveLevel += this.spellLevelIncrease
        newSpell.applyMetamagic(this)
        return newSpell
    }
}
```

### Temporary Prerequisites
- **Ability damage** - May cause feat loss if ability drops below requirement
- **Level drain** - May cause loss of BAB or skill rank prerequisites
- **Conditional prerequisites** - Some feats require specific circumstances

## Character Builder Integration

### Feat Selection Validation
```pseudocode
function validateFeatSelection(character, selectedFeats, targetLevel) {
    errors = []
    
    // Check prerequisites
    for (feat in selectedFeats) {
        if (!canSelectFeat(character, feat, targetLevel)) {
            errors.push("Missing prerequisites for " + feat.name)
        }
    }
    
    // Check feat limits
    totalFeats = character.getBaseFeatCount(targetLevel) + 
                character.getBonusFeatCount(targetLevel)
    
    if (selectedFeats.length > totalFeats) {
        errors.push("Too many feats selected")
    }
    
    return errors
}
```

### Advancement Planning
```pseudocode
function planFeatProgression(character, desiredFeats) {
    plan = []
    
    for (level = 1; level <= 20; level++) {
        if (character.gainsFeatAtLevel(level)) {
            availableFeats = getAvailableFeats(character, level)
            recommendedFeat = findBestFeat(availableFeats, desiredFeats)
            plan.push({level: level, feat: recommendedFeat})
        }
    }
    
    return plan
}
```

---

> **🎯 AI Implementation**: Essential for character builders, advancement tracking, and prerequisite validation systems in D&D applications.

**See Also**: [Prerequisites Guide](prerequisites.md) • [Bonus Feats](bonus-feats.md) • [Character Advancement](../advancement/) • [Combat Feats](../../combat/feats/)
