/*
  Warnings:

  - The primary key for the `ClassFeature` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `classId` on the `ClassFeature` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `ClassFeature` table. All the data in the column will be lost.
  - You are about to drop the column `level` on the `ClassFeature` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `ClassFeature` table. All the data in the column will be lost.
  - You are about to drop the `ClassSpellLevel` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `slug` to the `ClassFeature` table without a default value. This is not possible if the table is not empty.
  - Made the column `description` on table `ClassFeature` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `ClassFeature` DROP FOREIGN KEY `ClassFeature_classId_fkey`;

-- DropForeignKey
ALTER TABLE `ClassSpellLevel` DROP FOREIGN KEY `ClassSpellLevel_classId_fkey`;

-- DropIndex
DROP INDEX `ClassFeature_classId_fkey` ON `ClassFeature`;

-- AlterTable
ALTER TABLE `ClassFeature` DROP PRIMARY KEY,
    DROP COLUMN `classId`,
    DROP COLUMN `id`,
    DROP COLUMN `level`,
    DROP COLUMN `name`,
    ADD COLUMN `slug` VARCHAR(191) NOT NULL,
    MODIFY `description` TEXT NOT NULL,
    ADD PRIMARY KEY (`slug`);

-- DropTable
DROP TABLE `ClassSpellLevel`;

-- CreateTable
CREATE TABLE `ClassFeatureMap` (
    `classId` INTEGER NOT NULL,
    `featureSlug` VARCHAR(191) NOT NULL,
    `level` INTEGER NOT NULL,

    PRIMARY KEY (`classId`, `featureSlug`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ClassSpellProgression` (
    `classId` INTEGER NOT NULL,
    `level` INTEGER NOT NULL,
    `spellLevel` INTEGER NOT NULL,
    `spellSlots` INTEGER NOT NULL,

    PRIMARY KEY (`classId`, `level`, `spellLevel`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ClassFeatureMap` ADD CONSTRAINT `ClassFeatureMap_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassFeatureMap` ADD CONSTRAINT `ClassFeatureMap_featureSlug_fkey` FOREIGN KEY (`featureSlug`) REFERENCES `ClassFeature`(`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassSpellProgression` ADD CONSTRAINT `ClassSpellProgression_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
