-- Retag companion-beneficiary features to EntityType.Companion (7).
-- Unique animal-companion Evasion (do not reuse Monk slug `evasion`).
-- Link skill bonuses + regarding-companion condition. Alertness feat grant.
-- Idempotent. PHB edition 5. Run after @shared/schema rebuild.

-- Monk evasion (17871) must not unlock for Druid/Ranger.
DELETE fcm
FROM FeatureClassMap fcm
JOIN Feature f ON f.id = fcm.featureId
WHERE f.slug = 'evasion'
  AND fcm.classId IN (20, 24);

INSERT INTO Feature (slug, name, description, summary, displayInCharacterSheet, sourceType, level, domainId, featId, companionId, editionId)
SELECT
    'animal-companion-evasion',
    'Evasion',
    'If an animal companion is subjected to an attack that normally allows a Reflex saving throw for half damage, it takes no damage if it makes a successful saving throw.',
    'No damage on a successful Reflex save for half.',
    0, 1, 3, NULL, NULL, NULL, 5
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Feature WHERE slug = 'animal-companion-evasion');

INSERT IGNORE INTO FeatureClassMap (featureId, classId, levelDivisor)
SELECT f.id, 20, 1 FROM Feature f WHERE f.slug = 'animal-companion-evasion'
UNION ALL
SELECT f.id, 24, 2 FROM Feature f WHERE f.slug = 'animal-companion-evasion';

-- Chassis: beneficiary is the companion creature.
UPDATE FeatureEntity fe
JOIN Feature f ON f.id = fe.featureId
SET fe.type = 7
WHERE f.slug IN ('animal-companion-progression', 'familiar-progression');

-- Creature specials (not master-facing table text).
UPDATE FeatureEntity fe
JOIN Feature f ON f.id = fe.featureId
SET fe.type = 7,
    fe.displayInDetail = 1
WHERE f.slug IN (
    'animal-companion-evasion',
    'devotion',
    'multiattack',
    'improved-evasion',
    'familiar-improved-evasion',
    'familiar-deliver-touch-spells',
    'familiar-speak-with-master',
    'familiar-speak-with-animals',
    'familiar-spell-resistance'
);

-- Named creature specials: Type=Companion, AppliesTo=Other (13).
INSERT INTO FeatureEntity (featureId, appliesTo, appliesToId, appliesToSubId, formulaParamsId, groupingId, type, value, bonusType, displayInDetail, showFullProgression)
SELECT f.id, 13, NULL, NULL, NULL, 0, 7, NULL, NULL, 1, 0
FROM Feature f
WHERE f.slug IN (
    'animal-companion-evasion',
    'improved-evasion',
    'familiar-improved-evasion',
    'familiar-deliver-touch-spells',
    'familiar-speak-with-master',
    'familiar-speak-with-animals'
)
  AND NOT EXISTS (
      SELECT 1 FROM FeatureEntity fe
      WHERE fe.featureId = f.id AND fe.type = 7 AND fe.appliesTo = 13
  );

-- Devotion: +4 morale Will vs enchantment (SavingThrow=2, Will=2, Morale=3, spell_school=5, Enchantment=4).
INSERT INTO FeatureEntity (featureId, appliesTo, appliesToId, appliesToSubId, formulaParamsId, groupingId, type, value, bonusType, displayInDetail, showFullProgression)
SELECT f.id, 2, 2, NULL, NULL, 0, 7, 4, 3, 1, 0
FROM Feature f
WHERE f.slug = 'devotion'
  AND NOT EXISTS (
      SELECT 1 FROM FeatureEntity fe
      WHERE fe.featureId = f.id AND fe.appliesTo = 2 AND fe.appliesToId = 2
  );

INSERT INTO FeatureEntityCondition (featureEntityId, conditionType, conditionValue)
SELECT fe.id, 5, 4
FROM FeatureEntity fe
JOIN Feature f ON f.id = fe.featureId
WHERE f.slug = 'devotion'
  AND fe.appliesTo = 2
  AND fe.appliesToId = 2
  AND NOT EXISTS (
      SELECT 1 FROM FeatureEntityCondition c
      WHERE c.featureEntityId = fe.id AND c.conditionType = 5 AND c.conditionValue = 4
  );

-- Familiar SR: master level + 5 (VALUE_PLUS_LEVEL=10). Chassis display hidden; Other entity lists the special.
INSERT INTO FeatureFormulaParams (formulaId, `interval`, formulaStartLevel, thresholds, `values`, includeProgressionLevel, featureLevelZero, valuesRepresent, cumulative)
SELECT 10, NULL, NULL, NULL, NULL, 1, 0, NULL, 0
FROM Feature f
WHERE f.slug = 'familiar-spell-resistance'
  AND NOT EXISTS (
      SELECT 1 FROM FeatureEntity fe
      WHERE fe.featureId = f.id AND fe.appliesTo = 19
  );
SET @sr_fp := IF(ROW_COUNT() > 0, LAST_INSERT_ID(), 0);

INSERT INTO FeatureEntity (featureId, appliesTo, appliesToId, appliesToSubId, formulaParamsId, groupingId, type, value, bonusType, displayInDetail, showFullProgression)
SELECT f.id, 19, NULL, NULL, @sr_fp, 0, 7, 5, NULL, 0, 0
FROM Feature f
WHERE f.slug = 'familiar-spell-resistance' AND @sr_fp > 0;

INSERT INTO FeatureEntity (featureId, appliesTo, appliesToId, appliesToSubId, formulaParamsId, groupingId, type, value, bonusType, displayInDetail, showFullProgression)
SELECT f.id, 13, NULL, NULL, NULL, 0, 7, NULL, NULL, 1, 0
FROM Feature f
WHERE f.slug = 'familiar-spell-resistance'
  AND NOT EXISTS (
      SELECT 1 FROM FeatureEntity fe
      WHERE fe.featureId = f.id AND fe.type = 7 AND fe.appliesTo = 13
  );

-- Master-facing: Link, Share Spells, Empathic Link, Scry on the character sheet.
UPDATE Feature
SET displayInCharacterSheet = 1
WHERE slug IN (
    'animal-companion-link',
    'share-spells',
    'familiar-share-spells',
    'familiar-empathic-link',
    'familiar-scry'
);

INSERT INTO FeatureEntity (featureId, appliesTo, appliesToId, appliesToSubId, formulaParamsId, groupingId, type, value, bonusType, displayInDetail, showFullProgression)
SELECT f.id, 13, NULL, NULL, NULL, 0, 3, NULL, NULL, 1, 0
FROM Feature f
WHERE f.slug IN (
    'animal-companion-link',
    'share-spells',
    'familiar-share-spells',
    'familiar-empathic-link',
    'familiar-scry'
)
  AND NOT EXISTS (
      SELECT 1 FROM FeatureEntity fe
      WHERE fe.featureId = f.id AND fe.type = 3 AND fe.appliesTo = 13
  );

-- Link: +4 circumstance Handle Animal (14) and Wild Empathy (48), regarding companion (special=9, value=1).
INSERT INTO FeatureEntity (featureId, appliesTo, appliesToId, appliesToSubId, formulaParamsId, groupingId, type, value, bonusType, displayInDetail, showFullProgression)
SELECT f.id, 1, v.skillId, NULL, NULL, 0, 0, 4, 1, 1, 0
FROM Feature f
JOIN (
    SELECT 14 AS skillId
    UNION ALL SELECT 48
) AS v
WHERE f.slug = 'animal-companion-link'
  AND NOT EXISTS (
      SELECT 1 FROM FeatureEntity fe
      WHERE fe.featureId = f.id AND fe.appliesTo = 1 AND fe.appliesToId = v.skillId
  );

INSERT INTO FeatureEntityCondition (featureEntityId, conditionType, conditionValue)
SELECT fe.id, 9, 1
FROM FeatureEntity fe
JOIN Feature f ON f.id = fe.featureId
WHERE f.slug = 'animal-companion-link'
  AND fe.appliesTo = 1
  AND fe.appliesToId IN (14, 48)
  AND NOT EXISTS (
      SELECT 1 FROM FeatureEntityCondition c
      WHERE c.featureEntityId = fe.id AND c.conditionType = 9 AND c.conditionValue = 1
  );

-- Alertness: live feat grant (feat 3). Sheet assumes familiar is in reach. Feature stays off the Features list.
UPDATE Feature
SET displayInCharacterSheet = 0,
    summary = 'familiar within reach'
WHERE slug = 'familiar-alertness';

INSERT INTO FeatureEntity (featureId, appliesTo, appliesToId, appliesToSubId, formulaParamsId, groupingId, type, value, bonusType, displayInDetail, showFullProgression)
SELECT f.id, 21, 3, NULL, NULL, 0, 3, NULL, NULL, 1, 0
FROM Feature f
WHERE f.slug = 'familiar-alertness'
  AND NOT EXISTS (
      SELECT 1 FROM FeatureEntity fe
      WHERE fe.featureId = f.id AND fe.appliesTo = 21 AND fe.appliesToId = 3
  );
