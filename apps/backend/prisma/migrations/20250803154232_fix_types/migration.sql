/*
  Warnings:

  - You are about to drop the column `featureId` on the `CharacterFeatureChoice` table. All the data in the column will be lost.
  - You are about to drop the column `featureId` on the `ClassFeatureModifier` table. All the data in the column will be lost.
  - You are about to drop the `AdvancementClassFeature` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[advancementId,progressionId,key]` on the table `CharacterFeatureChoice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `progressionId` to the `CharacterFeatureChoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `featureProgressionId` to the `ClassFeatureModifier` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `AdvancementClassFeature` DROP FOREIGN KEY `AdvancementClassFeature_advancementId_fkey`;

-- DropForeignKey
ALTER TABLE `AdvancementClassFeature` DROP FOREIGN KEY `AdvancementClassFeature_featureId_fkey`;

-- DropForeignKey
ALTER TABLE `CharacterFeatureChoice` DROP FOREIGN KEY `CharacterFeatureChoice_advancementId_fkey`;

-- DropForeignKey
ALTER TABLE `CharacterFeatureChoice` DROP FOREIGN KEY `CharacterFeatureChoice_featureId_fkey`;

-- DropForeignKey
ALTER TABLE `ClassFeatureModifier` DROP FOREIGN KEY `ClassFeatureModifier_featureId_fkey`;

-- DropIndex
DROP INDEX `CharacterFeatureChoice_advancementId_featureId_key_key` ON `CharacterFeatureChoice`;

-- DropIndex
DROP INDEX `CharacterFeatureChoice_featureId_fkey` ON `CharacterFeatureChoice`;

-- DropIndex
DROP INDEX `ClassFeatureModifier_featureId_fkey` ON `ClassFeatureModifier`;

-- AlterTable
ALTER TABLE `CharacterFeatureChoice` DROP COLUMN `featureId`,
    ADD COLUMN `progressionId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `ClassFeatureModifier` DROP COLUMN `featureId`,
    ADD COLUMN `featureProgressionId` INTEGER NOT NULL;

-- DropTable
DROP TABLE `AdvancementClassFeature`;

-- CreateIndex
CREATE UNIQUE INDEX `CharacterFeatureChoice_advancementId_progressionId_key_key` ON `CharacterFeatureChoice`(`advancementId`, `progressionId`, `key`);

-- AddForeignKey
ALTER TABLE `CharacterFeatureChoice` ADD CONSTRAINT `CharacterFeatureChoice_progressionId_fkey` FOREIGN KEY (`progressionId`) REFERENCES `ClassFeatureProgression`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
