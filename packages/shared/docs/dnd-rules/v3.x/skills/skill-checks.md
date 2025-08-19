# Skill Checks

Skill checks determine **success or failure** when characters attempt tasks. Understanding skill check mechanics is essential for implementing skill systems, difficulty validation, and character capability assessment in D&D applications.

## Basic Skill Check Mechanics

### Skill Check Formula
```
1d20 + Skill Modifier = Result
```

**Skill Modifier Components:**
```
Skill Modifier = Skill Ranks + Ability Modifier + Miscellaneous Modifiers
```

**Miscellaneous Modifiers Include:**
- **Racial bonuses** - Species-specific advantages
- **Feat bonuses** - Skill Focus, specialized training
- **Equipment bonuses** - Tools, masterwork items
- **Circumstance bonuses** - Situational advantages
- **Armor check penalty** - For physical skills only

### Critical Success and Failure
**Important Rule**: Unlike attacks and saves:
- **Natural 20 is NOT automatic success**
- **Natural 1 is NOT automatic failure**
- **Only the total result matters**

### Implementation Logic
```pseudocode
class SkillCheck {
    function makeSkillCheck(character, skill, circumstanceModifier = 0) {
        baseRoll = rollD20()
        skillRanks = character.getSkillRanks(skill)
        abilityMod = character.getAbilityModifier(skill.keyAbility)
        racialBonus = character.getRacialBonus(skill)
        featBonus = character.getFeatBonus(skill)
        equipmentBonus = character.getEquipmentBonus(skill)
        armorPenalty = character.getArmorCheckPenalty(skill)
        
        totalModifier = skillRanks + abilityMod + racialBonus + 
                       featBonus + equipmentBonus + armorPenalty + 
                       circumstanceModifier
        
        return baseRoll + totalModifier
    }
}
```

## Difficulty Classes

### Standard DC Scale
| Difficulty | DC | Example Task |
|------------|----:|--------------|
| **Very Easy** | 0 | Notice something large in plain sight |
| **Easy** | 5 | Climb a knotted rope |
| **Average** | 10 | Hear an approaching guard |
| **Tough** | 15 | Rig a wagon wheel to fall off |
| **Challenging** | 20 | Swim in stormy water |
| **Formidable** | 25 | Open an average lock |
| **Heroic** | 30 | Leap across a 30-foot chasm |
| **Nearly Impossible** | 40 | Track after 24 hours of rain |

### Dynamic DC Calculation
```pseudocode
function calculateTaskDC(baseTask, circumstances) {
    baseDC = getTaskBaseDC(baseTask)
    
    // Apply circumstance modifiers
    if (circumstances.hasAdvantage) baseDC -= 2
    if (circumstances.hasDisadvantage) baseDC += 2
    if (circumstances.hasProperTools) baseDC -= 2
    if (circumstances.hasImprovisedTools) baseDC += 2
    if (circumstances.isRushed) baseDC += 5
    if (circumstances.hasExtraTime) baseDC -= 2
    
    return Math.max(0, baseDC)
}
```

## Opposed Skill Checks

### When to Use Opposed Checks
- **Direct competition** - Two characters competing
- **Active resistance** - Target actively opposes action
- **Stealth vs. detection** - Hide vs. Spot, Move Silently vs. Listen
- **Deception vs. insight** - Bluff vs. Sense Motive

### Opposed Check Resolution
```pseudocode
function resolveOpposedCheck(actor, target, actorSkill, targetSkill) {
    actorResult = makeSkillCheck(actor, actorSkill)
    targetResult = makeSkillCheck(target, targetSkill)
    
    if (actorResult > targetResult) {
        return "actor_wins"
    } else if (targetResult > actorResult) {
        return "target_wins"
    } else {
        // Tie goes to defender/passive participant
        return "target_wins"
    }
}
```

### Tie Resolution
**General Rule**: Ties favor the **defender** or **passive participant**
- **Hide vs. Spot**: Tie = Hidden character stays hidden
- **Bluff vs. Sense Motive**: Tie = Listener believes the lie
- **Grapple checks**: Tie = Status quo maintained

## Modifying Skill Checks

### Circumstance Modifiers
**Favorable Conditions** (+2 to +4):
- Proper tools for the task
- Ideal environmental conditions  
- Specialized knowledge or training
- Assistance from others

**Unfavorable Conditions** (-2 to -8):
- Improvised or poor tools
- Hostile environment
- Distractions or time pressure
- Physical impairment

### Time Factors
**Taking 10:**
- **Requirements**: No stress, no distractions, not threatened
- **Effect**: Assume rolled exactly 10 on d20
- **Result**: 10 + skill modifier
- **Use case**: Routine tasks under normal conditions

**Taking 20:**
- **Requirements**: No consequences for failure, unlimited time
- **Time cost**: 20 times normal attempt duration
- **Effect**: Assume rolled exactly 20 on d20
- **Result**: 20 + skill modifier
- **Assumption**: Character keeps trying until best possible result

### Implementation Examples
```pseudocode
class SkillModifiers {
    function canTake10(character, circumstances) {
        return !circumstances.isThreatened && 
               !circumstances.isDistracted && 
               !circumstances.isStressed
    }
    
    function canTake20(character, skill, task) {
        return !task.hasFailureConsequences && 
               !task.hasTimeLimit &&
               skill.allowsRetries
    }
    
    function calculateTake20Time(normalTime) {
        return normalTime * 20
    }
}
```

## Aid Another

### Helping Other Characters
**Requirements**:
- Must be able to perform the task yourself
- Must be within reach/position to help
- Make skill check vs. DC 10

**Results**:
- **Success**: Grant +2 circumstance bonus to aided character
- **Failure**: No effect (no penalty to aided character)

**Multiple Helpers**:
- **Maximum helpers**: Usually 2-4 depending on task
- **Bonuses don't stack**: Still only +2 regardless of helpers
- **All must succeed**: If any helper fails DC 10, no bonus

```pseudocode
function attemptAidAnother(helpers, skill, task) {
    successfulHelpers = 0
    
    for (helper in helpers) {
        if (helper.canAttemptSkill(skill) && helper.isInPosition(task)) {
            aidResult = makeSkillCheck(helper, skill)
            if (aidResult >= 10) {
                successfulHelpers++
            }
        }
    }
    
    return successfulHelpers > 0 ? 2 : 0  // +2 bonus or no bonus
}
```

---

> **🎯 AI Implementation**: Core mechanics for all skill-based interactions, essential for character validation and task resolution systems.

**See Also**: [Skills Overview](index.md) • [Individual Skills](../skills/) • [Ability Scores](../abilities/) • [Character Advancement](../character/advancement/)
