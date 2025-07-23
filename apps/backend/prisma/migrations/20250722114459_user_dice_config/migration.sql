/*
  Warnings:

  - You are about to drop the column `diceScale` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `diceTheme` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `diceThemeColor` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `DiceBoxAdminConfig` ADD COLUMN `iconColor` VARCHAR(191) NULL,
    ADD COLUMN `isDefault` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `diceScale`,
    DROP COLUMN `diceTheme`,
    DROP COLUMN `diceThemeColor`,
    ADD COLUMN `diceConfigBase` INTEGER NULL;

-- CreateTable
CREATE TABLE `UserDiceConfigOverride` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `propertyName` VARCHAR(191) NOT NULL,
    `propertyValue` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `UserDiceConfigOverride_userId_propertyName_key`(`userId`, `propertyName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_diceConfigBase_fkey` FOREIGN KEY (`diceConfigBase`) REFERENCES `DiceBoxAdminConfig`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserDiceConfigOverride` ADD CONSTRAINT `UserDiceConfigOverride_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
