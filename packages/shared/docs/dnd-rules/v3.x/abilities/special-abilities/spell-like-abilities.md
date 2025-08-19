# Spell-Like Abilities (Sp)

Spell-like abilities function **exactly like spells** of the same name, but are innate magical abilities rather than learned spells. They follow most spell rules but have unique characteristics regarding components and usage.

## Core Mechanics

### Spell Equivalence
- **Functions like the named spell** in all respects
- Uses **same target restrictions** and effects
- **Same saving throw DCs** as equivalent spells
- **Same range and duration** unless otherwise noted

### Component Differences
- **No verbal component** required
- **No somatic component** required  
- **No material component** required
- **No focus** required
- **No XP cost** required
- **Mental activation only**

### Casting Characteristics
- Takes **same time as equivalent spell** (usually 1 standard action)
- **Armor never interferes** with activation
- **Concentration checks** may be required if threatened
- **Can be disrupted** by damage during casting

## Combat Integration

### Attacks of Opportunity
- **Always provokes** attacks of opportunity when used
- **Concentration check** (DC 15 + damage) to cast defensively
- **Can be disrupted** by damage during activation
- **Defensive casting** possible with successful Concentration check

### Magical Vulnerability
- **Subject to spell resistance** - requires caster level check
- **Can be dispelled** by *dispel magic* and similar effects  
- **Suppressed** by antimagic fields and *silence* (if verbal component normally required)
- **Can be counterspelled** if opponent recognizes the ability

### Cannot Be Used For
- **Counterspelling** other spells or abilities
- **Item creation** that requires the actual spell
- **Prerequisites** for feats requiring specific spells
- **Spell completion** or **spell trigger** magic item activation

## Caster Level and Limits

### Caster Level Determination
- **Specified caster level** in creature description
- **Equal to Hit Dice** if not specified
- **Never lower** than minimum needed to cast equivalent spell
- **Affects** save DCs, duration, damage, and range

### Usage Limitations
- **At will** - no usage limit
- **X/day** - limited daily uses
- **X/week** - limited weekly uses
- **Per encounter** - once per combat encounter

### Save DC Calculation
```
DC = 10 + spell level + creature's relevant ability modifier
```

## Implementation Guidelines

### For Character Management
```pseudocode
class SpellLikeAbility {
    name: string
    spellEquivalent: string
    casterLevel: number
    usesPerDay: number (or "at will")
    saveAbility: AbilityScore
    
    function canUse(): boolean {
        return remainingUses > 0 || usageType == "at will"
    }
    
    function getSaveDC(): number {
        spellLevel = getSpellLevel(spellEquivalent)
        return 10 + spellLevel + creature.getModifier(saveAbility)
    }
}
```

### For Combat Systems
- **Check spell resistance** before applying effects
- **Roll concentration** if casting defensively
- **Track usage** for limited abilities
- **Apply dispel magic** effects normally

### Tactical Considerations
- **More vulnerable** than supernatural abilities
- **Reliable damage source** for many creatures
- **Can be planned around** by opponents
- **Resource management** for limited uses

## Common Examples

### Low-Level Spell-Like Abilities
- **Drow *darkness*** - 1/day, caster level equal to class level
- **Tiefling *darkness*** - 1/day, caster level equal to HD
- **Celestial *light*** - at will, caster level equal to HD

### High-Level Spell-Like Abilities  
- **Balor *teleport without error*** - at will, CL 20th
- **Solar *resurrection*** - at will, CL 20th
- **Pit Fiend *meteor swarm*** - 1/day, CL 20th

### Unique Spell-Like Abilities
- **Dragon breath weapons** (function like spells but are supernatural)
- **Beholder eye rays** (each functions like a specific spell)
- **Medusa petrifying gaze** (functions like *flesh to stone*)

## Balance and Design

### Power Scaling
- **Low-level creatures** - utility and minor combat abilities
- **Mid-level creatures** - significant combat options
- **High-level creatures** - powerful effects, often at-will

### Resource Economics
- **At-will abilities** define creature's basic capabilities
- **Limited uses** provide burst potential
- **High-level effects** usually restricted to few uses per day

---

> **🎯 AI Implementation**: Requires full spell mechanics including SR checks, dispelling, concentration, and usage tracking. Most complex special ability type.

**See Also**: [Special Abilities Overview](overview.md) • [Magic Resistance](../../magic/resistance/) • [Concentration](../../skills/concentration.md)
