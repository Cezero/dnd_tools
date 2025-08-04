/*
  Warnings:

  - Added the required column `classFeatureChoiceId` to the `CharacterFeatureChoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `choiceBehavior` to the `ClassFeatureChoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `CharacterFeatureChoice` ADD COLUMN `choiceIndex` INTEGER NULL,
    ADD COLUMN `classFeatureChoiceId` INTEGER NOT NULL,
    MODIFY `key` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `ClassFeatureChoice` ADD COLUMN `choiceBehavior` ENUM('Single', 'Multiple', 'Allocation') NOT NULL;

-- AddForeignKey
ALTER TABLE `CharacterFeatureChoice` ADD CONSTRAINT `CharacterFeatureChoice_classFeatureChoiceId_fkey` FOREIGN KEY (`classFeatureChoiceId`) REFERENCES `ClassFeatureChoice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
