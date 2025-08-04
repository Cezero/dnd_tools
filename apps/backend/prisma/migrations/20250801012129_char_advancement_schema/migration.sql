-- AlterTable
ALTER TABLE `UserCharacter` ADD COLUMN `xp` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `CharacterAdvancement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `characterId` INTEGER NOT NULL,
    `level` INTEGER NOT NULL,
    `version` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `secondaryClassId` INTEGER NULL,
    `hitPoints` INTEGER NOT NULL,
    `attributeId` INTEGER NULL,
    `notes` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `CharacterAdvancement_characterId_level_version_key`(`characterId`, `level`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdvancementSkill` (
    `advancementId` INTEGER NOT NULL,
    `skillId` INTEGER NOT NULL,
    `pointsSpent` INTEGER NOT NULL,

    PRIMARY KEY (`advancementId`, `skillId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdvancementFeat` (
    `advancementId` INTEGER NOT NULL,
    `featId` INTEGER NOT NULL,

    PRIMARY KEY (`advancementId`, `featId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdvancementSpell` (
    `advancementId` INTEGER NOT NULL,
    `spellId` INTEGER NOT NULL,

    PRIMARY KEY (`advancementId`, `spellId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AdvancementClassFeature` (
    `advancementId` INTEGER NOT NULL,
    `featureSlug` VARCHAR(191) NOT NULL,
    `choice` VARCHAR(191) NULL,
    `notes` TEXT NULL,

    PRIMARY KEY (`advancementId`, `featureSlug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CharacterSpellPreparation` (
    `characterId` INTEGER NOT NULL,
    `classId` INTEGER NOT NULL,
    `spellId` INTEGER NOT NULL,
    `spellLevel` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `prepKey` VARCHAR(191) NOT NULL,
    `slotType` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`characterId`, `prepKey`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpellPreparationMetamagic` (
    `characterId` INTEGER NOT NULL,
    `prepKey` VARCHAR(191) NOT NULL,
    `featId` INTEGER NOT NULL,

    PRIMARY KEY (`characterId`, `prepKey`, `featId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CharacterAdvancement` ADD CONSTRAINT `CharacterAdvancement_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterAdvancement` ADD CONSTRAINT `CharacterAdvancement_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterAdvancement` ADD CONSTRAINT `CharacterAdvancement_secondaryClassId_fkey` FOREIGN KEY (`secondaryClassId`) REFERENCES `Class`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdvancementSkill` ADD CONSTRAINT `AdvancementSkill_advancementId_fkey` FOREIGN KEY (`advancementId`) REFERENCES `CharacterAdvancement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdvancementSkill` ADD CONSTRAINT `AdvancementSkill_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdvancementFeat` ADD CONSTRAINT `AdvancementFeat_advancementId_fkey` FOREIGN KEY (`advancementId`) REFERENCES `CharacterAdvancement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdvancementFeat` ADD CONSTRAINT `AdvancementFeat_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdvancementSpell` ADD CONSTRAINT `AdvancementSpell_advancementId_fkey` FOREIGN KEY (`advancementId`) REFERENCES `CharacterAdvancement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdvancementSpell` ADD CONSTRAINT `AdvancementSpell_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdvancementClassFeature` ADD CONSTRAINT `AdvancementClassFeature_advancementId_fkey` FOREIGN KEY (`advancementId`) REFERENCES `CharacterAdvancement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdvancementClassFeature` ADD CONSTRAINT `AdvancementClassFeature_featureSlug_fkey` FOREIGN KEY (`featureSlug`) REFERENCES `ClassFeature`(`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterSpellPreparation` ADD CONSTRAINT `CharacterSpellPreparation_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterSpellPreparation` ADD CONSTRAINT `CharacterSpellPreparation_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterSpellPreparation` ADD CONSTRAINT `CharacterSpellPreparation_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpellPreparationMetamagic` ADD CONSTRAINT `SpellPreparationMetamagic_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpellPreparationMetamagic` ADD CONSTRAINT `SpellPreparationMetamagic_characterId_prepKey_fkey` FOREIGN KEY (`characterId`, `prepKey`) REFERENCES `CharacterSpellPreparation`(`characterId`, `prepKey`) ON DELETE RESTRICT ON UPDATE CASCADE;
