-- DropForeignKey
ALTER TABLE `CharacterCompanionFeat` DROP FOREIGN KEY `CharacterCompanionFeat_characterCompanionId_fkey`;

-- DropForeignKey
ALTER TABLE `CharacterCompanionFeat` DROP FOREIGN KEY `CharacterCompanionFeat_featId_fkey`;

-- DropForeignKey
ALTER TABLE `CharacterCompanionSkill` DROP FOREIGN KEY `CharacterCompanionSkill_characterCompanionId_fkey`;

-- DropForeignKey
ALTER TABLE `CharacterCompanionSkill` DROP FOREIGN KEY `CharacterCompanionSkill_skillId_fkey`;

-- AlterTable
ALTER TABLE `CharacterCompanion` ADD COLUMN `maxHpAtFirstLevel` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `Trick` ALTER COLUMN `dc` DROP DEFAULT;

-- DropTable
DROP TABLE `CharacterCompanionFeat`;

-- DropTable
DROP TABLE `CharacterCompanionSkill`;

-- CreateTable
CREATE TABLE `CharacterCompanionAdvancement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `characterCompanionId` INTEGER NOT NULL,
    `sequence` INTEGER NOT NULL,
    `hitDiceQty` DOUBLE NOT NULL,
    `hitDiceType` INTEGER NOT NULL,
    `hitPoints` INTEGER NOT NULL,
    `classId` INTEGER NULL,
    `notes` TEXT NULL,

    INDEX `CharacterCompanionAdvancement_characterCompanionId_idx`(`characterCompanionId`),
    UNIQUE INDEX `CharacterCompanionAdvancement_characterCompanionId_sequence_key`(`characterCompanionId`, `sequence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CharacterCompanionAdvancementSkill` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `advancementId` INTEGER NOT NULL,
    `skillId` INTEGER NOT NULL,
    `skillSubId` INTEGER NULL,
    `ranks` INTEGER NOT NULL,

    INDEX `CharacterCompanionAdvancementSkill_advancementId_idx`(`advancementId`),
    INDEX `CharacterCompanionAdvancementSkill_skillId_idx`(`skillId`),
    UNIQUE INDEX `CharacterCompanionAdvancementSkill_advancementId_skillId_ski_key`(`advancementId`, `skillId`, `skillSubId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CharacterCompanionAdvancementFeat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `advancementId` INTEGER NOT NULL,
    `featId` INTEGER NOT NULL,
    `featSubId` INTEGER NULL,
    `notes` VARCHAR(128) NULL,

    INDEX `CharacterCompanionAdvancementFeat_advancementId_idx`(`advancementId`),
    INDEX `CharacterCompanionAdvancementFeat_featId_idx`(`featId`),
    UNIQUE INDEX `CharacterCompanionAdvancementFeat_advancementId_featId_featS_key`(`advancementId`, `featId`, `featSubId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CharacterCompanionAdvancement` ADD CONSTRAINT `CharacterCompanionAdvancement_characterCompanionId_fkey` FOREIGN KEY (`characterCompanionId`) REFERENCES `CharacterCompanion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterCompanionAdvancementSkill` ADD CONSTRAINT `CharacterCompanionAdvancementSkill_advancementId_fkey` FOREIGN KEY (`advancementId`) REFERENCES `CharacterCompanionAdvancement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterCompanionAdvancementSkill` ADD CONSTRAINT `CharacterCompanionAdvancementSkill_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterCompanionAdvancementFeat` ADD CONSTRAINT `CharacterCompanionAdvancementFeat_advancementId_fkey` FOREIGN KEY (`advancementId`) REFERENCES `CharacterCompanionAdvancement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterCompanionAdvancementFeat` ADD CONSTRAINT `CharacterCompanionAdvancementFeat_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `CharacterFeatureChoice` RENAME INDEX `CharacterFeatureChoice_advancementId_featureId_featureEn_key` TO `CharacterFeatureChoice_advancementId_featureId_featureEntity_key`;

-- RenameIndex
ALTER TABLE `CharacterFeatureUses` RENAME INDEX `CharacterFeatureUses_characterId_featureId_featureEn_key` TO `CharacterFeatureUses_characterId_featureId_featureEntityId_key`;
