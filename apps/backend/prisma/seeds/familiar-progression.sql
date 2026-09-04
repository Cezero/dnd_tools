-- Shared familiar progression features. Idempotent. PHB (SourceBook 1), edition 5 (3.5e).
-- Maps onto every class that already has a summonfamiliar* choice feature.

INSERT INTO Feature (slug, name, description, summary, displayInCharacterSheet, sourceType, level, domainId, featId, companionId, editionId)
SELECT
    'familiar-progression',
    'Familiar Progression',
    'Natural armor and Intelligence granted to a familiar. Evaluated once at stacked effective familiar level (Wizard, Sorcerer, and other familiar-granting classes).',
    'Familiar NA and Intelligence.',
    0, 1, 1, NULL, NULL, NULL, 5
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Feature WHERE slug = 'familiar-progression');

INSERT IGNORE INTO FeatureClassMap (featureId, classId, levelDivisor)
SELECT f.id, src.classId, src.levelDivisor
FROM Feature f
JOIN FeatureClassMap src
  ON src.featureId IN (SELECT id FROM Feature WHERE slug LIKE 'summonfamiliar%')
WHERE f.slug = 'familiar-progression';

SET @na_fp := 0;
SET @int_fp := 0;

INSERT INTO FeatureFormulaParams (formulaId, `interval`, formulaStartLevel, thresholds, `values`, includeProgressionLevel, featureLevelZero, valuesRepresent, cumulative)
SELECT 3, NULL, NULL, '1,3,5,7,9,11,13,15,17,19', '1,2,3,4,5,6,7,8,9,10', 1, 0, NULL, 0
FROM DUAL
WHERE EXISTS (SELECT 1 FROM Feature WHERE slug = 'familiar-progression')
  AND NOT EXISTS (
      SELECT 1 FROM FeatureEntity fe
      JOIN Feature f ON f.id = fe.featureId
      WHERE f.slug = 'familiar-progression'
  );
SET @na_fp := IF(ROW_COUNT() > 0, LAST_INSERT_ID(), 0);

INSERT INTO FeatureFormulaParams (formulaId, `interval`, formulaStartLevel, thresholds, `values`, includeProgressionLevel, featureLevelZero, valuesRepresent, cumulative)
SELECT 3, NULL, NULL, '1,3,5,7,9,11,13,15,17,19', '6,7,8,9,10,11,12,13,14,15', 1, 0, NULL, 0
FROM DUAL WHERE @na_fp > 0;
SET @int_fp := IF(@na_fp > 0 AND ROW_COUNT() > 0, LAST_INSERT_ID(), 0);

-- Natural armor (appliesTo AC=3, bonusType NaturalArmor=10)
INSERT INTO FeatureEntity (featureId, appliesTo, appliesToId, appliesToSubId, formulaParamsId, groupingId, type, value, bonusType, displayInDetail, showFullProgression)
SELECT f.id, 3, NULL, NULL, @na_fp, 0, 7, 0, 10, 0, 0
FROM Feature f WHERE f.slug = 'familiar-progression' AND @na_fp > 0;

-- Intelligence replacement (appliesTo Ability=0, appliesToId INT=4)
INSERT INTO FeatureEntity (featureId, appliesTo, appliesToId, appliesToSubId, formulaParamsId, groupingId, type, value, bonusType, displayInDetail, showFullProgression)
SELECT f.id, 0, 4, NULL, @int_fp, 0, 7, 0, NULL, 0, 0
FROM Feature f WHERE f.slug = 'familiar-progression' AND @int_fp > 0;

INSERT INTO Feature (slug, name, description, summary, displayInCharacterSheet, sourceType, level, domainId, featId, companionId, editionId)
SELECT v.slug, v.name, v.description, v.summary, 0, 1, v.level, NULL, NULL, NULL, 5
FROM (
    SELECT 'familiar-alertness' AS slug, 'Alertness' AS name, 1 AS level,
        'The master of a familiar gains the Alertness feat whenever the familiar is within arm''s reach.' AS description,
        'familiar within reach' AS summary
    UNION ALL SELECT 'familiar-improved-evasion', 'Improved Evasion', 1,
        'When subjected to an attack that normally allows a Reflex saving throw for half damage, a familiar takes no damage if it makes a successful saving throw and only half damage if the saving throw fails.',
        'No damage on a successful Reflex save; half on a failure.'
    UNION ALL SELECT 'familiar-share-spells', 'Share Spells', 1,
        'At the master''s option, he may have any spell (but not any spell-like ability) he casts on himself also affect his familiar. The familiar must be within 5 feet at the time of casting to receive the benefit. If the spell or effect has a duration other than instantaneous, it stops affecting the familiar if the familiar moves farther than 5 feet away and will not affect the familiar again even if it returns before the duration expires. Additionally, the master may cast a spell with a target of "You" on his familiar (as a touch range spell) instead of on himself. A master and his familiar can share spells even if the spells normally do not affect creatures of the familiar''s type (magical beast).',
        'Share spells with familiar within 5 feet.'
    UNION ALL SELECT 'familiar-empathic-link', 'Empathic Link', 1,
        'The master has an empathic link with his familiar out to a distance of up to 1 mile. The master cannot see through the familiar''s eyes, but they can communicate empathically. Because of the limited nature of the link, only general emotional content can be communicated. Because of this empathic link, the master has the same connection to an item or place that his familiar does.',
        'Empathic link out to 1 mile.'
    UNION ALL SELECT 'familiar-deliver-touch-spells', 'Deliver Touch Spells', 3,
        'If the master is 3rd level or higher, a familiar can deliver touch spells for him. If the master and the familiar are in contact at the time the master casts a touch spell, he can designate his familiar as the "toucher." The familiar can then deliver the touch spell just as the master could. As usual, if the master casts another spell before the touch is delivered, the touch spell dissipates.',
        'Familiar can deliver the master''s touch spells.'
    UNION ALL SELECT 'familiar-speak-with-master', 'Speak with Master', 5,
        'If the master is 5th level or higher, a familiar and the master can communicate verbally as if they were using a common language. Other creatures do not understand the communication without magical help.',
        'Familiar and master can speak to each other.'
    UNION ALL SELECT 'familiar-speak-with-animals', 'Speak with Animals of Its Kind', 7,
        'If the master is 7th level or higher, a familiar can communicate with animals of approximately the same type as itself (including dire varieties): bats with bats, rats with rodents, cats with felines, hawks and owls with birds, weasels with similar creatures, toads with amphibians, and snakes with reptiles. Such communication is limited by the intelligence of the conversing creatures.',
        'Familiar can speak with similar animals.'
    UNION ALL SELECT 'familiar-spell-resistance', 'Spell Resistance', 11,
        'If the master is 11th level or higher, a familiar gains spell resistance equal to the master''s level + 5.',
        'SR equal to master level + 5.'
    UNION ALL SELECT 'familiar-scry', 'Scry on Familiar', 13,
        'If the master is 13th level or higher, he may scry on his familiar (as if casting the scrying spell) once per day.',
        'Master may scry on the familiar once per day.'
) AS v
WHERE NOT EXISTS (SELECT 1 FROM Feature f WHERE f.slug = v.slug);

INSERT IGNORE INTO FeatureClassMap (featureId, classId, levelDivisor)
SELECT f.id, src.classId, src.levelDivisor
FROM Feature f
JOIN FeatureClassMap src
  ON src.featureId IN (SELECT id FROM Feature WHERE slug LIKE 'summonfamiliar%')
WHERE f.slug IN (
    'familiar-alertness',
    'familiar-improved-evasion',
    'familiar-share-spells',
    'familiar-empathic-link',
    'familiar-deliver-touch-spells',
    'familiar-speak-with-master',
    'familiar-speak-with-animals',
    'familiar-spell-resistance',
    'familiar-scry'
);

-- Companion Type/AppliesTo entities, Alertness feat grant, and sheet flags: prisma/seeds/companion-entity-type.sql
