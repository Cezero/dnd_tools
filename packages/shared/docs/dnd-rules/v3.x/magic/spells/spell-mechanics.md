# Spell Mechanics

Understanding **how spells work** is essential for implementing magic systems, spellcasting validation, and spell effects in D&D applications. This covers the fundamental mechanics that govern all spells.

## Spell Schools and Categories

### Eight Schools of Magic
**Abjuration** - Protective magic
- **Purpose**: Barriers, negation, banishment, protection
- **Special Rule**: Multiple abjurations within 10 feet interfere (-4 Search DC to detect)
- **Examples**: *Shield*, *dispel magic*, *banishment*

**Conjuration** - Bringing forth
- **Purpose**: Summoning, calling, creation, healing, teleportation  
- **Special Rule**: Cannot appear inside objects or unsupported space
- **Subschools**: Calling, Creation, Healing, Summoning, Teleportation

**Divination** - Information gathering
- **Purpose**: Secrets, prediction, detection, anti-deception
- **Special Rule**: Many use cone-shaped areas that move with caster
- **Subschool**: Scrying (creates invisible sensor)

**Enchantment** - Mind affecting
- **Purpose**: Control thoughts, emotions, behavior
- **Special Rule**: Most only affect living, intelligent creatures
- **Subschools**: Charm, Compulsion

**Evocation** - Energy manipulation
- **Purpose**: Direct damage, energy effects, force
- **Special Rule**: Often allows spell resistance
- **Examples**: *Fireball*, *lightning bolt*, *magic missile*

**Illusion** - Deception and misdirection
- **Purpose**: False images, sounds, concealment, phantasms
- **Special Rule**: Disbelief saves to see through
- **Subschools**: Figment, Glamer, Pattern, Phantasm, Shadow

**Necromancy** - Death and undeath
- **Purpose**: Death effects, undead creation, life force manipulation
- **Special Rule**: Often evil, may have alignment restrictions
- **Examples**: *Animate dead*, *energy drain*, *speak with dead*

**Transmutation** - Change and alteration
- **Purpose**: Physical transformation, enhancement, alteration
- **Special Rule**: Often affects physical properties permanently
- **Examples**: *Polymorph*, *haste*, *stone to flesh*

**Universal** - No school
- **Purpose**: Utility effects that don't fit other schools
- **Special Rule**: Cannot be specialized in or opposed
- **Examples**: *Prestidigitation*, *wish*, *limited wish*

## Spell Descriptor Categories

### Descriptors Define Special Rules
**[Acid]** - Acid damage, affects objects normally
**[Air]** - Air elemental themes, wind effects
**[Chaotic]** - Chaotic alignment, detected by *detect chaos*
**[Cold]** - Cold damage, may freeze liquids
**[Darkness]** - Creates or enhances darkness
**[Death]** - Death effects, usually Fort negates
**[Earth]** - Earth elemental themes, stone/metal effects
**[Evil]** - Evil alignment, detected by *detect evil*
**[Fear]** - Fear effects, mind-affecting
**[Fire]** - Fire damage, may ignite objects
**[Force]** - Pure magical energy, affects incorporeal
**[Good]** - Good alignment, detected by *detect good*
**[Language-Dependent]** - Target must understand caster
**[Lawful]** - Lawful alignment, detected by *detect law*
**[Light]** - Creates or enhances light
**[Mind-Affecting]** - Affects intelligent creatures only
**[Sonic]** - Sound-based, may affect objects
**[Water]** - Water elemental themes, liquid effects

## Spell Components

### Component Types and Requirements
```pseudocode
class SpellComponents {
    verbal: boolean        // Spoken incantation
    somatic: boolean      // Gestures, hand movements
    material: string      // Physical components consumed
    focus: string         // Reusable physical item
    divineFocus: boolean  // Holy symbol requirement
    experiencePoints: number // XP cost for casting
    
    function canCastSpell(caster, spell) {
        if (spell.verbal && caster.isSilenced()) return false
        if (spell.somatic && caster.handsAreBound()) return false
        if (spell.material && !caster.hasComponents(spell.material)) return false
        if (spell.focus && !caster.hasFocus(spell.focus)) return false
        if (spell.experiencePoints && caster.currentXP < spell.experiencePoints) return false
        
        return true
    }
}
```

### Component Rules
**Verbal (V):**
- **Requires speech** - Clear articulation needed
- **Blocked by silence** - *Silence* spell prevents casting
- **Language independent** - Not affected by language barriers
- **Volume required** - Must be audible (strong speaking voice)

**Somatic (S):**
- **Hand gestures** - Intricate finger movements
- **Free hand required** - One hand must be unencumbered
- **Armor interference** - Arcane spell failure chance
- **Bound hands** - Prevents somatic components

**Material (M):**
- **Physical components** - Consumed in casting
- **Component pouch** - Standard assumption for common materials
- **Expensive components** - Listed with gold piece cost
- **Availability** - Must be acquired before casting

**Focus (F):**
- **Reusable item** - Not consumed in casting
- **Must be held** - In hand during casting
- **Specific requirements** - Exact item type specified
- **Value requirements** - Some have minimum cost

## Casting Time and Actions

### Casting Time Categories
| Casting Time | Action Type | When Cast | Initiative |
|--------------|-------------|-----------|------------|
| **1 standard action** | Standard | Your turn | Normal |
| **1 round** | Full round | Start of next turn | Normal |
| **1 full round** | Full round | End of your turn | Normal |
| **1 minute** | 10 rounds | Extended casting | N/A |
| **10 minutes** | 100 rounds | Ritual casting | N/A |
| **1 hour+** | Extended | Long ritual | N/A |

### Concentration and Interruption
```pseudocode
class ConcentrationChecks {
    function calculateConcentrationDC(caster, spell, distraction) {
        baseDC = 0
        
        switch(distraction.type) {
            case "damaged_while_casting":
                baseDC = 10 + distraction.damage
                break
            case "continuous_damage":
                baseDC = 10 + distraction.damagePerRound / 2
                break
            case "vigorous_motion":
                baseDC = 10 + spell.level
                break
            case "violent_motion":
                baseDC = 15 + spell.level
                break
            case "extremely_violent_motion":
                baseDC = 20 + spell.level
                break
            case "entangled":
                baseDC = 15 + spell.level
                break
            case "grappling":
                baseDC = 20 + spell.level
                break
            case "weather":
                baseDC = 5 + spell.level
                break
        }
        
        return baseDC
    }
}
```

## Range and Targeting

### Range Categories
**Personal** - Affects caster only
**Touch** - Must touch target (melee touch attack)
**Close** - 25 ft + 5 ft/2 levels
**Medium** - 100 ft + 10 ft/level  
**Long** - 400 ft + 40 ft/level
**Unlimited** - No range limit (usually other planes)

### Target Types
**Creature** - Living beings, undead, constructs
**Object** - Non-living items
**Area** - Specified area regardless of contents
**Effect** - Creates something new (walls, creatures)

### Area Effect Shapes
```pseudocode
class AreaEffects {
    function calculateAreaOfEffect(shape, casterLevel, spellData) {
        switch(shape) {
            case "burst":
                return {
                    type: "sphere",
                    radius: spellData.baseRadius + (spellData.radiusPerLevel * casterLevel),
                    originPoint: "target"
                }
                
            case "emanation":
                return {
                    type: "sphere", 
                    radius: spellData.baseRadius,
                    originPoint: "caster",
                    movesWithCaster: true
                }
                
            case "spread":
                return {
                    type: "expanding",
                    radius: spellData.baseRadius + (spellData.radiusPerLevel * casterLevel),
                    aroundCorners: true
                }
                
            case "cone":
                return {
                    type: "cone",
                    length: spellData.baseLength + (spellData.lengthPerLevel * casterLevel),
                    originPoint: "caster"
                }
        }
    }
}
```

---

> **🎯 AI Implementation**: Essential for magic system validation, spellcasting mechanics, and spell effect calculation in D&D applications.

**See Also**: [Spell Lists](spell-lists.md) • [Caster Level](../casting/caster-level.md) • [Magic Schools](schools/) • [Spell Resistance](resistance.md)
