-- CreateTable
CREATE TABLE `DiceBoxTheme` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `systemName` VARCHAR(191) NOT NULL,
    `config` JSON NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DiceBoxTheme_systemName_key`(`systemName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
