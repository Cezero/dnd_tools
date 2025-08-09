# 01 — Overview

This document explains how to represent rules-driven, level-scaled, and conditional class/race/template features using the `Feature*` schema and enums defined in `FeatureData.ts`.

## Design assumptions

- **Feature**: canonical description (slug, name, description).
- **FeatureProgression**: a grant of a `Feature` by a source (class, race, template) **at a particular level**.
- **FeatureModifier**: a typed, validated change or resource provided by a progression (bonus, dice, uses, movement, etc).
- **FeatureModifierCondition**: runtime contextual conditions (when a modifier applies).
- **FeatureChoice**: selectable options offered by a progression (feat pick, favored enemy, fighting style).
- **FeaturePrerequisite**: gating criteria such as skill ranks.
- **FeatureSpecialEffect**: non-modifier metadata (proficiencies, favored enemy metadata, etc).

## Progression overwrite rule

For a given class and `Feature`, the *active* `FeatureProgression` is the row with the **largest `level` ≤ current class level**. This makes progressions act like versioned milestones: a later progression overwrites earlier values.

## Intended usage

- Model class features (scaling or static).
- Model race traits (usually level 1 progressions).
- Expose choices to players (FeatureChoice → CharacterFeatureChoice).
- Represent runtime modifiers conditionally (FeatureModifier + FeatureModifierCondition).
- Avoid JSON blobs — keep fields typed & relational (enum codes and ids).
