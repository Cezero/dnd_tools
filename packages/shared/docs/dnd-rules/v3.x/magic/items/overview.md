# Magic Items Overview

Magic items are **permanent magical objects** that provide ongoing benefits, activated abilities, or consumable magical effects. Understanding their mechanics is essential for inventory management, treasure systems, and character advancement in D&D applications.

## Item Categories

### Primary Categories
| Category | Description | Usage Pattern | Charges/Limits |
|----------|-------------|---------------|----------------|
| **Armor & Shields** | Enhanced protection | Worn continuously | Permanent |
| **Weapons** | Enhanced combat ability | Wielded in combat | Permanent |
| **Potions** | Consumable spell effects | Single use | Consumed |
| **Rings** | Finger-worn abilities | 2 max worn | Permanent |
| **Rods** | Scepter-like implements | Held/activated | Daily uses |
| **Scrolls** | Written spells | Single use | Consumed |
| **Staffs** | Multi-spell implements | Held/activated | 50 charges |
| **Wands** | Single-spell implements | Held/activated | 50 charges |
| **Wondrous Items** | Miscellaneous magical objects | Varies | Varies |

### Special Categories
- **Cursed Items** - Items with negative effects or drawbacks
- **Intelligent Items** - Items with their own consciousness and abilities
- **Artifacts** - Unique, extremely powerful items (Minor/Major)

## Activation Methods

### Always Active
- **Continuous effects** - Work while worn/carried
- **No activation required** - Automatic benefits
- **Examples**: +1 armor, ring of protection

### Command Word
- **Spoken activation** - Requires verbal component
- **Standard action** - Does not provoke attacks of opportunity  
- **Examples**: Wands, many wondrous items

### Spell Trigger
- **Spell completion** - Requires spell knowledge
- **Provokes attacks of opportunity** - Like casting spells
- **Examples**: Scrolls, some staffs

### Use Activated
- **Physical manipulation** - Push, twist, strike
- **Standard action** - Usually does not provoke
- **Examples**: Potions, some rods

### Spell Completion
- **Requires spellcasting ability** - Must be able to cast spell
- **Same rules as spells** - Concentration, components, etc.
- **Examples**: Scrolls, some magical writings

## Key Mechanics for Implementation

### Detection and Identification
```pseudocode
class MagicItem {
    auraStrength: "Faint" | "Moderate" | "Strong" | "Overwhelming"
    schoolOfMagic: MagicSchool
    casterLevel: number
    
    function detectMagicResult(): DetectionInfo {
        return {
            magical: true,
            aura: this.auraStrength,
            school: this.schoolOfMagic
        }
    }
    
    function identifyDC(): number {
        return 15 + this.casterLevel
    }
}
```

### Activation Validation
```pseudocode
function canActivateItem(character, item): boolean {
    if (item.isAlwaysActive()) return true
    
    switch(item.activationType) {
        case "command_word":
            return character.canSpeak() && 
                   character.hasItem(item) &&
                   !character.isSilenced()
        
        case "spell_trigger":
            return character.canCastSpells() &&
                   character.knowsSpell(item.triggerSpell)
        
        case "use_activated":
            return character.canTakeStandardAction() &&
                   character.hasItemInHand(item)
    }
}
```

### Wearing and Slot Limits
| Body Slot | Limit | Examples |
|-----------|-------|----------|
| Armor | 1 | Armor, robes |
| Shield | 1 | Shields, bucklers |
| Rings | 2 | Rings of any type |
| Hands | 2 | Gloves, gauntlets |
| Feet | 1 | Boots, shoes |
| Head | 1 | Helmets, hats, headbands |
| Neck | 1 | Amulets, necklaces |
| Belt | 1 | Belts, girdles |
| Body | 1 | Robes, vestments |
| Shoulders | 1 | Cloaks, capes |

### Treasure and Economics

#### Market Value Determination
- **Base Price** - Core magical enhancement value
- **Material Cost** - Cost of non-magical item (if applicable)
- **Component Costs** - Expensive spell components
- **Creation Multipliers** - Special materials, circumstances

#### AI Tool Applications
- **Random treasure generation** - Weighted by encounter level
- **Shop inventory management** - Availability and pricing
- **Character wealth tracking** - Carrying value calculations
- **Campaign balance** - Power level monitoring

## Common Rules Interactions

### Stacking and Bonuses
- **Enhancement bonuses** don't stack with same type
- **Different bonus types** stack normally
- **Multiple effects** from same item stack
- **Temporary vs permanent** - temporary overrides if higher

### Combat Integration
- **Drawing magic items** - Same rules as normal items
- **Activation in combat** - Action type determines opportunity
- **Sundering magic items** - Higher hardness and hit points
- **Spell resistance** - Some items grant ongoing SR

### Environmental Effects
- **Antimagic fields** - Suppress magical properties
- **Dispel magic** - Can suppress temporary effects
- **Detect magic** - Always detects as magical
- **Temperature extremes** - May affect certain items

---

> **🎯 AI Implementation Focus**: This overview provides the framework for implementing magic item systems in character sheets, inventory managers, and treasure generation tools.

**See Also**: [Item Creation](creation-rules.md) • [Activation Types](activation-mechanics.md) • [Treasure Generation](../../treasure/) • [Equipment](../../equipment/)
