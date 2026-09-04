-- Merge Feature + FeatureProgression into the unified Feature model.
-- Matches deploy/docker/scripts/merge-feature-progression.sql (new Feature.id = old FeatureProgression.id).
-- Linearized for shadow replay against the Jan 2026 dump baseline (never pre-merged).
-- Do not run against live cyberdnd; mark applied instead.

SET NAMES utf8mb4;

ALTER TABLE FeatureFormulaParams
    ADD COLUMN featureLevelZero TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN startingValue INT NULL,
    ADD COLUMN `maxValue` INT NULL;

ALTER TABLE FeatureEntity
    ADD COLUMN showFullProgression TINYINT(1) NOT NULL DEFAULT 0;

-- New Feature rows: one per FeatureProgression, id = progression id
-- First progression per slug keeps the original slug; later ones append -{id}
DROP TABLE IF EXISTS Feature_new;
CREATE TABLE Feature_new (
    id INT NOT NULL,
    slug VARCHAR(191) COLLATE utf8mb4_unicode_ci NOT NULL,
    name VARCHAR(191) COLLATE utf8mb4_unicode_ci NOT NULL,
    description TEXT COLLATE utf8mb4_unicode_ci NOT NULL,
    summary TEXT COLLATE utf8mb4_unicode_ci,
    displayInCharacterSheet TINYINT(1) NOT NULL DEFAULT 1,
    sourceType INT NOT NULL,
    level INT NOT NULL,
    domainId INT DEFAULT NULL,
    featId INT DEFAULT NULL,
    companionId INT DEFAULT NULL,
    editionId INT DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY Feature_slug_key (slug),
    KEY Feature_domainId_fkey (domainId),
    KEY Feature_featId_idx (featId),
    KEY Feature_companionId_idx (companionId),
    KEY Feature_editionId_idx (editionId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO Feature_new (
    id, slug, name, description, summary, displayInCharacterSheet,
    sourceType, level, domainId, featId, companionId, editionId
)
SELECT
    fp.id,
    IF(fp.id = firsts.first_id, f.slug, CONCAT(f.slug, '-', fp.id)),
    f.name,
    f.description,
    f.summary,
    f.displayInCharacterSheet,
    fp.sourceType,
    fp.level,
    fp.domainId,
    fp.featId,
    fp.companionId,
    fp.editionId
FROM FeatureProgression fp
INNER JOIN Feature f ON f.id = fp.featureId
INNER JOIN (
    SELECT f2.slug, MIN(fp2.id) AS first_id
    FROM FeatureProgression fp2
    INNER JOIN Feature f2 ON f2.id = fp2.featureId
    GROUP BY f2.slug
) firsts ON firsts.slug = f.slug;

DROP TABLE IF EXISTS FeaturePrerequisite_new;
CREATE TABLE FeaturePrerequisite_new (
    id INT NOT NULL AUTO_INCREMENT,
    type INT NOT NULL,
    appliesToId INT DEFAULT NULL,
    minValue INT NOT NULL,
    featureId INT NOT NULL,
    PRIMARY KEY (id),
    KEY FeaturePrerequisite_featureId_fkey (featureId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO FeaturePrerequisite_new (type, appliesToId, minValue, featureId)
SELECT p.type, p.appliesToId, p.minValue, fp.id
FROM FeaturePrerequisite p
INNER JOIN FeatureProgression fp ON fp.featureId = p.featureId;

DROP TABLE IF EXISTS TransformationFormEligibility_new;
CREATE TABLE TransformationFormEligibility_new (
    id INT NOT NULL AUTO_INCREMENT,
    featureId INT NOT NULL,
    monsterId INT NOT NULL,
    minLevel INT DEFAULT NULL,
    notes TEXT COLLATE utf8mb4_unicode_ci,
    PRIMARY KEY (id),
    UNIQUE KEY TransformationFormEligibility_featureId_monsterId_key (featureId, monsterId),
    KEY TransformationFormEligibility_featureId_idx (featureId),
    KEY TransformationFormEligibility_monsterId_idx (monsterId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO TransformationFormEligibility_new (featureId, monsterId, minLevel, notes)
SELECT fp.id, e.monsterId, e.minLevel, e.notes
FROM TransformationFormEligibility e
INNER JOIN FeatureProgression fp ON fp.featureId = e.featureId;

DROP TABLE IF EXISTS FeatureClassMap;
CREATE TABLE FeatureClassMap (
    featureId INT NOT NULL,
    classId INT NOT NULL,
    PRIMARY KEY (featureId, classId),
    KEY FeatureClassMap_classId_idx (classId),
    KEY FeatureClassMap_featureId_idx (featureId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO FeatureClassMap (featureId, classId)
SELECT progressionId, classId FROM FeatureProgressionClassMap;

DROP TABLE IF EXISTS FeatureRaceMap;
CREATE TABLE FeatureRaceMap (
    featureId INT NOT NULL,
    raceId INT NOT NULL,
    PRIMARY KEY (featureId, raceId),
    KEY FeatureRaceMap_raceId_idx (raceId),
    KEY FeatureRaceMap_featureId_idx (featureId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO FeatureRaceMap (featureId, raceId)
SELECT progressionId, raceId FROM FeatureProgressionRaceMap;

DROP TABLE IF EXISTS FeatureCondition;
CREATE TABLE FeatureCondition (
    id INT NOT NULL AUTO_INCREMENT,
    featureId INT NOT NULL,
    conditionType INT NOT NULL,
    conditionValue INT NOT NULL,
    PRIMARY KEY (id),
    KEY FeatureCondition_featureId_idx (featureId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO FeatureCondition (featureId, conditionType, conditionValue)
SELECT progressionId, conditionType, conditionValue FROM FeatureProgressionCondition;

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE FeaturePrerequisite DROP FOREIGN KEY FeaturePrerequisite_featureId_fkey;
ALTER TABLE TransformationFormEligibility DROP FOREIGN KEY TransformationFormEligibility_featureId_fkey;
ALTER TABLE FeatureEntity DROP FOREIGN KEY FeatureEntity_progressionId_fkey;
ALTER TABLE CharacterFeatureChoice DROP FOREIGN KEY CharacterFeatureChoice_progressionId_fkey;
ALTER TABLE CharacterFeatureUses DROP FOREIGN KEY CharacterFeatureUses_progressionId_fkey;
ALTER TABLE SpellcastingLink DROP FOREIGN KEY SpellcastingLink_featureProgressionId_fkey;

ALTER TABLE FeatureProgression DROP FOREIGN KEY FeatureProgression_featureId_fkey;
ALTER TABLE FeatureProgression DROP FOREIGN KEY FeatureProgression_domainId_fkey;
ALTER TABLE FeatureProgression DROP FOREIGN KEY FeatureProgression_featId_fkey;
ALTER TABLE FeatureProgression DROP FOREIGN KEY FeatureProgression_companionId_fkey;

ALTER TABLE FeatureProgressionClassMap DROP FOREIGN KEY FeatureProgressionClassMap_classId_fkey;
ALTER TABLE FeatureProgressionClassMap DROP FOREIGN KEY FeatureProgressionClassMap_progressionId_fkey;
ALTER TABLE FeatureProgressionRaceMap DROP FOREIGN KEY FeatureProgressionRaceMap_progressionId_fkey;
ALTER TABLE FeatureProgressionRaceMap DROP FOREIGN KEY FeatureProgressionRaceMap_raceId_fkey;
ALTER TABLE FeatureProgressionCondition DROP FOREIGN KEY FeatureProgressionCondition_progressionId_fkey;

DROP TABLE FeaturePrerequisite;
RENAME TABLE FeaturePrerequisite_new TO FeaturePrerequisite;

DROP TABLE TransformationFormEligibility;
RENAME TABLE TransformationFormEligibility_new TO TransformationFormEligibility;

DROP TABLE FeatureProgressionClassMap;
DROP TABLE FeatureProgressionRaceMap;
DROP TABLE FeatureProgressionCondition;
DROP TABLE FeatureProgression;
DROP TABLE Feature;
RENAME TABLE Feature_new TO Feature;

ALTER TABLE Feature MODIFY id INT NOT NULL AUTO_INCREMENT;

ALTER TABLE FeatureEntity
    CHANGE COLUMN progressionId featureId INT NOT NULL;

ALTER TABLE CharacterFeatureChoice
    DROP INDEX CharacterFeatureChoice_advancementId_progressionId_featureEn_key,
    DROP INDEX CharacterFeatureChoice_progressionId_fkey,
    CHANGE COLUMN progressionId featureId INT NOT NULL,
    ADD UNIQUE KEY CharacterFeatureChoice_advancementId_featureId_featureEn_key (advancementId, featureId, featureEntityId),
    ADD KEY CharacterFeatureChoice_featureId_fkey (featureId);

ALTER TABLE CharacterFeatureUses
    DROP INDEX CharacterFeatureUses_characterId_progressionId_featureEntity_key,
    DROP INDEX CharacterFeatureUses_progressionId_fkey,
    CHANGE COLUMN progressionId featureId INT NOT NULL,
    ADD UNIQUE KEY CharacterFeatureUses_characterId_featureId_featureEn_key (characterId, featureId, featureEntityId),
    ADD KEY CharacterFeatureUses_featureId_fkey (featureId);

ALTER TABLE SpellcastingLink
    DROP INDEX SpellcastingLink_featureProgressionId_key,
    CHANGE COLUMN featureProgressionId featureId INT NOT NULL,
    ADD UNIQUE KEY SpellcastingLink_featureId_key (featureId);

ALTER TABLE SpellcastingProgression
    DROP INDEX SpellcastingProgression_featureProgressionId_key,
    CHANGE COLUMN featureProgressionId featureId INT DEFAULT NULL,
    ADD UNIQUE KEY SpellcastingProgression_featureId_key (featureId);

SET FOREIGN_KEY_CHECKS = 1;

ALTER TABLE Feature
    ADD CONSTRAINT Feature_domainId_fkey FOREIGN KEY (domainId) REFERENCES Domain (id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT Feature_featId_fkey FOREIGN KEY (featId) REFERENCES Feat (id) ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT Feature_companionId_fkey FOREIGN KEY (companionId) REFERENCES Companion (id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE FeatureClassMap
    ADD CONSTRAINT FeatureClassMap_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT FeatureClassMap_classId_fkey FOREIGN KEY (classId) REFERENCES Class (id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE FeatureRaceMap
    ADD CONSTRAINT FeatureRaceMap_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT FeatureRaceMap_raceId_fkey FOREIGN KEY (raceId) REFERENCES Race (id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE FeatureCondition
    ADD CONSTRAINT FeatureCondition_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE FeaturePrerequisite
    ADD CONSTRAINT FeaturePrerequisite_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE TransformationFormEligibility
    ADD CONSTRAINT TransformationFormEligibility_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT TransformationFormEligibility_monsterId_fkey FOREIGN KEY (monsterId) REFERENCES Monster (id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE FeatureEntity
    ADD CONSTRAINT FeatureEntity_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE CharacterFeatureChoice
    ADD CONSTRAINT CharacterFeatureChoice_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE CharacterFeatureUses
    ADD CONSTRAINT CharacterFeatureUses_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE SpellcastingLink
    ADD CONSTRAINT SpellcastingLink_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE RESTRICT ON UPDATE CASCADE;
