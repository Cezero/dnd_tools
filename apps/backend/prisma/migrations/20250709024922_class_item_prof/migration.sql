/*
  Warnings:

  - You are about to drop the column `cost` on the `Armor` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Armor` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Armor` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `Armor` table. All the data in the column will be lost.
  - You are about to drop the column `cost` on the `Weapon` table. All the data in the column will be lost.
  - You are about to drop the column `damageTypeId` on the `Weapon` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Weapon` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Weapon` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `Weapon` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Armor` DROP COLUMN `cost`,
    DROP COLUMN `description`,
    DROP COLUMN `name`,
    DROP COLUMN `weight`,
    MODIFY `id` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Weapon` DROP COLUMN `cost`,
    DROP COLUMN `damageTypeId`,
    DROP COLUMN `description`,
    DROP COLUMN `name`,
    DROP COLUMN `weight`,
    ADD COLUMN `attackBonus` INTEGER NULL,
    ADD COLUMN `damageType` VARCHAR(191) NULL,
    MODIFY `id` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `ClassProficiencies` (
    `classId` INTEGER NOT NULL,
    `featId` INTEGER NOT NULL,
    `itemId` INTEGER NULL,

    PRIMARY KEY (`classId`, `featId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Item` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `description` TEXT NULL,
    `type` ENUM('ARMOR', 'WEAPON', 'GEAR') NOT NULL,
    `cost` DECIMAL(5, 2) NULL,
    `weight` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MagicProperty` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `enhancement` INTEGER NULL,
    `extraDamage` VARCHAR(191) NULL,
    `extraDamageType` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ItemToMagic` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ItemToMagic_AB_unique`(`A`, `B`),
    INDEX `_ItemToMagic_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ClassProficiencies` ADD CONSTRAINT `ClassProficiencies_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClassProficiencies` ADD CONSTRAINT `ClassProficiencies_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Armor` ADD CONSTRAINT `Armor_id_fkey` FOREIGN KEY (`id`) REFERENCES `Item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Weapon` ADD CONSTRAINT `Weapon_id_fkey` FOREIGN KEY (`id`) REFERENCES `Item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ItemToMagic` ADD CONSTRAINT `_ItemToMagic_A_fkey` FOREIGN KEY (`A`) REFERENCES `Item`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ItemToMagic` ADD CONSTRAINT `_ItemToMagic_B_fkey` FOREIGN KEY (`B`) REFERENCES `MagicProperty`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
