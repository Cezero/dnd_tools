/*
  Warnings:

  - You are about to drop the `MagicProperty` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ItemToMagic` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_ItemToMagic` DROP FOREIGN KEY `_ItemToMagic_A_fkey`;

-- DropForeignKey
ALTER TABLE `_ItemToMagic` DROP FOREIGN KEY `_ItemToMagic_B_fkey`;

-- DropTable
DROP TABLE `MagicProperty`;

-- DropTable
DROP TABLE `_ItemToMagic`;

-- CreateTable
CREATE TABLE `ItemProperty` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `type` ENUM('Material', 'Enhancement', 'SpecialAbility', 'Structural') NOT NULL,
    `flatCostModifier` INTEGER NULL,
    `costMultiplier` DOUBLE NULL,
    `costFormula` VARCHAR(191) NULL,
    `enhancementBonusValue` INTEGER NULL,
    `bonusEquivalentModifier` INTEGER NULL,
    `exclusiveMaterial` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemPropertyAppliesTo` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `propertyId` INTEGER NOT NULL,
    `itemType` ENUM('Weapon', 'Armor', 'Shield', 'MountArmor', 'Ammunition') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemPropertyIncompatibility` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `propertyAId` INTEGER NOT NULL,
    `propertyBId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemTemplate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `itemId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ItemTemplateProperty` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `templateId` INTEGER NOT NULL,
    `propertyId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CharacterItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NULL,
    `characterId` INTEGER NOT NULL,
    `baseItemId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CharacterItemProperty` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `characterItemId` INTEGER NOT NULL,
    `propertyId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ItemPropertyAppliesTo` ADD CONSTRAINT `ItemPropertyAppliesTo_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `ItemProperty`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemPropertyIncompatibility` ADD CONSTRAINT `ItemPropertyIncompatibility_propertyAId_fkey` FOREIGN KEY (`propertyAId`) REFERENCES `ItemProperty`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemPropertyIncompatibility` ADD CONSTRAINT `ItemPropertyIncompatibility_propertyBId_fkey` FOREIGN KEY (`propertyBId`) REFERENCES `ItemProperty`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemTemplate` ADD CONSTRAINT `ItemTemplate_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemTemplateProperty` ADD CONSTRAINT `ItemTemplateProperty_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `ItemTemplate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ItemTemplateProperty` ADD CONSTRAINT `ItemTemplateProperty_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `ItemProperty`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterItem` ADD CONSTRAINT `CharacterItem_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterItem` ADD CONSTRAINT `CharacterItem_baseItemId_fkey` FOREIGN KEY (`baseItemId`) REFERENCES `Item`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterItemProperty` ADD CONSTRAINT `CharacterItemProperty_characterItemId_fkey` FOREIGN KEY (`characterItemId`) REFERENCES `CharacterItem`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterItemProperty` ADD CONSTRAINT `CharacterItemProperty_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `ItemProperty`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
