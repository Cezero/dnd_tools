/*
  Warnings:

  - The primary key for the `RaceTraitMap` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `traitId` on the `RaceTraitMap` table. All the data in the column will be lost.
  - Added the required column `traitSlug` to the `RaceTraitMap` table without a default value. This is not possible if the table is not empty.
  - Made the column `value` on table `RaceTraitMap` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `RaceTraitMap` DROP FOREIGN KEY `RaceTraitMap_traitId_fkey`;

-- DropIndex
DROP INDEX `RaceTraitMap_traitId_fkey` ON `RaceTraitMap`;

-- AlterTable
ALTER TABLE `RaceTraitMap` DROP PRIMARY KEY,
    DROP COLUMN `traitId`,
    ADD COLUMN `traitSlug` VARCHAR(191) NOT NULL,
    MODIFY `value` INTEGER NOT NULL,
    ADD PRIMARY KEY (`raceId`, `traitSlug`);

-- AddForeignKey
ALTER TABLE `RaceTraitMap` ADD CONSTRAINT `RaceTraitMap_traitSlug_fkey` FOREIGN KEY (`traitSlug`) REFERENCES `RaceTrait`(`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;
