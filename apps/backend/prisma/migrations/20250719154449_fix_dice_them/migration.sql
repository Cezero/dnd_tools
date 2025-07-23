/*
  Warnings:

  - You are about to drop the `DiceBoxTheme` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `DiceBoxTheme`;

-- CreateTable
CREATE TABLE `DiceBoxAdminConfig` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `gravity` DOUBLE NOT NULL DEFAULT 1,
    `mass` DOUBLE NOT NULL DEFAULT 1,
    `friction` DOUBLE NOT NULL DEFAULT 0.8,
    `restitution` DOUBLE NOT NULL DEFAULT 0,
    `angularDamping` DOUBLE NOT NULL DEFAULT 0.4,
    `linearDamping` DOUBLE NOT NULL DEFAULT 0.4,
    `spinForce` DOUBLE NOT NULL DEFAULT 4,
    `throwForce` DOUBLE NOT NULL DEFAULT 5,
    `startingHeight` INTEGER NOT NULL DEFAULT 8,
    `settleTimeout` INTEGER NOT NULL DEFAULT 5000,
    `lightIntensity` DOUBLE NOT NULL DEFAULT 1,
    `enableShadows` BOOLEAN NOT NULL DEFAULT true,
    `shadowTransparency` DOUBLE NOT NULL DEFAULT 0.8,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'default',
    `themeColor` VARCHAR(191) NOT NULL DEFAULT '#2e8555',
    `scale` DOUBLE NOT NULL DEFAULT 6,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
