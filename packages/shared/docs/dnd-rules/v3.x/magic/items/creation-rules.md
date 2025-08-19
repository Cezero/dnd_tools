# Magic Item Creation Rules

Creating magic items requires **specific feats**, **spellcasting ability**, and significant **time and resources**. These rules are essential for applications that handle crafting systems, economic balance, and character advancement.

## Prerequisites for Creation

### Required Feats
Each item type requires a specific **Item Creation feat**:
- **Brew Potion** - Create potions and oils
- **Craft Magic Arms and Armor** - Create magic weapons, armor, shields
- **Craft Rod** - Create rods
- **Craft Staff** - Create staffs
- **Craft Wand** - Create wands
- **Craft Wondrous Item** - Create wondrous items
- **Forge Ring** - Create magic rings
- **Scribe Scroll** - Create scrolls

### Spellcasting Requirements
- **Minimum caster level** - Must meet item's caster level requirement
- **Required spells** - Must know prerequisite spells (or have access)
- **Spell access alternatives** - Another caster, magic item, or spell completion item

### Alternative Prerequisites
- **Research alternative** - Increase DC by +5 for each missing prerequisite
- **Collaborative creation** - Multiple casters can provide different spells
- **Borrowed spells** - Access through magic items or other casters

## Cost Calculations

### Base Cost Formula
```
Magic Supplies Cost = Base Price × 0.5 (in gold)
Experience Cost = Base Price × 0.04 (in XP)
Creation Time = Base Price ÷ 1,000 days (minimum 1 day)
```

### Market Price Components
```
Market Price = Base Price + Item Cost + Component Costs
```

Where:
- **Base Price** - Core magical enhancement value
- **Item Cost** - Non-magical item cost (weapons, armor)
- **Component Costs** - Expensive material components (×1) + XP components (×5 gp)

### Creation Cost Examples
| Item Type | Base Price | Magic Supplies | XP Cost | Time |
|-----------|------------|----------------|---------|------|
| Potion of *cure light wounds* | 50 gp | 25 gp | 2 XP | 1 day |
| +1 longsword | 2,315 gp | 1,157.5 gp | 93 XP | 3 days |
| Wand of *magic missile* (CL 1) | 750 gp | 375 gp | 30 XP | 1 day |
| Ring of protection +1 | 2,000 gp | 1,000 gp | 80 XP | 2 days |

## Creation Process

### Workspace Requirements
- **Suitable environment** - Quiet, comfortable, well-lit
- **Same as spell preparation** - Same requirements as preparing spells
- **8 hours per day** - Cannot rush by working longer
- **Consecutive days not required** - Can interrupt and resume

### Resource Investment
- **Pay costs upfront** - Gold and XP spent at beginning
- **No refunds** - Starting new item wastes previous investment
- **One item at a time** - Cannot work on multiple items simultaneously

### Completion Mechanics
```pseudocode
class ItemCreation {
    function calculateCosts(basePrice, itemCost, componentCosts) {
        magicSupplies = basePrice * 0.5
        xpCost = basePrice * 0.04
        creationTime = Math.max(1, Math.floor(basePrice / 1000))
        
        return {
            gold: magicSupplies + componentCosts.material,
            xp: xpCost + componentCosts.xp,
            days: creationTime
        }
    }
    
    function canCreateItem(character, item) {
        return character.hasRequiredFeat(item.creationFeat) &&
               character.meetsSpellRequirements(item.prerequisites) &&
               character.casterLevel >= item.minimumCasterLevel
    }
}
```

## Special Cases

### Potions Exception
- **Always 1 day** - Regardless of base price
- **Spell level limits** - Cannot exceed 3rd level spells
- **Personal range only** - Must target "you" or touch

### Charged Items (Staffs and Wands)
- **Start with 50 charges** - Newly created items
- **Charge consumption** - Each use depletes charges
- **No recharging** - Cannot add charges once depleted

### Scrolls
- **Spell level limits** - Up to character's maximum castable level
- **Metamagic effects** - Can apply metamagic feats during creation
- **Multiple spells** - Can create scrolls with multiple spells

### Masterwork Requirements
- **Weapons and armor** - Must be masterwork before enchanting
- **Cost inclusion** - Masterwork cost included in final price
- **Quality baseline** - Enchantment enhances existing quality

## Economic Implementation

### For Shop Systems
```pseudocode
function generateShopInventory(townSize, wealthLevel) {
    maxBasePrice = getMaxItemPrice(townSize)
    availableItems = []
    
    for (category in itemCategories) {
        probability = getCategoryProbability(category, townSize)
        if (random() < probability) {
            item = generateRandomItem(category, maxBasePrice)
            availableItems.push(item)
        }
    }
    
    return availableItems
}
```

### For Character Crafting
```pseudocode
function startItemCreation(character, itemTemplate) {
    costs = calculateCosts(itemTemplate)
    
    if (!character.canAfford(costs)) {
        return "Insufficient resources"
    }
    
    character.spendResources(costs.gold, costs.xp)
    character.startProject(itemTemplate, costs.days)
    
    return "Creation started"
}
```

### Balance Considerations
- **XP cost** - Significant character advancement penalty
- **Time investment** - Opportunity cost of creation time
- **Gold sink** - Major expense for character economy
- **Feat investment** - Limited feat slots for creation abilities

## Integration with Campaign Systems

### Downtime Activities
- **Requires settlement** - Appropriate facilities and materials
- **Uninterrupted time** - Safe environment for creation
- **Multiple creators** - Collaborative projects possible

### Adventure Integration
- **Portable workshops** - Some items can be created while traveling
- **Component gathering** - Adventures to find rare materials
- **Research opportunities** - Learning new item creation techniques

---

> **🎯 AI Implementation**: Essential for crafting systems, economic balance, and character progression tracking in D&D applications.

**See Also**: [Magic Items Overview](overview.md) • [Item Pricing](../economics/) • [Character Advancement](../../character/advancement/) • [Downtime Activities](../../exploration/downtime/)
