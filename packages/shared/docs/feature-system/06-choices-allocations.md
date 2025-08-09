# 06 — FeatureChoice & Allocation behavior

`FeatureChoice` represents options a player can pick when a `FeatureProgression` is granted.

## Model recap
```prisma
model FeatureChoice {
  id              Int
  progressionId   Int
  label           String?
  pickCount       Int?
  choiceType      ChoiceType
  choiceBehavior  ChoiceBehavior
  featId          Int?
  chosenFeatureId Int?
}
```

## ChoiceType
- `Feat` — the choice is a feat (persist featId or selected featId)
- `Feature` — the choice is another `Feature` (chosenFeatureId)

## ChoiceBehavior
- `Single` — pick one
- `Multiple` — pick up to `pickCount`
- `Allocation` — allocate a pool of points/bonuses among targets

## CharacterFeatureChoice (consumer)
- The player's selections are stored in `CharacterFeatureChoice` rows (link to `advancementId`, `progressionId`, `choiceId`).
- For `Allocation` behavior, each allocation is a separate `CharacterFeatureChoice` row containing `value` = target id (e.g., favoredEnemyId) and optionally quantity.

## UI considerations
- Present pickers based on `FeatureProgression.appliesToType` + `appliesTo` filters.
- For `Allocation`, provide an intuitive UI to assign a finite number of points to selected targets and persist each assignment as a row.
