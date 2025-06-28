-- CreateTable
CREATE TABLE `Class` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `abbreviation` VARCHAR(191) NOT NULL,
    `editionId` INTEGER NULL,
    `isPrestige` BOOLEAN NOT NULL DEFAULT false,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `canCastSpells` BOOLEAN NOT NULL DEFAULT false,
    `hitDie` INTEGER NOT NULL DEFAULT 1,
    `description` VARCHAR(191) NULL,
    `skillPoints` INTEGER NOT NULL,
    `castingAbilityId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClassFeature` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `classId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `level` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClassSpellLevel` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `classId` INTEGER NOT NULL,
    `spellLevel` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClassLevelAttribute` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `classId` INTEGER NOT NULL,
    `baseAttackBonus` INTEGER NOT NULL,
    `fortSave` INTEGER NOT NULL,
    `refSave` INTEGER NOT NULL,
    `willSave` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClassSkillMap` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `classId` INTEGER NOT NULL,
    `skillId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClassSourceMap` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `classId` INTEGER NOT NULL,
    `bookId` INTEGER NOT NULL,
    `pageNumber` INTEGER NULL,
    `sourceBookId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpellLevelMap` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `classId` INTEGER NOT NULL,
    `spellId` INTEGER NOT NULL,
    `level` INTEGER NOT NULL,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Spell` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `summary` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `castingTime` VARCHAR(191) NULL,
    `range` VARCHAR(191) NULL,
    `rangeTypeId` INTEGER NULL,
    `rangeValue` VARCHAR(191) NULL,
    `area` VARCHAR(191) NULL,
    `duration` VARCHAR(191) NULL,
    `savingThrow` VARCHAR(191) NULL,
    `spellResistance` VARCHAR(191) NULL,
    `editionId` INTEGER NOT NULL,
    `baseLevel` INTEGER NOT NULL,
    `effect` VARCHAR(191) NULL,
    `target` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpellDescriptorMap` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spellId` INTEGER NOT NULL,
    `descriptorId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpellSchoolMap` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spellId` INTEGER NOT NULL,
    `schoolId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpellSourceMap` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spellId` INTEGER NOT NULL,
    `bookId` INTEGER NOT NULL,
    `pageNumber` INTEGER NULL,
    `sourceBookId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpellSubschoolMap` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spellId` INTEGER NOT NULL,
    `schoolId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpellComponentMap` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `spellId` INTEGER NOT NULL,
    `componentId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Skill` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `abilityId` INTEGER NOT NULL DEFAULT 1,
    `checkDescription` VARCHAR(191) NULL,
    `actionDescription` VARCHAR(191) NULL,
    `retryTypeId` INTEGER NULL,
    `retryDescription` VARCHAR(191) NULL,
    `specialNotes` VARCHAR(191) NULL,
    `synergyNotes` VARCHAR(191) NULL,
    `untrainedNotes` VARCHAR(191) NULL,
    `affectedByArmor` BOOLEAN NOT NULL DEFAULT false,
    `description` VARCHAR(191) NULL,
    `trainedOnly` BOOLEAN NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Feat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `typeId` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `benefit` VARCHAR(191) NULL,
    `normalEffect` VARCHAR(191) NULL,
    `specialEffect` VARCHAR(191) NULL,
    `prerequisites` VARCHAR(191) NULL,
    `repeatable` BOOLEAN NULL,
    `fighterBonus` BOOLEAN NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeatBenefitMap` (
    `featId` INTEGER NOT NULL,
    `typeId` INTEGER NOT NULL,
    `referenceId` INTEGER NULL,
    `amount` INTEGER NULL,
    `index` INTEGER NOT NULL,

    PRIMARY KEY (`featId`, `index`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FeatPrerequisiteMap` (
    `featId` INTEGER NOT NULL,
    `typeId` INTEGER NOT NULL,
    `referenceId` INTEGER NULL,
    `amount` INTEGER NULL,
    `index` INTEGER NOT NULL,

    PRIMARY KEY (`featId`, `index`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Race` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `editionId` INTEGER NULL,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `description` VARCHAR(191) NULL,
    `sizeId` INTEGER NOT NULL DEFAULT 5,
    `speed` INTEGER NOT NULL DEFAULT 30,
    `favoredClassId` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RaceTrait` (
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `hasValue` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RaceTraitMap` (
    `raceId` INTEGER NOT NULL,
    `traitId` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NULL,

    PRIMARY KEY (`raceId`, `traitId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RaceAbilityAdjustment` (
    `raceId` INTEGER NOT NULL,
    `abilityId` INTEGER NOT NULL,
    `value` INTEGER NOT NULL,

    PRIMARY KEY (`raceId`, `abilityId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RaceLanguageMap` (
    `raceId` INTEGER NOT NULL,
    `languageId` INTEGER NOT NULL,
    `isAutomatic` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`raceId`, `languageId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RaceSourceMap` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `raceId` INTEGER NOT NULL,
    `bookId` INTEGER NOT NULL,
    `pageNumber` INTEGER NULL,
    `sourceBookId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Armor` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `category` INTEGER NOT NULL,
    `cost` DECIMAL(5, 2) NULL,
    `bonus` INTEGER NULL,
    `dexterityCap` INTEGER NULL,
    `checkPenalty` INTEGER NULL,
    `arcaneSpellFailure` INTEGER NULL,
    `speedCapThirty` INTEGER NULL,
    `speedCapTwenty` INTEGER NULL,
    `weight` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Weapon` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `category` INTEGER NOT NULL,
    `cost` DECIMAL(5, 2) NULL,
    `damageSmall` VARCHAR(191) NULL,
    `damageMedium` VARCHAR(191) NULL,
    `critical` VARCHAR(191) NULL,
    `range` VARCHAR(191) NULL,
    `weight` DECIMAL(5, 2) NULL,
    `damageTypeId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SourceBook` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `abbreviation` VARCHAR(191) NOT NULL,
    `releaseDate` DATETIME(3) NULL,
    `editionId` INTEGER NULL,
    `description` VARCHAR(191) NULL,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReferenceTable` (
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,

    PRIMARY KEY (`slug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReferenceTableColumn` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tableSlug` VARCHAR(191) NOT NULL,
    `columnIndex` INTEGER NOT NULL,
    `header` VARCHAR(191) NOT NULL,
    `span` INTEGER NULL,
    `alignment` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReferenceTableRow` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tableSlug` VARCHAR(191) NOT NULL,
    `rowIndex` INTEGER NOT NULL,
    `label` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReferenceTableCell` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rowId` INTEGER NOT NULL,
    `columnId` INTEGER NOT NULL,
    `value` VARCHAR(191) NULL,
    `colSpan` INTEGER NULL,
    `rowSpan` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserCharacter` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `raceId` INTEGER NOT NULL,
    `alignmentId` INTEGER NOT NULL,
    `age` INTEGER NULL,
    `height` INTEGER NULL,
    `weight` INTEGER NULL,
    `eyes` VARCHAR(191) NULL,
    `hair` VARCHAR(191) NULL,
    `gender` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserCharacterAttribute` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `characterId` INTEGER NOT NULL,
    `attributeId` INTEGER NOT NULL,
    `value` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `isAdmin` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `preferredEditionId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ClassFeature` ADD CONSTRAINT `ClassFeature_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassSpellLevel` ADD CONSTRAINT `ClassSpellLevel_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassLevelAttribute` ADD CONSTRAINT `ClassLevelAttribute_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassSkillMap` ADD CONSTRAINT `ClassSkillMap_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassSkillMap` ADD CONSTRAINT `ClassSkillMap_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassSourceMap` ADD CONSTRAINT `ClassSourceMap_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassSourceMap` ADD CONSTRAINT `ClassSourceMap_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpellLevelMap` ADD CONSTRAINT `SpellLevelMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpellLevelMap` ADD CONSTRAINT `SpellLevelMap_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpellDescriptorMap` ADD CONSTRAINT `SpellDescriptorMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpellSchoolMap` ADD CONSTRAINT `SpellSchoolMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpellSourceMap` ADD CONSTRAINT `SpellSourceMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpellSourceMap` ADD CONSTRAINT `SpellSourceMap_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpellSubschoolMap` ADD CONSTRAINT `SpellSubschoolMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeatBenefitMap` ADD CONSTRAINT `FeatBenefitMap_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FeatPrerequisiteMap` ADD CONSTRAINT `FeatPrerequisiteMap_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RaceTraitMap` ADD CONSTRAINT `RaceTraitMap_raceId_fkey` FOREIGN KEY (`raceId`) REFERENCES `Race`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RaceTraitMap` ADD CONSTRAINT `RaceTraitMap_traitId_fkey` FOREIGN KEY (`traitId`) REFERENCES `RaceTrait`(`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RaceAbilityAdjustment` ADD CONSTRAINT `RaceAbilityAdjustment_raceId_fkey` FOREIGN KEY (`raceId`) REFERENCES `Race`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RaceLanguageMap` ADD CONSTRAINT `RaceLanguageMap_raceId_fkey` FOREIGN KEY (`raceId`) REFERENCES `Race`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RaceSourceMap` ADD CONSTRAINT `RaceSourceMap_raceId_fkey` FOREIGN KEY (`raceId`) REFERENCES `Race`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RaceSourceMap` ADD CONSTRAINT `RaceSourceMap_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReferenceTableColumn` ADD CONSTRAINT `ReferenceTableColumn_tableSlug_fkey` FOREIGN KEY (`tableSlug`) REFERENCES `ReferenceTable`(`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReferenceTableRow` ADD CONSTRAINT `ReferenceTableRow_tableSlug_fkey` FOREIGN KEY (`tableSlug`) REFERENCES `ReferenceTable`(`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReferenceTableCell` ADD CONSTRAINT `ReferenceTableCell_columnId_fkey` FOREIGN KEY (`columnId`) REFERENCES `ReferenceTableColumn`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReferenceTableCell` ADD CONSTRAINT `ReferenceTableCell_rowId_fkey` FOREIGN KEY (`rowId`) REFERENCES `ReferenceTableRow`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCharacter` ADD CONSTRAINT `UserCharacter_raceId_fkey` FOREIGN KEY (`raceId`) REFERENCES `Race`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCharacter` ADD CONSTRAINT `UserCharacter_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserCharacterAttribute` ADD CONSTRAINT `UserCharacterAttribute_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
