-- Companion names/purposes, trick training counts, selected wild-shape forms,
-- and FeatureClassMap.levelDivisor for shared Druid/Ranger companion progression.

-- AlterTable
ALTER TABLE `FeatureClassMap`
    ADD COLUMN `levelDivisor` INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `Companion`
    ADD COLUMN `levelAdjustment` INTEGER NULL;

-- AlterTable
ALTER TABLE `Trick`
    ADD COLUMN `maxTimesTrainable` INTEGER NOT NULL DEFAULT 1;

UPDATE `Trick`
    SET `maxTimesTrainable` = 2
    WHERE `name` = 'Attack';

-- AlterTable
ALTER TABLE `CharacterCompanionTrick`
    ADD COLUMN `timesTrained` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `isBonus` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `fromPurpose` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `TrickPurpose` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `dc` INTEGER NOT NULL,
    `trainingWeeks` INTEGER NOT NULL,
    `editionId` INTEGER NOT NULL,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `replacesPurposeId` INTEGER NULL,

    INDEX `TrickPurpose_editionId_idx` (`editionId`),
    INDEX `TrickPurpose_replacesPurposeId_idx` (`replacesPurposeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrickPurposeTrick` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purposeId` INTEGER NOT NULL,
    `trickId` INTEGER NOT NULL,
    `timesTrained` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `TrickPurposeTrick_purposeId_trickId_key` (`purposeId`, `trickId`),
    INDEX `TrickPurposeTrick_purposeId_idx` (`purposeId`),
    INDEX `TrickPurposeTrick_trickId_idx` (`trickId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrickPurposeSourceMap` (
    `trickPurposeId` INTEGER NOT NULL,
    `sourceBookId` INTEGER NOT NULL,
    `pageNumber` INTEGER NULL,

    PRIMARY KEY (`trickPurposeId`, `sourceBookId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CharacterCompanionSkill` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `characterCompanionId` INTEGER NOT NULL,
    `skillId` INTEGER NOT NULL,
    `skillSubId` INTEGER NULL,
    `ranks` INTEGER NOT NULL,

    UNIQUE INDEX `CharacterCompanionSkill_ccId_skillId_skillSubId_key` (`characterCompanionId`, `skillId`, `skillSubId`),
    INDEX `CharacterCompanionSkill_characterCompanionId_idx` (`characterCompanionId`),
    INDEX `CharacterCompanionSkill_skillId_idx` (`skillId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CharacterCompanionFeat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `characterCompanionId` INTEGER NOT NULL,
    `featId` INTEGER NOT NULL,
    `notes` VARCHAR(128) NULL,

    UNIQUE INDEX `CharacterCompanionFeat_characterCompanionId_featId_notes_key` (`characterCompanionId`, `featId`, `notes`),
    INDEX `CharacterCompanionFeat_characterCompanionId_idx` (`characterCompanionId`),
    INDEX `CharacterCompanionFeat_featId_idx` (`featId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CharacterSelectedForm` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `characterId` INTEGER NOT NULL,
    `featureId` INTEGER NOT NULL,
    `monsterId` INTEGER NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `CharacterSelectedForm_characterId_featureId_monsterId_key` (`characterId`, `featureId`, `monsterId`),
    INDEX `CharacterSelectedForm_characterId_idx` (`characterId`),
    INDEX `CharacterSelectedForm_featureId_idx` (`featureId`),
    INDEX `CharacterSelectedForm_monsterId_idx` (`monsterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `CharacterCompanion`
    ADD COLUMN `name` VARCHAR(191) NULL,
    ADD COLUMN `trickPurposeId` INTEGER NULL,
    ADD INDEX `CharacterCompanion_trickPurposeId_idx` (`trickPurposeId`);

-- AddForeignKey
ALTER TABLE `TrickPurpose` ADD CONSTRAINT `TrickPurpose_replacesPurposeId_fkey` FOREIGN KEY (`replacesPurposeId`) REFERENCES `TrickPurpose`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrickPurposeTrick` ADD CONSTRAINT `TrickPurposeTrick_purposeId_fkey` FOREIGN KEY (`purposeId`) REFERENCES `TrickPurpose`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrickPurposeTrick` ADD CONSTRAINT `TrickPurposeTrick_trickId_fkey` FOREIGN KEY (`trickId`) REFERENCES `Trick`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrickPurposeSourceMap` ADD CONSTRAINT `TrickPurposeSourceMap_trickPurposeId_fkey` FOREIGN KEY (`trickPurposeId`) REFERENCES `TrickPurpose`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrickPurposeSourceMap` ADD CONSTRAINT `TrickPurposeSourceMap_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterCompanion` ADD CONSTRAINT `CharacterCompanion_trickPurposeId_fkey` FOREIGN KEY (`trickPurposeId`) REFERENCES `TrickPurpose`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterCompanionSkill` ADD CONSTRAINT `CharacterCompanionSkill_characterCompanionId_fkey` FOREIGN KEY (`characterCompanionId`) REFERENCES `CharacterCompanion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterCompanionSkill` ADD CONSTRAINT `CharacterCompanionSkill_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterCompanionFeat` ADD CONSTRAINT `CharacterCompanionFeat_characterCompanionId_fkey` FOREIGN KEY (`characterCompanionId`) REFERENCES `CharacterCompanion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterCompanionFeat` ADD CONSTRAINT `CharacterCompanionFeat_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterSelectedForm` ADD CONSTRAINT `CharacterSelectedForm_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterSelectedForm` ADD CONSTRAINT `CharacterSelectedForm_featureId_fkey` FOREIGN KEY (`featureId`) REFERENCES `Feature`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterSelectedForm` ADD CONSTRAINT `CharacterSelectedForm_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
