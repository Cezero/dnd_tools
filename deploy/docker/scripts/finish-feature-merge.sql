-- Finish Feature merge after identifier-length failure on CharacterFeatureChoice.
-- Safe if Feature.sourceType already exists and FeatureProgression is gone.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- CharacterFeatureChoice: progressionId -> featureId
SET @need := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'CharacterFeatureChoice'
      AND COLUMN_NAME = 'progressionId'
);
SET @sql := IF(@need > 0,
    'ALTER TABLE CharacterFeatureChoice
        DROP INDEX CharacterFeatureChoice_advancementId_progressionId_featureEn_key,
        DROP INDEX CharacterFeatureChoice_progressionId_fkey,
        CHANGE COLUMN progressionId featureId INT NOT NULL,
        ADD UNIQUE KEY CharacterFeatureChoice_advancementId_featureId_featureEn_key (advancementId, featureId, featureEntityId),
        ADD KEY CharacterFeatureChoice_featureId_fkey (featureId)',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- CharacterFeatureUses: progressionId -> featureId
SET @need := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'CharacterFeatureUses'
      AND COLUMN_NAME = 'progressionId'
);
SET @sql := IF(@need > 0,
    'ALTER TABLE CharacterFeatureUses
        DROP INDEX CharacterFeatureUses_characterId_progressionId_featureEntity_key,
        DROP INDEX CharacterFeatureUses_progressionId_fkey,
        CHANGE COLUMN progressionId featureId INT NOT NULL,
        ADD UNIQUE KEY CharacterFeatureUses_characterId_featureId_featureEn_key (characterId, featureId, featureEntityId),
        ADD KEY CharacterFeatureUses_featureId_fkey (featureId)',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- SpellcastingLink: featureProgressionId -> featureId
SET @need := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'SpellcastingLink'
      AND COLUMN_NAME = 'featureProgressionId'
);
SET @sql := IF(@need > 0,
    'ALTER TABLE SpellcastingLink
        DROP INDEX SpellcastingLink_featureProgressionId_key,
        CHANGE COLUMN featureProgressionId featureId INT NOT NULL,
        ADD UNIQUE KEY SpellcastingLink_featureId_key (featureId)',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- SpellcastingProgression: featureProgressionId -> featureId
SET @need := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'SpellcastingProgression'
      AND COLUMN_NAME = 'featureProgressionId'
);
SET @sql := IF(@need > 0,
    'ALTER TABLE SpellcastingProgression
        DROP INDEX SpellcastingProgression_featureProgressionId_key,
        CHANGE COLUMN featureProgressionId featureId INT DEFAULT NULL,
        ADD UNIQUE KEY SpellcastingProgression_featureId_key (featureId)',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET FOREIGN_KEY_CHECKS = 1;

-- Recreate FKs (ignore if already present via prepared IF)
SET @need := (
    SELECT COUNT(*) = 0
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Feature'
      AND CONSTRAINT_NAME = 'Feature_domainId_fkey'
);
SET @sql := IF(@need,
    'ALTER TABLE Feature
        ADD CONSTRAINT Feature_domainId_fkey FOREIGN KEY (domainId) REFERENCES Domain (id) ON DELETE SET NULL ON UPDATE CASCADE,
        ADD CONSTRAINT Feature_featId_fkey FOREIGN KEY (featId) REFERENCES Feat (id) ON DELETE SET NULL ON UPDATE CASCADE,
        ADD CONSTRAINT Feature_companionId_fkey FOREIGN KEY (companionId) REFERENCES Companion (id) ON DELETE SET NULL ON UPDATE CASCADE',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @need := (
    SELECT COUNT(*) = 0
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'FeatureClassMap'
      AND CONSTRAINT_NAME = 'FeatureClassMap_featureId_fkey'
);
SET @sql := IF(@need,
    'ALTER TABLE FeatureClassMap
        ADD CONSTRAINT FeatureClassMap_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT FeatureClassMap_classId_fkey FOREIGN KEY (classId) REFERENCES Class (id) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @need := (
    SELECT COUNT(*) = 0
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'FeatureRaceMap'
      AND CONSTRAINT_NAME = 'FeatureRaceMap_featureId_fkey'
);
SET @sql := IF(@need,
    'ALTER TABLE FeatureRaceMap
        ADD CONSTRAINT FeatureRaceMap_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT FeatureRaceMap_raceId_fkey FOREIGN KEY (raceId) REFERENCES Race (id) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @need := (
    SELECT COUNT(*) = 0
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'FeatureCondition'
      AND CONSTRAINT_NAME = 'FeatureCondition_featureId_fkey'
);
SET @sql := IF(@need,
    'ALTER TABLE FeatureCondition ADD CONSTRAINT FeatureCondition_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @need := (
    SELECT COUNT(*) = 0
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'FeaturePrerequisite'
      AND CONSTRAINT_NAME = 'FeaturePrerequisite_featureId_fkey'
);
SET @sql := IF(@need,
    'ALTER TABLE FeaturePrerequisite ADD CONSTRAINT FeaturePrerequisite_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @need := (
    SELECT COUNT(*) = 0
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'TransformationFormEligibility'
      AND CONSTRAINT_NAME = 'TransformationFormEligibility_featureId_fkey'
);
SET @sql := IF(@need,
    'ALTER TABLE TransformationFormEligibility
        ADD CONSTRAINT TransformationFormEligibility_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE CASCADE ON UPDATE CASCADE,
        ADD CONSTRAINT TransformationFormEligibility_monsterId_fkey FOREIGN KEY (monsterId) REFERENCES Monster (id) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @need := (
    SELECT COUNT(*) = 0
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'FeatureEntity'
      AND CONSTRAINT_NAME = 'FeatureEntity_featureId_fkey'
);
SET @sql := IF(@need,
    'ALTER TABLE FeatureEntity ADD CONSTRAINT FeatureEntity_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @need := (
    SELECT COUNT(*) = 0
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'CharacterFeatureChoice'
      AND CONSTRAINT_NAME = 'CharacterFeatureChoice_featureId_fkey'
);
SET @sql := IF(@need,
    'ALTER TABLE CharacterFeatureChoice ADD CONSTRAINT CharacterFeatureChoice_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @need := (
    SELECT COUNT(*) = 0
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'CharacterFeatureUses'
      AND CONSTRAINT_NAME = 'CharacterFeatureUses_featureId_fkey'
);
SET @sql := IF(@need,
    'ALTER TABLE CharacterFeatureUses ADD CONSTRAINT CharacterFeatureUses_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @need := (
    SELECT COUNT(*) = 0
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'SpellcastingLink'
      AND CONSTRAINT_NAME = 'SpellcastingLink_featureId_fkey'
);
SET @sql := IF(@need,
    'ALTER TABLE SpellcastingLink ADD CONSTRAINT SpellcastingLink_featureId_fkey FOREIGN KEY (featureId) REFERENCES Feature (id) ON DELETE RESTRICT ON UPDATE CASCADE',
    'SELECT 1');
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SELECT
    (SELECT COUNT(*) FROM Feature) AS features,
    (SELECT COUNT(*) FROM FeatureClassMap) AS class_maps,
    (SELECT COUNT(*) FROM FeatureRaceMap) AS race_maps,
    (SELECT COUNT(*) FROM FeaturePrerequisite) AS prerequisites,
    (SELECT COUNT(*) FROM FeatureEntity) AS entities;

SET @source_type_ok := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'Feature'
      AND COLUMN_NAME = 'sourceType'
);
SET @choice_ok := (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'CharacterFeatureChoice'
      AND COLUMN_NAME = 'featureId'
);
SET @old_table_gone := (
    SELECT COUNT(*) = 0
    FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'FeatureProgression'
);
SET @sql := IF(
    @source_type_ok > 0 AND @choice_ok > 0 AND @old_table_gone,
    'SELECT ''Feature merge verified'' AS status',
    'SELECT * FROM Feature_merge_VERIFY_FAILED'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;
