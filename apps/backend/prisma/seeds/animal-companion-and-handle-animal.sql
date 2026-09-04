-- Shared animal companion progression features, Handle Animal tricks/purposes,
-- and ranger companion levelDivisor. Idempotent. PHB (SourceBook 1), edition 5 (3.5e).
-- Druid classId = 20, Ranger classId = 24, Multiattack featId = 348.

-- Ranger animal companion uses half ranger level.
UPDATE FeatureClassMap
SET levelDivisor = 2
WHERE featureId = (SELECT id FROM Feature WHERE slug = 'rangeranimalcompanion')
  AND classId = 24;

-- ---------------------------------------------------------------------------
-- Handle Animal tricks (Attack already exists as id 1)
-- ---------------------------------------------------------------------------
INSERT INTO Trick (name, description, editionId, dc, maxTimesTrainable, isVisible)
SELECT v.name, v.description, 5, v.dc, v.maxTimes, 1
FROM (
    SELECT 'Come' AS name, 'The animal comes to you, even if it normally would not do so.' AS description, 15 AS dc, 1 AS maxTimes
    UNION ALL SELECT 'Defend', 'The animal defends you (or is ready to defend you if no threat is present), even without any command being given. Alternatively, you can command the animal to defend a specific other character.', 20, 1
    UNION ALL SELECT 'Down', 'The animal breaks off from combat or otherwise backs down. An animal that doesn''t know this trick continues to fight until it must flee (due to injury, a fear effect, or the like) or its opponent is defeated.', 15, 1
    UNION ALL SELECT 'Fetch', 'The animal goes and gets something. If you do not point out a specific item, the animal fetches some random object.', 15, 1
    UNION ALL SELECT 'Guard', 'The animal stays in place and prevents others from approaching.', 20, 1
    UNION ALL SELECT 'Heel', 'The animal follows you closely, even to places where it normally wouldn''t go.', 15, 1
    UNION ALL SELECT 'Perform', 'The animal performs a variety of simple tricks, such as sitting up, rolling over, roaring or barking, and so on.', 15, 1
    UNION ALL SELECT 'Seek', 'The animal moves into an area and looks around for anything that is obviously alive or animate.', 15, 1
    UNION ALL SELECT 'Stay', 'The animal stays in place, waiting for you to return. It does not challenge other creatures that come by, though it still defends itself if it needs to.', 15, 1
    UNION ALL SELECT 'Track', 'The animal tracks the scent presented to it. (This requires the animal to have the scent ability)', 20, 1
    UNION ALL SELECT 'Work', 'The animal pulls or pushes a medium or heavy load.', 15, 1
) AS v
WHERE NOT EXISTS (SELECT 1 FROM Trick t WHERE t.name = v.name);

INSERT IGNORE INTO TrickSourceMap (trickId, sourceBookId, pageNumber)
SELECT t.id, 1, 75 FROM Trick t
WHERE t.name IN ('Attack','Come','Defend','Down','Fetch','Guard','Heel','Perform','Seek','Stay','Track','Work');

-- ---------------------------------------------------------------------------
-- Handle Animal purposes
-- ---------------------------------------------------------------------------
INSERT INTO TrickPurpose (name, description, dc, trainingWeeks, editionId, isVisible, replacesPurposeId)
SELECT v.name, v.description, v.dc, v.weeks, 5, 1, NULL
FROM (
    SELECT 'Riding' AS name, 'An animal trained to bear a rider.' AS description, 15 AS dc, 3 AS weeks
    UNION ALL SELECT 'Fighting', 'An animal trained to engage in combat.', 20, 3
    UNION ALL SELECT 'Guarding', 'An animal trained to keep watch over a location.', 20, 4
    UNION ALL SELECT 'Heavy Labor', 'An animal trained to pull or push loads.', 15, 2
    UNION ALL SELECT 'Hunting', 'An animal trained to aid in hunting.', 20, 6
    UNION ALL SELECT 'Performance', 'An animal trained for show.', 15, 4
    UNION ALL SELECT 'Combat Riding', 'An animal trained to bear a rider into combat. Replaces Riding; applying this purpose wipes previously known tricks.', 20, 3
) AS v
WHERE NOT EXISTS (SELECT 1 FROM TrickPurpose p WHERE p.name = v.name);

UPDATE TrickPurpose
SET replacesPurposeId = (SELECT id FROM (SELECT id FROM TrickPurpose WHERE name = 'Riding') AS riding)
WHERE name = 'Combat Riding' AND (replacesPurposeId IS NULL OR replacesPurposeId = 0);

INSERT IGNORE INTO TrickPurposeSourceMap (trickPurposeId, sourceBookId, pageNumber)
SELECT p.id, 1, 75 FROM TrickPurpose p;

INSERT IGNORE INTO TrickPurposeTrick (purposeId, trickId, timesTrained)
SELECT p.id, t.id, 1
FROM TrickPurpose p
JOIN Trick t ON (
    (p.name = 'Riding' AND t.name IN ('Come', 'Down', 'Stay'))
    OR (p.name = 'Fighting' AND t.name IN ('Attack', 'Down', 'Stay'))
    OR (p.name = 'Guarding' AND t.name IN ('Attack', 'Defend', 'Down', 'Guard'))
    OR (p.name = 'Heavy Labor' AND t.name IN ('Come', 'Down', 'Work'))
    OR (p.name = 'Hunting' AND t.name IN ('Attack', 'Down', 'Fetch', 'Heel', 'Seek', 'Track'))
    OR (p.name = 'Performance' AND t.name IN ('Come', 'Fetch', 'Heel', 'Perform', 'Stay'))
    OR (p.name = 'Combat Riding' AND t.name IN ('Attack', 'Come', 'Defend', 'Down', 'Guard', 'Heel'))
);

-- ---------------------------------------------------------------------------
-- Shared companion progression chassis
-- ---------------------------------------------------------------------------
INSERT INTO Feature (slug, name, description, summary, displayInCharacterSheet, sourceType, level, domainId, featId, companionId, editionId)
SELECT
    'animal-companion-progression',
    'Animal Companion Progression',
    'Bonus Hit Dice, natural armor, Strength, Dexterity, and bonus tricks granted to an animal companion. Evaluated once at stacked effective companion level (Druid full, Ranger half).',
    'Companion HD, NA, Str/Dex, and bonus tricks.',
    0, 1, 1, NULL, NULL, NULL, 5
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM Feature WHERE slug = 'animal-companion-progression');

INSERT IGNORE INTO FeatureClassMap (featureId, classId, levelDivisor)
SELECT id, 20, 1 FROM Feature WHERE slug = 'animal-companion-progression'
UNION ALL
SELECT id, 24, 2 FROM Feature WHERE slug = 'animal-companion-progression';

-- Formula params (created only when the chassis has no entities yet)
SET @hd_fp := 0;
SET @na_fp := 0;
SET @str_fp := 0;
SET @dex_fp := 0;
SET @trick_fp := 0;

INSERT INTO FeatureFormulaParams (formulaId, `interval`, formulaStartLevel, thresholds, `values`, includeProgressionLevel, featureLevelZero, valuesRepresent, cumulative)
SELECT 3, NULL, NULL, '3,6,9,12,15,18', '2,4,6,8,10,12', 1, 0, NULL, 0
FROM DUAL
WHERE EXISTS (SELECT 1 FROM Feature WHERE slug = 'animal-companion-progression')
  AND NOT EXISTS (
      SELECT 1 FROM FeatureEntity fe
      JOIN Feature f ON f.id = fe.featureId
      WHERE f.slug = 'animal-companion-progression'
  );
SET @hd_fp := IF(ROW_COUNT() > 0, LAST_INSERT_ID(), 0);

INSERT INTO FeatureFormulaParams (formulaId, `interval`, formulaStartLevel, thresholds, `values`, includeProgressionLevel, featureLevelZero, valuesRepresent, cumulative)
SELECT 3, NULL, NULL, '3,6,9,12,15,18', '2,4,6,8,10,12', 1, 0, NULL, 0
FROM DUAL WHERE @hd_fp > 0;
SET @na_fp := IF(@hd_fp > 0 AND ROW_COUNT() > 0, LAST_INSERT_ID(), 0);

INSERT INTO FeatureFormulaParams (formulaId, `interval`, formulaStartLevel, thresholds, `values`, includeProgressionLevel, featureLevelZero, valuesRepresent, cumulative)
SELECT 3, NULL, NULL, '3,6,9,12,15,18', '1,2,3,4,5,6', 1, 0, NULL, 0
FROM DUAL WHERE @hd_fp > 0;
SET @str_fp := IF(@hd_fp > 0 AND ROW_COUNT() > 0, LAST_INSERT_ID(), 0);

INSERT INTO FeatureFormulaParams (formulaId, `interval`, formulaStartLevel, thresholds, `values`, includeProgressionLevel, featureLevelZero, valuesRepresent, cumulative)
SELECT 3, NULL, NULL, '3,6,9,12,15,18', '1,2,3,4,5,6', 1, 0, NULL, 0
FROM DUAL WHERE @hd_fp > 0;
SET @dex_fp := IF(@hd_fp > 0 AND ROW_COUNT() > 0, LAST_INSERT_ID(), 0);

INSERT INTO FeatureFormulaParams (formulaId, `interval`, formulaStartLevel, thresholds, `values`, includeProgressionLevel, featureLevelZero, valuesRepresent, cumulative)
SELECT 3, NULL, NULL, '1,3,6,9,12,15,18', '1,2,3,4,5,6,7', 1, 0, NULL, 0
FROM DUAL WHERE @hd_fp > 0;
SET @trick_fp := IF(@hd_fp > 0 AND ROW_COUNT() > 0, LAST_INSERT_ID(), 0);

INSERT INTO FeatureEntity (featureId, appliesTo, appliesToId, appliesToSubId, formulaParamsId, groupingId, type, value, bonusType, displayInDetail, showFullProgression)
SELECT f.id, 9, NULL, NULL, @hd_fp, 0, 7, 0, NULL, 0, 0
FROM Feature f WHERE f.slug = 'animal-companion-progression' AND @hd_fp > 0;

INSERT INTO FeatureEntity (featureId, appliesTo, appliesToId, appliesToSubId, formulaParamsId, groupingId, type, value, bonusType, displayInDetail, showFullProgression)
SELECT f.id, 3, NULL, NULL, @na_fp, 0, 7, 0, 10, 0, 0
FROM Feature f WHERE f.slug = 'animal-companion-progression' AND @hd_fp > 0;

INSERT INTO FeatureEntity (featureId, appliesTo, appliesToId, appliesToSubId, formulaParamsId, groupingId, type, value, bonusType, displayInDetail, showFullProgression)
SELECT f.id, 0, 1, NULL, @str_fp, 0, 7, 0, NULL, 0, 0
FROM Feature f WHERE f.slug = 'animal-companion-progression' AND @hd_fp > 0;

INSERT INTO FeatureEntity (featureId, appliesTo, appliesToId, appliesToSubId, formulaParamsId, groupingId, type, value, bonusType, displayInDetail, showFullProgression)
SELECT f.id, 0, 2, NULL, @dex_fp, 0, 7, 0, NULL, 0, 0
FROM Feature f WHERE f.slug = 'animal-companion-progression' AND @hd_fp > 0;

INSERT INTO FeatureEntity (featureId, appliesTo, appliesToId, appliesToSubId, formulaParamsId, groupingId, type, value, bonusType, displayInDetail, showFullProgression)
SELECT f.id, 47, NULL, NULL, @trick_fp, 0, 7, 0, NULL, 0, 0
FROM Feature f WHERE f.slug = 'animal-companion-progression' AND @hd_fp > 0;

-- Named companion specials (Feature.level = effective companion level)
INSERT INTO Feature (slug, name, description, summary, displayInCharacterSheet, sourceType, level, domainId, featId, companionId, editionId)
SELECT v.slug, v.name, v.description, v.summary, 0, 1, v.level, NULL, v.featId, NULL, 5
FROM (
    SELECT 'animal-companion-link' AS slug, 'Link' AS name, 1 AS level, NULL AS featId,
        'A druid can handle her animal companion as a free action, or push it as a move action, even if she doesn''t have any ranks in the Handle Animal skill. The druid gains a +4 circumstance bonus on all wild empathy checks and Handle Animal checks made regarding an animal companion.' AS description,
        'Handle companion as a free action; +4 Handle Animal / wild empathy.' AS summary
    UNION ALL SELECT 'share-spells', 'Share Spells', 1, NULL,
        'At the druid''s option, she may have any spell (but not any spell-like ability) she casts upon herself also affect her animal companion. The companion must be within 5 feet of her at the time of casting to receive the benefit. If the spell or effect has a duration other than instantaneous, it stops affecting the companion if the companion moves farther than 5 feet away and will not affect the companion again, even if it returns to the druid before the duration expires. Additionally, the druid may cast a spell with a target of "You" on her animal companion (as a touch range spell) instead of on herself. A druid and her animal companion can share spells even if the spells normally do not affect creatures of the companion''s type (animal).',
        'Share spells with companion within 5 feet.'
    UNION ALL SELECT 'animal-companion-evasion', 'Evasion', 3, NULL,
        'If an animal companion is subjected to an attack that normally allows a Reflex saving throw for half damage, it takes no damage if it makes a successful saving throw.',
        'No damage on a successful Reflex save for half.'
    UNION ALL SELECT 'devotion', 'Devotion', 6, NULL,
        'An animal companion gains a +4 morale bonus on Will saves against enchantment spells and effects.',
        '+4 morale bonus on Will saves vs enchantment.'
    UNION ALL SELECT 'multiattack', 'Multiattack', 9, 348,
        'An animal companion gains Multiattack as a bonus feat if it has three or more natural attacks and does not already have that feat. If it does not have the requisite three or more natural attacks, the companion instead gains a second attack with its primary natural weapon, albeit at a -5 penalty.',
        'Bonus Multiattack feat (does not spend an HD feat slot).'
    UNION ALL SELECT 'improved-evasion', 'Improved Evasion', 15, NULL,
        'When subjected to an attack that normally allows a Reflex saving throw for half damage, an animal companion takes no damage if it makes a successful saving throw and only half damage if the saving throw fails.',
        'No damage on a successful Reflex save; half on a failure.'
) AS v
WHERE NOT EXISTS (SELECT 1 FROM Feature f WHERE f.slug = v.slug);

INSERT IGNORE INTO FeatureClassMap (featureId, classId, levelDivisor)
SELECT f.id, 20, 1 FROM Feature f
WHERE f.slug IN ('animal-companion-link','share-spells','animal-companion-evasion','devotion','multiattack','improved-evasion')
UNION ALL
SELECT f.id, 24, 2 FROM Feature f
WHERE f.slug IN ('animal-companion-link','share-spells','animal-companion-evasion','devotion','multiattack','improved-evasion');

INSERT INTO FeatureEntity (featureId, appliesTo, appliesToId, appliesToSubId, formulaParamsId, groupingId, type, value, bonusType, displayInDetail, showFullProgression)
SELECT f.id, 21, 348, NULL, NULL, 0, 7, NULL, NULL, 1, 0
FROM Feature f
WHERE f.slug = 'multiattack'
  AND NOT EXISTS (SELECT 1 FROM FeatureEntity fe WHERE fe.featureId = f.id AND fe.appliesTo = 21 AND fe.appliesToId = 348);

-- Companion Type/AppliesTo entities, Link skills, and sheet flags: prisma/seeds/companion-entity-type.sql
