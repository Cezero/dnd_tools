-- Migration to add id column to AdvancementSkill and change primary key
-- This allows multiple entries for the same skill with different subtypes
-- 
-- Note: This migration must be run manually via SQL, as db push may fail due to MySQL's
-- internal constraint checking even when no foreign keys reference the primary key.

-- Disable foreign key checks temporarily to allow primary key changes
SET FOREIGN_KEY_CHECKS = 0;

-- Step 1: Add the new id column with AUTO_INCREMENT as a UNIQUE KEY first
-- MySQL requires AUTO_INCREMENT columns to be a key, so we add it as a unique key initially
ALTER TABLE `AdvancementSkill` ADD COLUMN `id` INT NOT NULL AUTO_INCREMENT FIRST, ADD UNIQUE KEY `AdvancementSkill_id_key` (`id`);

-- Step 2: Drop the old composite primary key and make id the new primary key
-- Since id is already a unique key, we can safely drop the old primary key and promote id
ALTER TABLE `AdvancementSkill` 
  DROP PRIMARY KEY,
  DROP KEY `AdvancementSkill_id_key`,
  ADD PRIMARY KEY (`id`);

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Step 4: Add unique constraint for the combination (allows multiple skills with different subtypes)
-- This ensures we can have multiple Knowledge skills (arcana, dungeoneering, planes, etc.)
ALTER TABLE `AdvancementSkill` ADD UNIQUE KEY `AdvancementSkill_advancementId_skillId_skillSubId_customSubtype_key` (`advancementId`, `skillId`, `skillSubId`, `customSubtype`);
