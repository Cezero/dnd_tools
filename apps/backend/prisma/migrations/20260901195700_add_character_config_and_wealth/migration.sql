-- Split character config and currency off UserCharacter into dedicated tables.
-- The Jan 2026 dump (and current production) still stores allowVariantClasses /
-- isGestalt / ignoreLevelAdjustment and copper/silver/gold/platinum on UserCharacter.
-- Prisma already reads/writes CharacterConfig and CharacterWealth; without these
-- tables, character create-save fails with P2021.

-- CreateTable
CREATE TABLE `CharacterConfig` (
    `characterId` INTEGER NOT NULL,
    `allowVariantClasses` BOOLEAN NOT NULL DEFAULT false,
    `isGestalt` BOOLEAN NOT NULL DEFAULT false,
    `ignoreLevelAdjustment` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`characterId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CharacterWealth` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `characterId` INTEGER NOT NULL,
    `currencyId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `value` INTEGER NULL,
    `description` VARCHAR(255) NULL,

    INDEX `CharacterWealth_characterId_idx` (`characterId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CharacterConfig` ADD CONSTRAINT `CharacterConfig_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterWealth` ADD CONSTRAINT `CharacterWealth_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill from the leftover UserCharacter columns (CurrencyId: Copper=1, Silver=2, Gold=3, Platinum=4)
INSERT INTO `CharacterConfig` (`characterId`, `allowVariantClasses`, `isGestalt`, `ignoreLevelAdjustment`)
SELECT `id`, `allowVariantClasses`, `isGestalt`, `ignoreLevelAdjustment`
FROM `UserCharacter`;

INSERT INTO `CharacterWealth` (`characterId`, `currencyId`, `quantity`)
SELECT `id`, 1, `copper` FROM `UserCharacter` WHERE `copper` <> 0
UNION ALL
SELECT `id`, 2, `silver` FROM `UserCharacter` WHERE `silver` <> 0
UNION ALL
SELECT `id`, 3, `gold` FROM `UserCharacter` WHERE `gold` <> 0
UNION ALL
SELECT `id`, 4, `platinum` FROM `UserCharacter` WHERE `platinum` <> 0;

-- AlterTable
ALTER TABLE `UserCharacter`
    DROP COLUMN `allowVariantClasses`,
    DROP COLUMN `isGestalt`,
    DROP COLUMN `ignoreLevelAdjustment`,
    DROP COLUMN `copper`,
    DROP COLUMN `gold`,
    DROP COLUMN `platinum`,
    DROP COLUMN `silver`;
