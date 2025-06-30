-- AlterTable
ALTER TABLE `Class` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `ClassFeature` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `Feat` MODIFY `description` TEXT NULL,
    MODIFY `benefit` TEXT NULL,
    MODIFY `normalEffect` TEXT NULL,
    MODIFY `specialEffect` TEXT NULL,
    MODIFY `prerequisites` TEXT NULL;

-- AlterTable
ALTER TABLE `Race` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `RaceTrait` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `ReferenceTable` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `Skill` MODIFY `checkDescription` TEXT NULL,
    MODIFY `actionDescription` TEXT NULL,
    MODIFY `retryDescription` TEXT NULL,
    MODIFY `specialNotes` TEXT NULL,
    MODIFY `synergyNotes` TEXT NULL,
    MODIFY `untrainedNotes` TEXT NULL,
    MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `SourceBook` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `Spell` MODIFY `description` TEXT NULL;

-- AlterTable
ALTER TABLE `UserCharacter` MODIFY `notes` TEXT NULL;

-- AlterTable
ALTER TABLE `Weapon` MODIFY `description` TEXT NULL;
