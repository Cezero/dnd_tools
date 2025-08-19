# Supernatural Abilities (Su)

Supernatural abilities are **magical effects** that are innate to a creature's nature. Unlike spell-like abilities, they don't function exactly like spells, but they are still magical and can be affected by antimagic effects.

## Core Characteristics

### Magical but Innate
- **Magical in nature** - subject to magical suppression
- **Not actual spells** - cannot be counterspelled
- **Innate to creature** - not learned like spells
- **Always available** when creature is conscious and able

### Suppression Rules
- **Suppressed** in antimagic fields
- **Cannot be dispelled** by *dispel magic*
- **Not subject** to spell resistance
- **Negated** by effects that suppress magic

### Activation Mechanics
- **Does not provoke** attacks of opportunity
- **No concentration check** required
- **Mental activation** - no components needed
- **Usually immediate** or standard action

## Combat Integration

### Reliable but Suppressible
- **No disruption** from damage during use
- **Cannot be counterspelled** like spells
- **Functions normally** in most circumstances
- **Completely suppressed** in antimagic areas

### Action Requirements
- Most supernatural abilities are **standard actions**
- Some are **immediate** or **free actions**
- **Passive abilities** function continuously
- **Triggered abilities** activate automatically

### Interaction with Magic
- **Considered magical** for detection purposes
- **Affected by** antimagic field, *mage's disjunction*
- **Not affected by** spell resistance or dispelling
- **Can be enhanced** by magical effects

## Common Examples

### Creature Supernatural Abilities
- **Dragon breath weapons** - magical but not spells
- **Undead turn resistance** - magical defense against turning
- **Incorporeal touch** - supernatural interaction with material
- **Energy drain** - negative level bestowal

### Class-Based Supernatural Abilities
- **Cleric turn undead** - channeling divine power
- **Paladin detect evil** - supernatural sense ability
- **Sorcerer familiar** - magical creature bond
- **Druid wild shape** - supernatural transformation

### Environmental Supernatural Abilities
- **Aura effects** - continuous magical emanations
- **Regeneration (magical)** - supernatural healing
- **Damage reduction (magical)** - supernatural toughness
- **Fast healing** - accelerated natural healing

## Implementation Guidelines

### For Character Management
```pseudocode
class SupernaturalAbility {
    name: string
    actionType: ActionType
    duration: Duration
    usageLimit: number | "at will"
    
    function canUse(environment): boolean {
        return !environment.hasAntimagic() && 
               creature.isConscious() &&
               (usageLimit == "at will" || remainingUses > 0)
    }
    
    function isActive(environment): boolean {
        return canUse(environment) && 
               !environment.suppressesMagic()
    }
}
```

### For Environmental Effects
- **Check for antimagic** before allowing activation
- **Suppress ongoing effects** in antimagic areas
- **Resume effects** when leaving suppression
- **No spell resistance** calculations needed

### Game Balance Considerations
- **More reliable** than spell-like abilities
- **Less reliable** than extraordinary abilities
- **Cannot be easily countered** by most opponents
- **Tactical vulnerability** to antimagic effects

## Design Philosophy

### Power Level
- **Moderate to high** power abilities
- **Signature creature abilities** often supernatural
- **Class capstone abilities** frequently supernatural
- **Unique creature traits** commonly supernatural

### Thematic Role
- Represents **inherent magical nature**
- **Connection to magical forces** without spell knowledge
- **Inborn magical talent** vs. learned spellcasting
- **Natural magical phenomena** within creature

## Specific Mechanics

### Duration Types
- **Instantaneous** - immediate effect, no ongoing duration
- **Concentration** - maintained by mental focus
- **Permanent** - ongoing until suppressed or removed
- **Timed** - specific duration regardless of concentration

### Area Effects
- **Emanation** - continuous area around creature
- **Burst** - instant area effect at target point
- **Cone** - area extending from creature
- **Line** - straight line effect from creature

### Save or Die Effects
- **Fortitude saves** common for supernatural abilities
- **Will saves** for mental supernatural effects
- **Reflex saves** for area supernatural effects
- **No save** for some continuous aura effects

## Advanced Interactions

### Magical Item Synergy
- **Enhancement bonuses** can improve supernatural abilities
- **Metamagic effects** generally don't apply
- **Spell storing** cannot contain supernatural abilities
- **Dispelling items** don't affect supernatural abilities

### Multiclass Considerations
- **Class-based** supernatural abilities may have restrictions
- **Racial** supernatural abilities always function
- **Level-dependent** effects scale with character level
- **Prerequisites** may involve multiple ability sources

---

> **🎯 AI Implementation**: Track antimagic suppression and usage limits. No spell resistance, counterspelling, or disruption mechanics. Simpler than spell-like but more complex than extraordinary.

**See Also**: [Special Abilities Overview](overview.md) • [Antimagic Effects](../../magic/antimagic/) • [Environmental Hazards](../../environments/hazards/)
