/*
  Warnings:

  - The primary key for the `AdvancementClassFeature` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `choice` on the `AdvancementClassFeature` table. All the data in the column will be lost.
  - You are about to drop the column `featureSlug` on the `AdvancementClassFeature` table. All the data in the column will be lost.
  - You are about to drop the column `spellProgression` on the `Class` table. All the data in the column will be lost.
  - You are about to drop the column `spellsKnown` on the `Class` table. All the data in the column will be lost.
  - The primary key for the `ClassFeature` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ClassFeatureProgression` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `aspect` on the `ClassFeatureProgression` table. All the data in the column will be lost.
  - You are about to drop the column `featureSlug` on the `ClassFeatureProgression` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `ClassFeatureProgression` table. All the data in the column will be lost.
  - You are about to drop the column `valueInt` on the `ClassFeatureProgression` table. All the data in the column will be lost.
  - You are about to drop the column `valueString` on the `ClassFeatureProgression` table. All the data in the column will be lost.
  - You are about to drop the `ClassFeatureMap` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `ClassFeature` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `featureId` to the `AdvancementClassFeature` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `ClassFeature` table without a default value. This is not possible if the table is not empty.
  - Added the required column `featureId` to the `ClassFeatureProgression` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id` to the `ClassFeatureProgression` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `AdvancementClassFeature` DROP FOREIGN KEY `AdvancementClassFeature_featureSlug_fkey`;

-- DropForeignKey
ALTER TABLE `ClassFeatureMap` DROP FOREIGN KEY `ClassFeatureMap_classId_fkey`;

-- DropForeignKey
ALTER TABLE `ClassFeatureMap` DROP FOREIGN KEY `ClassFeatureMap_featureSlug_fkey`;

-- DropForeignKey
ALTER TABLE `ClassFeatureProgression` DROP FOREIGN KEY `ClassFeatureProgression_featureSlug_fkey`;

-- DropIndex
DROP INDEX `AdvancementClassFeature_featureSlug_fkey` ON `AdvancementClassFeature`;

-- AlterTable
ALTER TABLE `AdvancementClassFeature` DROP PRIMARY KEY,
    DROP COLUMN `choice`,
    DROP COLUMN `featureSlug`,
    ADD COLUMN `featureId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`advancementId`, `featureId`);

-- AlterTable
ALTER TABLE `Class` DROP COLUMN `spellProgression`,
    DROP COLUMN `spellsKnown`,
    ADD COLUMN `castingType` ENUM('Prepared', 'Spontaneous') NULL;

-- AlterTable
ALTER TABLE `ClassFeature` DROP PRIMARY KEY,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    MODIFY `description` VARCHAR(191) NOT NULL,
    ALTER COLUMN `name` DROP DEFAULT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `ClassFeatureProgression` DROP PRIMARY KEY,
    DROP COLUMN `aspect`,
    DROP COLUMN `featureSlug`,
    DROP COLUMN `note`,
    DROP COLUMN `valueInt`,
    DROP COLUMN `valueString`,
    ADD COLUMN `featureId` INTEGER NOT NULL,
    ADD COLUMN `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- DropTable
DROP TABLE `ClassFeatureMap`;

-- CreateTable
CREATE TABLE `ClassFeatureModifier` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `featureId` INTEGER NOT NULL,
    `modifierType` INTEGER NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `appliesTo` VARCHAR(191) NULL,
    `appliesIfChoiceKey` VARCHAR(191) NULL,
    `appliesIfChoiceValue` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClassFeatureSpecialEffect` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `progressionId` INTEGER NOT NULL,
    `effectType` INTEGER NOT NULL,
    `key` VARCHAR(191) NULL,
    `value` VARCHAR(191) NULL,
    `numericValue` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClassFeatureChoice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `progressionId` INTEGER NOT NULL,
    `label` VARCHAR(191) NULL,
    `pickCount` INTEGER NULL,
    `choiceType` ENUM('Feat', 'ClassFeature') NOT NULL,
    `featId` INTEGER NULL,
    `chosenFeatureId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpellcastingProgression` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `classId` INTEGER NOT NULL,
    `casterLevel` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpellcastingSlot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `progressionId` INTEGER NOT NULL,
    `spellLevel` INTEGER NOT NULL,
    `slotsPerDay` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpellcastingLink` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `featureProgressionId` INTEGER NOT NULL,
    `progressionId` INTEGER NOT NULL,
    `inheritedFrom` VARCHAR(191) NULL,
    `levelOffset` INTEGER NULL,

    UNIQUE INDEX `SpellcastingLink_featureProgressionId_key`(`featureProgressionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CharacterFeatureChoice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `characterId` INTEGER NOT NULL,
    `featureId` INTEGER NOT NULL,
    `advancementId` INTEGER NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `CharacterFeatureChoice_advancementId_featureId_key_key`(`advancementId`, `featureId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `ClassFeature_slug_key` ON `ClassFeature`(`slug`);

-- AddForeignKey
ALTER TABLE `ClassFeatureProgression` ADD CONSTRAINT `ClassFeatureProgression_featureId_fkey` FOREIGN KEY (`featureId`) REFERENCES `ClassFeature`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassFeatureModifier` ADD CONSTRAINT `ClassFeatureModifier_featureId_fkey` FOREIGN KEY (`featureId`) REFERENCES `ClassFeature`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassFeatureSpecialEffect` ADD CONSTRAINT `ClassFeatureSpecialEffect_progressionId_fkey` FOREIGN KEY (`progressionId`) REFERENCES `ClassFeatureProgression`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassFeatureChoice` ADD CONSTRAINT `ClassFeatureChoice_progressionId_fkey` FOREIGN KEY (`progressionId`) REFERENCES `ClassFeatureProgression`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassFeatureChoice` ADD CONSTRAINT `ClassFeatureChoice_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassFeatureChoice` ADD CONSTRAINT `ClassFeatureChoice_chosenFeatureId_fkey` FOREIGN KEY (`chosenFeatureId`) REFERENCES `ClassFeature`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpellcastingProgression` ADD CONSTRAINT `SpellcastingProgression_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpellcastingSlot` ADD CONSTRAINT `SpellcastingSlot_progressionId_fkey` FOREIGN KEY (`progressionId`) REFERENCES `SpellcastingProgression`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpellcastingLink` ADD CONSTRAINT `SpellcastingLink_featureProgressionId_fkey` FOREIGN KEY (`featureProgressionId`) REFERENCES `ClassFeatureProgression`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpellcastingLink` ADD CONSTRAINT `SpellcastingLink_progressionId_fkey` FOREIGN KEY (`progressionId`) REFERENCES `SpellcastingProgression`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterFeatureChoice` ADD CONSTRAINT `CharacterFeatureChoice_featureId_fkey` FOREIGN KEY (`featureId`) REFERENCES `ClassFeature`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterFeatureChoice` ADD CONSTRAINT `CharacterFeatureChoice_advancementId_fkey` FOREIGN KEY (`advancementId`) REFERENCES `CharacterAdvancement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AdvancementClassFeature` ADD CONSTRAINT `AdvancementClassFeature_featureId_fkey` FOREIGN KEY (`featureId`) REFERENCES `ClassFeature`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
