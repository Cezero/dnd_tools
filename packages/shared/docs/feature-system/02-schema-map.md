# 02 — Schema Map (Prisma models)

Below are the key models and their important fields. Use this as a quick reference.

## Feature
```prisma
model Feature {
  id          Int @id @default(autoincrement())
  slug        String @unique
  name        String
  description String @db.Text

  progressions  FeatureProgression[]
  featureChoice FeatureChoice[]
}
```
- Canonical text & identity for a named feature.

## FeatureProgression
```prisma
model FeatureProgression {
  id            Int @id @default(autoincrement())
  sourceType    Int
  level         Int
  featureId     Int
  appliesToType Int?
  appliesTo     Int?
  classId       Int?
  raceId        Int?
  // relations...
  feature      Feature         @relation(fields: [featureId], references: [id])
  choices      FeatureChoice[]
  spellcasting SpellcastingLink?
  effects      FeatureSpecialEffect[]
  modifiers    FeatureModifier[]
  characterFeatureChoice  CharacterFeatureChoice[]
  prerequisites FeaturePrerequisite[]
}
```
- `sourceType` uses `FeatureSourceType` enum (Race/Class/Template).
- `appliesToType` + `appliesTo` may be used to scope choice filtering (e.g., feat filters).

## FeatureModifier
```prisma
model FeatureModifier {
  id                    Int     @id @default(autoincrement())
  featureProgressionId  Int
  type                  Int
  value                 Int
  bonusType             Int?
  appliesTo             Int?
  appliesToId           Int?
  appliesIfChoiceKey    String?
  appliesIfChoiceValue  String?

  featureProgression FeatureProgression @relation(fields: [featureProgressionId], references: [id])
  conditions         FeatureModifierCondition[]
}
```
- `type` = `ModifierType` (Bonus, Quantity, Uses, Targets, Distance, Other).
- `appliesTo` = `ModifierAppliesToType` (Attribute, Skill, SavingThrow, AC, MovementSpeed, HitDice, Attack, Damage, Initiative, Other).
- `appliesToId` = id of target (skillId, abilityId, diceId, itemId, languageId).
- `appliesIfChoiceKey`/`appliesIfChoiceValue` = tie to a player choice (CharacterFeatureChoice).

## FeatureModifierCondition
```prisma
model FeatureModifierCondition {
  id                    Int @id @default(autoincrement())
  featureModifierId     Int
  conditionType         Int
  conditionValue        String?

  featureModifier FeatureModifier @relation(fields: [featureModifierId], references: [id])
}
```
- `conditionType` uses `FeatureModifierConditionType` — runtime matching (trigger, attack_type, other).
- `conditionValue` is a string token matched by the engine or UI.

## FeatureChoice
```prisma
model FeatureChoice {
  id              Int @id @default(autoincrement())
  progressionId   Int
  label           String?
  pickCount       Int?
  choiceType      ChoiceType
  choiceBehavior  ChoiceBehavior
  featId          Int?
  chosenFeatureId Int?

  featureProgression     FeatureProgression @relation(fields: [progressionId], references: [id])
  feat                   Feat?              @relation(fields: [featId], references: [id])
  feature                Feature?           @relation(fields: [chosenFeatureId], references: [id])
  characterFeatureChoice CharacterFeatureChoice[]
}
```
- `choiceType` = Feat or Feature.
- `choiceBehavior` = Single / Multiple / Allocation.

## FeaturePrerequisite
```prisma
model FeaturePrerequisite {
  id                    Int @id @default(autoincrement())
  featureProgressionId  Int
  type                  Int
  skillId               Int?
  minValue              Int
}
```
- Common use: `SkillRanks` gating (skillId + minValue).

## FeatureSpecialEffect
- Use for non-modifier data like proficiencies, favored enemy metadata, or other structured meta-values.
