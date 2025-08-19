# Magic Item Activation Mechanics

Magic items activate through **distinct methods** that determine their **combat behavior**, **action requirements**, and **vulnerability to disruption**. Understanding these mechanics is crucial for implementing magic item systems in D&D applications.

## Activation Types

### Always Active Items
**Characteristics:**
- **No activation required** - Function continuously when worn/carried
- **No action cost** - Provide passive benefits
- **Cannot be disrupted** - Always function unless suppressed

**Examples:**
- **+1 armor** - Continuous AC bonus
- **Ring of protection +1** - Constant deflection bonus
- **Cloak of resistance +1** - Ongoing save bonus
- **Amulet of natural armor +1** - Persistent natural armor

**Implementation:**
```pseudocode
class AlwaysActiveItem {
    function applyEffects(character) {
        if (character.isWearing(this) || character.isCarrying(this)) {
            character.addBonus(this.bonusType, this.bonusValue)
        }
    }
    
    function isActive(character) {
        return character.hasEquipped(this) && !isSuppressed()
    }
}
```

### Command Word Activation
**Characteristics:**
- **Spoken trigger** - Requires verbal component
- **Standard action** - Does not provoke attacks of opportunity
- **Can be silenced** - Fails if unable to speak
- **No concentration** - Cannot be disrupted once activated

**Examples:**
- **Wands** - Most wands use command words
- **Rods** - Many rod abilities triggered by command
- **Wondrous items** - Boots of speed, hat of disguise

**Combat Integration:**
```pseudocode
function activateCommandWord(character, item) {
    if (character.isSilenced() || !character.canSpeak()) {
        return "Cannot speak command word"
    }
    
    if (!character.canTakeStandardAction()) {
        return "Cannot take standard action"
    }
    
    // Does not provoke attacks of opportunity
    return item.triggerEffect(character)
}
```

### Spell Trigger Activation
**Characteristics:**
- **Requires spell knowledge** - Must know the trigger spell
- **Same as casting spell** - Follows all spellcasting rules
- **Provokes attacks of opportunity** - Like casting spells
- **Can be disrupted** - Concentration checks required if damaged

**Examples:**
- **Scrolls** - Require ability to cast the spell
- **Some staffs** - Spell trigger for specific effects
- **Spell completion items** - Written magical effects

**Validation Logic:**
```pseudocode
function canUsespellTrigger(character, item) {
    requiredSpell = item.getTriggerSpell()
    
    return character.canCastSpells() &&
           character.knowsSpell(requiredSpell) &&
           character.casterLevel >= requiredSpell.minimumLevel
}

function activateSpellTrigger(character, item) {
    if (threatensCharacter(character)) {
        concentrationDC = 15 + item.spellLevel
        if (!character.rollConcentration(concentrationDC)) {
            return "Concentration failed - item not activated"
        }
    }
    
    // Provokes attacks of opportunity
    triggerAttacksOfOpportunity(character)
    return item.castSpell(character)
}
```

### Use Activated Items
**Characteristics:**
- **Physical manipulation** - Push button, twist dial, strike surface
- **Standard action** - Usually does not provoke attacks of opportunity
- **Simple to use** - No special knowledge required
- **Immediate effect** - Cannot be disrupted once triggered

**Examples:**
- **Potions** - Drinking the potion
- **Oil applications** - Applying to surface
- **Mechanical triggers** - Pushing, twisting, striking

**Usage Pattern:**
```pseudocode
function activateUseItem(character, item) {
    if (!character.canTakeStandardAction()) {
        return "Cannot take required action"
    }
    
    if (item.requiresHands && character.handsOccupied()) {
        return "Hands are occupied"
    }
    
    // Usually does not provoke (except potions in some cases)
    return item.executeEffect(character)
}
```

### Spell Completion Activation
**Characteristics:**
- **Requires spellcasting** - Must be able to cast arcane or divine spells
- **All spell rules apply** - Concentration, components, timing
- **High disruption risk** - Vulnerable to interruption
- **Provokes opportunity** - Always provokes attacks

**Primary Example: Scrolls**
```pseudocode
class ScrollActivation {
    function canActivate(character, scroll) {
        spell = scroll.getSpell()
        
        return character.canCastSpells() &&
               character.casterLevel >= (spell.level * 2 - 1) &&
               character.hasSpellcastingClass(spell.type)
    }
    
    function getActivationDC(character, scroll) {
        spell = scroll.getSpell()
        requiredLevel = spell.level * 2 - 1
        
        if (character.casterLevel >= requiredLevel) {
            return 0  // Automatic success
        } else {
            return 20 + spell.level  // Skill check required
        }
    }
}
```

## Timing and Action Economy

### Action Type Summary
| Activation Type | Action Required | Provokes AoO | Can Be Disrupted |
|----------------|-----------------|--------------|------------------|
| Always Active | None | No | No |
| Command Word | Standard | No | No |
| Spell Trigger | As spell | Yes | Yes |
| Use Activated | Standard | Usually No | No |
| Spell Completion | As spell | Yes | Yes |

### Combat Turn Integration
```pseudocode
function processMagicItemActivation(combat, character, item) {
    activationType = item.getActivationType()
    
    switch(activationType) {
        case ALWAYS_ACTIVE:
            // No action required, always functioning
            return item.applyPassiveEffects(character)
            
        case COMMAND_WORD:
            if (character.hasStandardAction()) {
                character.useStandardAction()
                return item.activate(character)
            }
            break
            
        case SPELL_TRIGGER:
        case SPELL_COMPLETION:
            return processSpellActivation(combat, character, item)
            
        case USE_ACTIVATED:
            if (character.hasActionType(item.requiredAction)) {
                character.useAction(item.requiredAction)
                return item.activate(character)
            }
            break
    }
    
    return "Cannot activate item this turn"
}
```

## Special Considerations

### Environmental Effects
- **Silence** - Prevents command word activation
- **Antimagic field** - Suppresses all magical item functions
- **Dispel magic** - May suppress temporary item effects
- **Darkness** - May prevent reading scrolls or written items

### Item Slot Interactions
- **Worn items** - Must be properly equipped to function
- **Held items** - Must be in hand for activation
- **Carried items** - Some work from pack, others require access

### Charge Management
```pseudocode
class ChargedItem {
    charges: number
    maxCharges: number
    
    function activate(character) {
        if (this.charges <= 0) {
            return "Item has no remaining charges"
        }
        
        this.charges -= this.getChargesCost()
        return this.executeEffect(character)
    }
    
    function isExpended() {
        return this.charges <= 0
    }
}
```

---

> **🎯 AI Implementation**: Critical for accurate magic item behavior in combat systems, inventory management, and character sheet applications.

**See Also**: [Magic Items Overview](overview.md) • [Combat Actions](../../combat/actions/) • [Spellcasting Rules](../casting/) • [Equipment Management](../../equipment/)
