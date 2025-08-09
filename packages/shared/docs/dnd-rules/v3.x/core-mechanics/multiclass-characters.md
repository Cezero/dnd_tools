# Multiclass Characters

A character may **add new classes** as they progress in level, thus becoming a multiclass character. The class abilities from a character's different classes **combine to determine** a multiclass character's overall abilities. **Multiclassing improves versatility at the expense of focus**.

## Core Multiclassing Principles

### General Rule
As a general rule, the abilities of a multiclass character are the **sum of the abilities** of each of the character's classes.

### Trade-offs
- **Versatility**: Access to abilities from multiple classes
- **Specialization Cost**: Slower progression in individual class features
- **Complexity**: More abilities to track and manage

## Level Mechanics

### Character Level vs Class Level

#### Character Level
- **Total number of levels** across all classes
- **Used to determine**: Feat progression and ability score increases
- **Example**: A Fighter 3/Rogue 2 has character level 5

#### Class Level  
- **Level in a particular class** only
- **Used to determine**: Class-specific features and spell progression
- **Single-class characters**: Character level equals class level

### Level Progression Table

| **Character Level** | **Feat Gained** | **Ability Increase** | **Example Build** |
|-------------------|-----------------|---------------------|-------------------|
| **1st** | 1st level feat | — | Fighter 1 |
| **3rd** | 3rd level feat | — | Fighter 2/Rogue 1 |
| **4th** | — | 1st increase | Fighter 2/Rogue 2 |
| **6th** | 6th level feat | — | Fighter 3/Rogue 3 |
| **8th** | — | 2nd increase | Fighter 4/Rogue 4 |

## Combining Class Features

### Hit Points
A character gains **hit points from each class** as their class level increases, **adding new hit points to the previous total**.

#### Hit Point Calculation
```
Total HP = (Class 1 levels × Class 1 HD) + (Class 2 levels × Class 2 HD) + Con modifier per level
```

#### Example
Fighter 3/Rogue 2 with 14 Constitution (+2):
- **Fighter levels**: 3 × d10 = 3d10
- **Rogue levels**: 2 × d6 = 2d6  
- **Constitution bonus**: 5 levels × +2 = +10
- **Total**: 3d10 + 2d6 + 10 hit points

### Base Attack Bonus
**Add the base attack bonuses** acquired for each class to get the character's total base attack bonus.

#### Multiple Attacks
A resulting value of **+6 or higher** provides the character with **multiple attacks**.

#### BAB Progression Table

| **Class Combination** | **BAB Calculation** | **Attacks** |
|----------------------|-------------------|-------------|
| Fighter 4/Rogue 2 | +4 + +1 = +5 | +5 |
| Fighter 5/Rogue 1 | +5 + +0 = +5 | +5 |
| Fighter 6/Rogue 1 | +6 + +0 = +6 | +6/+1 |
| Fighter 8/Rogue 4 | +8 + +3 = +11 | +11/+6/+1 |

### Saving Throws
**Add the base save bonuses** for each class together.

#### Save Bonus Calculation
```
Final Save = Class 1 Save + Class 2 Save + Ability Modifier + Other Bonuses
```

#### Example Saves
Fighter 3/Cleric 2:
- **Fortitude**: +3 (Fighter) + +3 (Cleric) + Con modifier = +6 + Con
- **Reflex**: +1 (Fighter) + +0 (Cleric) + Dex modifier = +1 + Dex  
- **Will**: +1 (Fighter) + +3 (Cleric) + Wis modifier = +4 + Wis

## Skill Mechanics

### Class Skills
If a skill is a **class skill for any** of a multiclass character's classes, then **character level determines** the skill's maximum rank.

#### Class Skill Maximum
```
Maximum Rank = 3 + Character Level
```

### Cross-Class Skills
If a skill is **not a class skill** for any of the character's classes, the maximum rank is **one-half the maximum** for a class skill.

#### Cross-Class Maximum
```
Maximum Rank = (3 + Character Level) ÷ 2
```

### Skill Point Allocation
- **Gain skill points** from each class as you level in that class
- **Spend points** according to current class skill/cross-class status
- **Skill maximums** based on total character level

#### Example
Fighter 2/Rogue 3 (character level 5):
- **Class skills**: Maximum rank 8 (3 + 5)
- **Cross-class skills**: Maximum rank 4 (8 ÷ 2)
- **Hide skill**: Class skill for rogue, so maximum rank 8

## Special Class Feature Interactions

### Turning Undead
Both **clerics and experienced paladins** have the same ability.

#### Stacking Rules
If the character's **paladin level is 4th or higher**:
```
Effective Turning Level = Cleric Level + Paladin Level - 3
```

#### Example
Cleric 3/Paladin 4:
- **Effective turning level**: 3 + 4 - 3 = 4th level
- **Turns as**: 4th level cleric

### Uncanny Dodge
Both **experienced barbarians and experienced rogues** have the same ability.

#### Stacking Rules
- When gaining uncanny dodge a **second time**, gain **improved uncanny dodge** instead
- **Barbarian and rogue levels stack** to determine attacker level needed to flank

#### Example
Barbarian 2/Rogue 3:
- **Both classes grant uncanny dodge**
- **Character gains improved uncanny dodge**
- **Effective level**: 5th (for flanking purposes)

### Familiars
Both **wizards and sorcerers** have the same ability.

#### Stacking Rules
A sorcerer/wizard **stacks levels** to determine the familiar's:
- **Natural armor bonus**
- **Intelligence score**  
- **Special abilities**

#### Example
Sorcerer 3/Wizard 2:
- **Effective level**: 5th for familiar progression
- **Familiar benefits**: As 5th level caster

## Character Advancement

### Feats
A multiclass character gains **feats based on character level**, regardless of individual class level.

#### Feat Progression
- **1st level**: 1 feat (plus human bonus and class bonus feats)
- **3rd level**: 1 feat
- **6th level**: 1 feat
- **9th level**: 1 feat
- **Every 3 levels**: Additional feat

### Ability Score Increases  
A multiclass character gains **ability score increases based on character level**, regardless of individual class level.

#### Ability Increase Schedule
- **4th level**: +1 to any ability score
- **8th level**: +1 to any ability score  
- **12th level**: +1 to any ability score
- **Every 4 levels**: Additional +1 increase

### Spellcasting
The character gains **spells from all spellcasting classes** and keeps a **separate spell list for each class**.

#### Spell Mechanics
- **Separate progression**: Each class advances independently
- **Different spell lists**: Maintain separate known/prepared spells
- **Caster level tracking**: Track which class cast each spell
- **Spell effect calculation**: Based on **class level of the casting class**

#### Multiclass Spellcaster Example
Cleric 3/Wizard 2:
- **Cleric spells**: As 3rd level cleric (2nd level spells)
- **Wizard spells**: As 2nd level wizard (1st level spells)  
- **Separate spell books/lists**: Cleric prayers vs wizard spells
- **Different casting stats**: Wisdom for cleric, Intelligence for wizard

## Class Features Integration

### All Class Features
A multiclass character gets **all the class features** of all their classes but must also **suffer the consequences** of the special restrictions of all their classes.

#### Exception
A character who acquires the **barbarian class does not become illiterate** (regardless of other class literacy).

### Restrictions Stack
- **Armor restrictions**: Apply all class limitations
- **Weapon restrictions**: Apply all class limitations  
- **Behavioral codes**: Must follow all class requirements
- **Alignment restrictions**: Must satisfy all class requirements

#### Example Restrictions
Paladin/Monk:
- **Paladin requirements**: Lawful good alignment, code of conduct
- **Monk requirements**: Lawful alignment, no armor  
- **Combined**: Must be lawful good, follow paladin code, wear no armor

## Multiclassing Strategy

### Synergistic Combinations
- **Fighter/Rogue**: Combat prowess with skills
- **Cleric/Fighter**: Divine magic with combat ability
- **Ranger/Rogue**: Wilderness skills with stealth
- **Sorcerer/Bard**: Versatile magical abilities

### Challenging Combinations
- **Monk/Paladin**: Alignment and equipment restrictions
- **Barbarian/Monk**: Conflicting alignment requirements
- **Druid/Paladin**: Alignment restrictions may conflict

### Planning Considerations
- **Prerequisite planning**: Meet requirements for desired classes
- **Progression timing**: When to take levels in each class
- **Ability score allocation**: Support multiple class needs
- **Equipment planning**: Work within class restrictions

---

> **📖 Related**: [Character Creation](character-creation.md), [Class Descriptions](../classes/), [Feat Selection](../feats/)
