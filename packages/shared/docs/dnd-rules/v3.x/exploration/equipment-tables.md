# Equipment Tables

This section provides reference tables for equipment hardness, hit points, and other mechanical properties used in object destruction and equipment durability.

## Common Armor, Weapon, and Shield Properties

| **Weapon or Shield** | **Hardness** | **HP¹** |
|---------------------|--------------|---------|
| **Light blade** | 10 | 2 |
| **One-handed blade** | 10 | 5 |
| **Two-handed blade** | 10 | 10 |
| **Light metal-hafted weapon** | 10 | 10 |
| **One-handed metal-hafted weapon** | 10 | 20 |
| **Light hafted weapon** | 5 | 2 |
| **One-handed hafted weapon** | 5 | 5 |
| **Two-handed hafted weapon** | 5 | 10 |
| **Projectile weapon** | 5 | 5 |
| **Armor** | special² | armor bonus ×5 |
| **Buckler** | 10 | 5 |
| **Light wooden shield** | 5 | 7 |
| **Heavy wooden shield** | 5 | 15 |
| **Light steel shield** | 10 | 10 |
| **Heavy steel shield** | 10 | 20 |
| **Tower shield** | 5 | 20 |

**Notes:**
1. **HP values**: Given for Medium armor, weapons, and shields
   - **Divide by 2** for each size category smaller than Medium
   - **Multiply by 2** for each size category larger than Medium
2. **Armor hardness**: Varies by material (see Substance Hardness table below)

## Substance Hardness and Hit Points

| **Substance** | **Hardness** | **Hit Points** |
|---------------|--------------|----------------|
| **Paper or cloth** | 0 | 2/inch of thickness |
| **Rope** | 0 | 2/inch of thickness |
| **Glass** | 1 | 1/inch of thickness |
| **Ice** | 0 | 3/inch of thickness |
| **Leather or hide** | 2 | 5/inch of thickness |
| **Wood** | 5 | 10/inch of thickness |
| **Stone** | 8 | 15/inch of thickness |
| **Iron or steel** | 10 | 30/inch of thickness |
| **Mithral** | 15 | 30/inch of thickness |
| **Adamantine** | 20 | 40/inch of thickness |

## Size and Armor Class of Objects

| **Size** | **AC Modifier** |
|----------|-----------------|
| **Colossal** | -8 |
| **Gargantuan** | -4 |
| **Huge** | -2 |
| **Large** | -1 |
| **Medium** | +0 |
| **Small** | +1 |
| **Tiny** | +2 |
| **Diminutive** | +4 |
| **Fine** | +8 |

## Common Object Properties

| **Object** | **Hardness** | **Hit Points** | **Break DC** |
|------------|--------------|----------------|--------------|
| **Rope (1 inch diam.)** | 0 | 2 | 23 |
| **Simple wooden door** | 5 | 10 | 13 |
| **Small chest** | 5 | 1 | 17 |
| **Good wooden door** | 5 | 15 | 18 |
| **Treasure chest** | 5 | 15 | 23 |
| **Strong wooden door** | 5 | 20 | 23 |
| **Masonry wall (1 ft. thick)** | 8 | 90 | 35 |
| **Hewn stone (3 ft. thick)** | 8 | 540 | 50 |
| **Chain** | 10 | 5 | 26 |
| **Manacles** | 10 | 10 | 26 |
| **Masterwork manacles** | 10 | 10 | 28 |
| **Iron door (2 in. thick)** | 10 | 60 | 28 |

## Breaking and Bursting DCs

| **Strength Check to:** | **DC** |
|------------------------|--------|
| **Break down simple door** | 13 |
| **Break down good door** | 18 |
| **Break down strong door** | 23 |
| **Burst rope bonds** | 23 |
| **Bend iron bars** | 24 |
| **Break down barred door** | 25 |
| **Burst chain bonds** | 26 |
| **Break down iron door** | 28 |

### Magical Condition Modifiers¹

| **Condition** | **DC Adjustment** |
|---------------|-------------------|
| **Hold portal** | +5 |
| **Arcane lock** | +10 |

**Note:**
1. **If both conditions apply**, use the larger number

## Using These Tables

### Determining Object AC
**Base AC**: 10 + size modifier + Dex modifier
- **Inanimate objects**: Dex 0 (-5) + additional -2 penalty = **AC modifier -7**
- **Final AC**: 10 + size modifier - 7

### Calculating Damage
1. **Roll attack** against object's AC
2. **Roll damage** normally
3. **Apply energy/ranged modifiers** if applicable:
   - **Fire/Electricity**: Half damage before hardness
   - **Cold**: Quarter damage before hardness
   - **Ranged weapons**: Half damage before hardness
4. **Subtract hardness** from adjusted damage
5. **Deduct remaining damage** from object's HP

### Breaking vs. Smashing
- **Smashing**: Use attack rolls and damage (good for combat)
- **Breaking**: Use Strength checks (good for forced entry)
- **Choose method** based on situation and character abilities

### Size Scaling
- **Weapons/Armor**: Scale HP by size category
- **Objects**: Use thickness measurements for custom objects
- **Breaking DCs**: Apply size modifiers to Strength checks

---

> **📖 Related Sections**: [Object Destruction](object-destruction.md), [Equipment](../equipment/), [Combat - Sunder](../combat/attacks/special-attacks/), [Special Materials](../equipment/special-materials.md)
