# Magic Schools Overview

The **eight schools of magic** categorize spells by their fundamental approach and effects. Understanding spell schools is essential for specialist wizards, spell resistance, and magic system implementation in D&D applications.

## School Characteristics

### Abjuration - Protection and Negation
**Core Concept**: Defensive magic, barriers, dispelling
**Specialist**: Abjurer
**Prohibited Schools**: Usually Conjuration and Illusion

**Key Mechanics:**
- **Interference rule**: Multiple abjurations within 10 feet create energy fluctuations
- **Search DC reduction**: -4 penalty to detect interfering abjurations
- **Barrier behavior**: Cannot push away creatures, only block them

**Common Effects:**
- AC bonuses and damage resistance
- Spell immunity and magic negation
- Banishment and dimensional anchoring
- Detection prevention and concealment

**Implementation:**
```pseudocode
class AbjurationEffects {
    function checkInterference(abjurations, position) {
        nearbyAbjurations = abjurations.filter(spell => 
            spell.distanceFrom(position) <= 10 && 
            spell.duration >= 24_hours
        )
        
        return nearbyAbjurations.length > 1
    }
    
    function getSearchDC(baseSearchDC, hasInterference) {
        return hasInterference ? baseSearchDC - 4 : baseSearchDC
    }
}
```

### Conjuration - Bringing Forth
**Core Concept**: Summoning, creation, healing, transportation
**Specialist**: Conjurer  
**Prohibited Schools**: Usually Divination and Necromancy

**Subschools:**
- **Calling**: Permanent transportation from other planes
- **Creation**: Temporary or permanent object/creature creation
- **Healing**: Restoration of hit points and conditions
- **Summoning**: Temporary creatures that return when killed
- **Teleportation**: Instant transportation

**Placement Rules:**
- Cannot appear inside other objects
- Must appear on supporting surface
- Must be within range but can leave range

### Divination - Information and Knowledge
**Core Concept**: Gaining information, prediction, detection
**Specialist**: Diviner
**Prohibited Schools**: Usually Enchantment and Evocation

**Special Mechanics:**
- **Cone areas**: Many spells use cone-shaped detection areas
- **Progressive information**: Studying same area multiple rounds reveals more
- **Scrying sensors**: Create invisible magical sensors

**Scrying Rules:**
```pseudocode
class ScryingSensor {
    function createSensor(caster, location) {
        sensor = {
            location: location,
            sensoryAcuity: caster.sensoryAcuity,
            detectionDC: 20,
            canBeDispelled: true,
            intelligenceRequired: 12
        }
        
        return sensor
    }
    
    function attemptDetection(creature, sensor) {
        if (creature.intelligence >= 12) {
            return creature.rollIntelligence() >= 20
        }
        return false
    }
}
```

### Enchantment - Mind Control
**Core Concept**: Mental influence, emotion control, behavior modification
**Specialist**: Enchanter
**Prohibited Schools**: Usually Evocation and Necromancy

**Subschools:**
- **Charm**: Makes target regard caster as friend
- **Compulsion**: Forces specific behaviors or actions

**Key Limitations:**
- Most affect only living, intelligent creatures
- Many allow Will saves to resist
- Often have duration limits

### Evocation - Energy Manipulation  
**Core Concept**: Direct energy effects, force, elemental damage
**Specialist**: Evoker
**Prohibited Schools**: Usually Enchantment and Illusion

**Characteristics:**
- High damage potential
- Often allows spell resistance
- Straightforward, direct effects
- Elemental damage types

**Energy Types:**
- **Acid**: Ongoing damage, affects objects
- **Cold**: Instant damage, may freeze
- **Electricity**: Instant damage, conductive
- **Fire**: Instant damage, may ignite
- **Force**: Pure energy, affects incorporeal
- **Sonic**: Sound-based, may affect objects

### Illusion - Deception and Misdirection
**Core Concept**: False sensory input, concealment, mental images
**Specialist**: Illusionist  
**Prohibited Schools**: Usually Necromancy and Transmutation

**Subschools:**
- **Figment**: False sensory impressions
- **Glamer**: Changes apparent properties
- **Pattern**: Affects minds through visual patterns
- **Phantasm**: Mental illusions affecting one mind
- **Shadow**: Quasi-real illusions using shadow material

**Disbelief Mechanics:**
```pseudocode
class IllusionDisbelief {
    function attemptDisbelief(target, illusion) {
        if (target.hasReasonToSuspect(illusion)) {
            willSave = target.rollWillSave()
            return willSave >= illusion.saveDC
        }
        return false
    }
    
    function interactWithIllusion(character, illusion) {
        if (illusion.type == "figment" && character.physicallyInteracts()) {
            return "automatically_disbelieved"
        }
        return "no_effect"
    }
}
```

### Necromancy - Death and Undeath
**Core Concept**: Death, undead, negative energy, life force
**Specialist**: Necromancer
**Prohibited Schools**: Usually Conjuration and Enchantment

**Common Themes:**
- Death effects and energy drain
- Undead creation and control
- Life force manipulation
- Communication with dead

**Alignment Considerations:**
- Many necromancy spells are evil
- Creating undead is inherently evil act
- May have class or campaign restrictions

### Transmutation - Change and Alteration
**Core Concept**: Physical transformation, enhancement, alteration
**Specialist**: Transmuter
**Prohibited Schools**: Usually Divination and Illusion

**Effect Types:**
- Size and shape changes (polymorph effects)
- Physical enhancement (ability bonuses)
- State changes (flesh to stone)
- Movement enhancement (haste, telekinesis)

## Universal Spells

**No School Association:**
- Cannot be specialized in
- Cannot be prohibited
- Often utility or meta-magic effects

**Examples:**
- *Prestidigitation* - Minor magical effects
- *Wish* - Reality alteration
- *Limited Wish* - Lesser reality alteration
- *Permanency* - Makes effects permanent

## Spell School Implementation

### For Specialist Wizards
```pseudocode
class SpecialistWizard {
    function canLearnSpell(wizard, spell) {
        if (wizard.prohibitedSchools.includes(spell.school)) {
            return false
        }
        return true
    }
    
    function getBonusSpellSlots(wizard, spellLevel) {
        if (spellLevel >= 1) {
            return 1  // +1 spell slot per level for specialty school
        }
        return 0
    }
    
    function getSaveDCBonus(wizard, spell) {
        if (spell.school == wizard.specialtySchool) {
            return 2  // +2 DC for specialty school spells
        }
        return 0
    }
}
```

---

> **🎯 AI Implementation**: Essential for wizard specialization, spell categorization, and magic system validation in D&D applications.

**See Also**: [Spell Mechanics](spell-mechanics.md) • [Wizard Classes](../../character/classes/wizard/) • [Magic Resistance](../resistance/) • [Spell Lists](../spell-lists/)
