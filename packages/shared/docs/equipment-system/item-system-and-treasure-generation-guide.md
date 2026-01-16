# Item System & DMG Treasure Generation Guide
_D&D 3.5e – Items, Templates, and Treasure Tables_

This document describes how to use the existing Prisma schema to model:

- Mundane and magical items
- Item properties and enhancement rules
- Item templates as reusable “recipes”
- Character-owned items
- DMG-style treasure tables
- Specific (named) magic items like *Rhino Hide* or *Demon Armor*

This system is designed to avoid combinatorial item explosion while remaining faithful to D&D 3.5e rules.

---

## 1. Conceptual Overview

The item system is built on **composition**, not inheritance.

| Concept | Schema Element | Purpose |
|------|---------------|---------|
| Base item | `Item` + `Weapon` / `Armor` | Defines mundane stats |
| Modifier | `ItemProperty` | Atomic rule effects |
| Recipe | `ItemTemplate` | Reusable modifier bundles |
| Owned item | `CharacterItem` | Concrete inventory entry |
| Static magic item | `Item` | Fully defined, fixed-cost item |

> **Templates describe how to build items.  
> CharacterItems represent items that exist.**

---

## 2. Base Items (`Item`, `Weapon`, `Armor`)

Base items represent **mundane equipment** exactly as listed in the PHB tables.

Examples:
- Longsword
- Hide Armor
- Chain Shirt
- Arrow
- Rations

Characteristics:
- Have fixed stats
- Have no magical properties
- Have a base cost and weight
- Are never owned directly by characters

---

## 3. Item Properties (`ItemProperty`)

Item properties are **atomic rule modifiers**.

Examples:
- Masterwork
- +1 Enhancement
- Flaming
- Bane
- Vorpal
- Cold Iron
- Alchemical Silver

### Property Types (Conceptual)

| Type | Purpose |
|----|--------|
| Material | Changes material composition |
| Enhancement | +1 to +5 enhancement bonus |
| SpecialAbility | Flaming, Vorpal, Bane |
| Structural | Masterwork, Barding |

### Cost Modeling

Properties may contribute to cost via:
- Flat cost modifiers (Masterwork)
- Multipliers (Barding)
- Enhancement bonus values
- Bonus-equivalent modifiers (Vorpal = +5)

Properties **do not store final prices** — pricing is computed at runtime.

---

## 4. Item Templates (`ItemTemplate`)

### What Templates Are

An `ItemTemplate` is a **named bundle of properties**.

Templates:
- Are never owned
- Are never directly equipped
- Are reusable
- Represent treasure outcomes, not items

Think of templates as **DMG table results**, not inventory objects.

---

### Template Examples

#### Generic Enhancement Template
```
Template: "+1 Weapon"
Properties:
- +1 Enhancement
```

#### Special Ability Template
```
Template: "Weapon Special Ability (Minor)"
Properties:
- (none — triggers reroll logic)
```

#### Composite Template
```
Template: "Flaming Weapon"
Properties:
- Flaming
```

---

## 5. Character Items (`CharacterItem`)

A `CharacterItem` is a **real, owned item**.

### Simple Items

Mundane items still use `CharacterItem`.

Example: 50 Arrows
- Base Item: Arrow
- No properties
- Quantity = 50

---

### Magic Items via Templates

To create a **Longsword +1**:

1. Select base item: Longsword
2. Select template: “+1 Weapon”
3. Create `CharacterItem`
4. Copy template properties into `CharacterItemProperty`

After creation:
- The item is independent
- Templates are not referenced again
- Stats and cost are derived dynamically

---

### Why Properties Are Copied

Templates act as **cookie cutters**.

- Changing a template does NOT alter existing items
- This prevents retroactive stat changes
- Matches how D&D items behave once created

---

## 6. DMG Treasure Tables (Procedural Loot)

DMG treasure tables are implemented as **layered decision trees**, not item lists.

### Example: Random Magic Weapon

#### Step 1: Roll Category
```
01–70 → Weapon
71–90 → Armor / Shield
91–100 → Potion
```

---

#### Step 2: Roll Enhancement Bonus
```
01–60 → +1 Weapon
61–90 → +2 Weapon
91–100 → +3 Weapon
```

Maps directly to `ItemTemplate` selection.

---

#### Step 3: Roll Weapon Group
```
01–50 → Simple
51–90 → Martial
91–100 → Exotic
```

Uses `Weapon.group`.

---

#### Step 4: Roll Specific Weapon
- Filter weapons by group
- Randomly select one (e.g., Longsword)

---

#### Step 5: Instantiate Item
- Create `CharacterItem`
- Apply selected templates
- Compute final stats and cost

---

## 7. Special Abilities & Rerolls

Some DMG results instruct:
> “Roll again for special ability”

This is modeled as:
- A template with **no properties**
- Application logic that triggers another roll
- The resulting template adds properties

This allows:
- Multiple special abilities
- Correct effective bonus calculations
- Full DMG table fidelity

---

## 8. Specific (Named) Magic Items

Examples:
- Rhino Hide
- Demon Armor
- Holy Avenger

### How These Are Modeled

Specific items are **real `Item` records**, not templates.

Characteristics:
- Fixed stats
- Fixed cost
- May violate normal pricing rules
- May include unique abilities

They **copy armor/weapon stats**, intentionally.

This duplication is correct and mirrors the DMG.

---

### Example: Rhino Hide

- New `Item`: “Rhino Hide”
- `Armor` stats copied from Hide Armor
- Cost set to DMG value
- `isSpecificItem = true`
- Properties:
  - +2 Enhancement
  - Rhino Charge Ability

Pricing logic is **skipped** for this item.

---

## 9. Treasure Tables Including Specific Items

Some DMG tables include entries like:
> “Roll on Table F or specific item”

This is handled by:
- Mixing template-based generation
- Directly awarding specific `Item`s

Example:
```
Roll result:
- 01–90 → Generate magic armor via templates
- 91–100 → Award Demon Armor
```

---

## 10. Design Principles

- No combinatorial explosion
- No fragile inheritance
- Clear separation of rules vs instances
- Faithful to RAW D&D 3.5e
- Easy to extend

---

## 11. Summary Cheat Sheet

| Goal | Use |
|----|----|
| Mundane gear | `Item` → `CharacterItem` |
| Magic bonuses | `ItemTemplate` |
| Weapon properties | `ItemProperty` |
| Generated loot | Templates + logic |
| Named magic items | Concrete `Item` |
| Inventory | `CharacterItem` |

---

## 12. Mental Model

> **Templates are recipes.  
> Properties are ingredients.  
> CharacterItems are meals.  
> Specific items are plated dishes.**
