/*
  Warnings:

  - You are about to drop the `ClassLevelAttribute` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ClassSpellProgression` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `ClassLevelAttribute` DROP FOREIGN KEY `ClassLevelAttribute_classId_fkey`;

-- DropForeignKey
ALTER TABLE `ClassSpellProgression` DROP FOREIGN KEY `ClassSpellProgression_classId_fkey`;

-- AlterTable
ALTER TABLE `Class` ADD COLUMN `babProgression` ENUM('good', 'average', 'poor') NOT NULL DEFAULT 'poor',
    ADD COLUMN `fortProgression` ENUM('good', 'average', 'poor') NOT NULL DEFAULT 'poor',
    ADD COLUMN `refProgression` ENUM('good', 'average', 'poor') NOT NULL DEFAULT 'poor',
    ADD COLUMN `spellProgression` ENUM('bard', 'devine', 'hybrid', 'sorcerer', 'wizard') NULL,
    ADD COLUMN `willProgression` ENUM('good', 'average', 'poor') NOT NULL DEFAULT 'poor';

-- DropTable
DROP TABLE `ClassLevelAttribute`;

-- DropTable
DROP TABLE `ClassSpellProgression`;
