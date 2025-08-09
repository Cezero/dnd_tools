# Combat Statistics

This section summarizes the statistics that determine success in combat, and then details how to use them.

## Attack Roll

An **attack roll** represents your attempt to strike your opponent on your turn in a round. When you make an attack roll, you roll a d20 and add your attack bonus. (Other modifiers may also apply to this roll.) If your result equals or beats the target's Armor Class, you hit and deal damage.

### Attack Roll Formula

```
Attack Roll = 1d20 + Attack Bonus + Other Modifiers
```

### Automatic Misses and Hits

- A **natural 1** (the d20 comes up 1) on an attack roll is **always a miss**
- A **natural 20** (the d20 comes up 20) is **always a hit**
- A natural 20 is also a **threat**—a possible critical hit

## Size Modifiers

| Size | Size Modifier |
|------|---------------|
| Colossal | -8 |
| Gargantuan | -4 |
| Huge | -2 |
| Large | -1 |
| Medium | +0 |
| Small | +1 |
| Tiny | +2 |
| Diminutive | +4 |
| Fine | +8 |
## Attack Bonus

### Melee Attack Bonus

```
Melee Attack Bonus = Base Attack Bonus + Strength Modifier + Size Modifier
```

### Ranged Attack Bonus

```
Ranged Attack Bonus = Base Attack Bonus + Dexterity Modifier + Size Modifier + Range Penalty
```

### Base Attack Bonus

A **base attack bonus** is an attack roll bonus derived from character class and level or creature type and Hit Dice (or combinations thereof). Base attack bonuses increase at different rates for different character classes and creature types.

**Multiple Attacks:**
- A **second attack** is gained when a base attack bonus reaches **+6**
- A **third attack** with a base attack bonus of **+11** or higher
- A **fourth attack** with a base attack bonus of **+16** or higher

> **Important**: Base attack bonuses gained from different sources, such as when a character is a multiclass character, **stack**.

## Damage

When your attack succeeds, you deal damage. The type of weapon used determines the amount of damage you deal. Effects that modify weapon damage apply to unarmed strikes and the natural physical attack forms of creatures.

**Damage reduces a target's current hit points.**

### Minimum Damage

If penalties reduce the damage result to less than 1, a hit still deals **1 point of damage**.

### Strength Bonus

- When you hit with a **melee or thrown weapon**, including a sling, add your **Strength modifier** to the damage result
- A **Strength penalty**, but not a bonus, applies on attacks made with a bow that is not a composite bow

### Off-Hand Weapon

When you deal damage with a weapon in your **off hand**, you add only **½ your Strength bonus**.

### Wielding a Weapon Two-Handed

When you deal damage with a weapon that you are wielding **two-handed**, you add **1½ times your Strength bonus**. However, you don't get this higher Strength bonus when using a **light weapon** with two hands.

### Multiplying Damage

Sometimes you multiply damage by some factor, such as on a critical hit. Roll the damage (with all modifiers) multiple times and total the results. 

> **Note**: When you multiply damage more than once, each multiplier works off the **original, unmultiplied damage**.

**Exception**: Extra damage dice over and above a weapon's normal damage are **never multiplied**.

### Ability Damage

Certain creatures and magical effects can cause **temporary ability damage** (a reduction to an ability score).

## Armor Class

Your **Armor Class (AC)** represents how hard it is for opponents to land a solid, damaging blow on you. It's the attack roll result that an opponent needs to achieve to hit you.

### AC Formula

```
AC = 10 + Armor Bonus + Shield Bonus + Dexterity Modifier + Size Modifier
```

> **Note**: Armor limits your Dexterity bonus, so if you're wearing armor, you might not be able to apply your whole Dexterity bonus to your AC.

### When You Can't Use Dexterity Bonus

Sometimes you can't use your Dexterity bonus (if you have one). If you **can't react to a blow**, you can't use your Dexterity bonus to AC. (If you don't have a Dexterity bonus, nothing happens.)

### Other AC Modifiers

Many other factors modify your AC:

#### Enhancement Bonuses
Enhancement effects make your armor better.

#### Deflection Bonus
Magical deflection effects ward off attacks and improve your AC.

#### Natural Armor
Natural armor improves your AC.

#### Dodge Bonuses
Some other AC bonuses represent actively avoiding blows. These bonuses are called **dodge bonuses**. Any situation that denies you your Dexterity bonus also denies you dodge bonuses. (Wearing armor, however, does not limit these bonuses the way it limits a Dexterity bonus to AC.) 

> **Important**: Unlike most sorts of bonuses, **dodge bonuses stack** with each other.

### Touch Attacks

Some attacks disregard armor, including shields and natural armor. In these cases, the attacker makes a **touch attack roll** (either ranged or melee). When you are the target of a touch attack, your AC **doesn't include**:
- **Armor bonus**
- **Shield bonus** 
- **Natural armor bonus**

All other modifiers, such as your size modifier, Dexterity modifier, and deflection bonus (if any) apply normally.

## Hit Points

Your hit point status determines your combat condition:
- **0 hit points**: You're **disabled**
- **-1 hit points**: You're **dying**  
- **-10 hit points**: You're **dead**

## Speed

Your **speed** tells you how far you can move in a round and still do something, such as attack or cast a spell. Your speed depends mostly on your race and what armor you're wearing.

### Speed by Race

| Race | No/Light Armor | Medium/Heavy Armor |
|------|----------------|--------------------|
| Dwarves | 20 ft (4 squares) | 20 ft (4 squares) |
| Gnomes, Halflings | 20 ft (4 squares) | 15 ft (3 squares) |
| Humans, Elves, Half-elves, Half-orcs | 30 ft (6 squares) | 20 ft (4 squares) |

### Movement Options

- **Single move action**: Move up to your speed
- **Double move** (two move actions): Move up to **double your speed**
- **Run** (full-round action): Move up to **quadruple your speed** (or triple if you are in heavy armor)

## Saving Throws

Generally, when you are subject to an unusual or magical attack, you get a **saving throw** to avoid or reduce the effect. Like an attack roll, a saving throw is a d20 roll plus a bonus based on your class, level, and an ability score.

### Saving Throw Formula

```
Saving Throw = 1d20 + Base Save Bonus + Ability Modifier
```

### Base Save Bonus

A saving throw modifier derived from **character class and level**. Base save bonuses increase at different rates for different character classes. Base save bonuses gained from different classes, such as when a character is a multiclass character, **stack**.

### Saving Throw Types

The three different kinds of saving throws are **Fortitude**, **Reflex**, and **Will**:

#### Fortitude
These saves measure your ability to stand up to **physical punishment** or attacks against your vitality and health. Apply your **Constitution modifier** to your Fortitude saving throws.

#### Reflex
These saves test your ability to **dodge area attacks**. Apply your **Dexterity modifier** to your Reflex saving throws.

#### Will
These saves reflect your resistance to **mental influence** as well as many magical effects. Apply your **Wisdom modifier** to your Will saving throws.

### Saving Throw Difficulty Class

The **DC for a save** is determined by the attack itself.

### Automatic Failures and Successes

- A **natural 1** (the d20 comes up 1) on a saving throw is **always a failure** (and may cause damage to exposed items; see Items Surviving after a Saving Throw)
- A **natural 20** (the d20 comes up 20) is **always a success**

