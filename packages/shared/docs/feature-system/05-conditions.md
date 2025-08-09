# 05 — Conditions (FeatureModifierCondition) & runtime tokens

`FeatureModifierCondition` is how we express **when** a modifier should apply. This is runtime data — the engine/UI must provide the runtime context (tokens and properties) to evaluate conditions.

## Structure
```prisma
model FeatureModifierCondition {
  id                 Int
  featureModifierId  Int
  conditionType      Int    // FeatureModifierConditionType
  conditionValue     String?
}
```

## Condition types (semantics)
- `trigger` (0): `conditionValue` is an arbitrary effect token like `"inspire_greatness_active"`, `"rage_active"`, `"bardic_music_active"`. Passes when that token exists on the target or actor.
- `attack_type` (1): `conditionValue` is an attack tag such as `"sneak_attack"`, `"unarmed"`, `"melee"`, `"ranged"`. Evaluate against the attack description for the roll.
- `other` (2): Free-form; engine interprets token.

## Rule
A modifier applies only if **all** its conditions evaluate true. If a modifier has zero conditions, it is considered always-active (subject to `appliesIfChoice` filters).

## Implementation guidance
- Maintain a centralized set of tokens and tags (see `09-appendix-tokens.md`) so engine and UI match strings exactly.
- For effect-based tokens (trigger), the effect activation (e.g., Bard uses Inspire Greatness) must cause code to set a token on affected targets for the duration.
