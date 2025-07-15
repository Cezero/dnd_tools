/*
  Warnings:

  - The primary key for the `ClassProficiencies` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Made the column `itemId` on table `ClassProficiencies` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `ClassProficiencies` DROP PRIMARY KEY,
    MODIFY `itemId` INTEGER NOT NULL,
    ADD PRIMARY KEY (`classId`, `featId`, `itemId`);

-- CreateTable
CREATE TABLE `ClassFeatureProgression` (
    `featureSlug` VARCHAR(191) NOT NULL,
    `classId` INTEGER NOT NULL,
    `level` INTEGER NOT NULL,
    `aspect` VARCHAR(191) NOT NULL,
    `valueInt` INTEGER NULL,
    `valueString` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,

    PRIMARY KEY (`featureSlug`, `classId`, `level`, `aspect`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ClassProficiencies` ADD CONSTRAINT `ClassProficiencies_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassFeatureProgression` ADD CONSTRAINT `ClassFeatureProgression_featureSlug_fkey` FOREIGN KEY (`featureSlug`) REFERENCES `ClassFeature`(`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassFeatureProgression` ADD CONSTRAINT `ClassFeatureProgression_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
