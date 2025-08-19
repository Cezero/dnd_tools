# Special Abilities Overview

Special abilities are **unique powers** that creatures possess beyond their normal physical and mental capabilities. These abilities are categorized into four main types, each with distinct characteristics that affect how they interact with magic, combat, and other game mechanics.

## Types of Special Abilities

### Special Ability Categories

| Type | Description | Magic Interaction | Dispellable | Spell Resistance | Antimagic Field | Attack of Opportunity |
|------|-------------|-------------------|-------------|------------------|-----------------|----------------------|
| **Natural** | Physical nature abilities | None | No | No | No | No |
| **Extraordinary** | Nonmagical but beyond normal | None | No | No | No | No |
| **Supernatural** | Magical but innate | Magical | No | No | Yes | No |
| **Spell-Like** | Functions like spells | Magical | Yes | Yes | Yes | Yes |

## Key Distinctions for Game Implementation

### Natural Abilities
- **Most basic** type of special ability
- Creature has it due to **physical nature**
- Examples: A bat's echolocation, a spider's web spinning
- **Always function** regardless of magical effects

### Extraordinary Abilities (Ex)
- **Nonmagical** but extraordinary
- Cannot be learned by just anyone
- **Never disrupted** by antimagic
- Usually **passive** or **reactive**
- Examples: A barbarian's rage, uncanny dodge

### Supernatural Abilities (Su)  
- **Magical** but innate to the creature
- **Not spells** - cannot be counterspelled
- **Suppressed** by antimagic fields
- Usually **mental activation**
- Examples: Dragon breath weapons, undead turning resistance

### Spell-Like Abilities (Sp)
- Function **exactly like spells**
- Subject to **all spell rules**
- Can be **dispelled** and **counterspelled**
- Have **caster levels** and **usage limits**
- Examples: A drow's *darkness* ability, demon *teleport*

## Implementation Guidelines

### For Character Management Tools
- **Track usage limits** for spell-like abilities
- **Check antimagic effects** on supernatural abilities  
- **Natural/Extraordinary abilities** always function
- **Caster level** determines spell-like ability effects

### For Combat Systems
- **Spell-like abilities** provoke attacks of opportunity
- **Concentration checks** may be required
- **Dispel magic** only affects spell-like abilities
- **Spell resistance** applies only to spell-like abilities

### For Game Balance
- **Extraordinary abilities** are the most reliable
- **Supernatural abilities** can be tactically suppressed
- **Spell-like abilities** are most vulnerable to disruption
- **Natural abilities** are baseline creature capabilities

## Cross-References

- [Extraordinary Abilities](extraordinary-abilities.md) - Detailed rules for Ex abilities
- [Supernatural Abilities](supernatural-abilities.md) - Detailed rules for Su abilities  
- [Spell-Like Abilities](spell-like-abilities.md) - Detailed rules for Sp abilities
- [Magic Overview](../../magic/) - How abilities interact with magic
- [Combat Mechanics](../../combat/) - How abilities function in combat

---

> **🎯 AI Tool Focus**: This overview helps AI agents categorize and implement special abilities correctly in character sheets, combat trackers, and rule validation systems.
