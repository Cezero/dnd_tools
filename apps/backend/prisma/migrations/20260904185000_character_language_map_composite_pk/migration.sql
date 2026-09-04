-- CharacterLanguageMap: dump/baseline used surrogate `id` + unique (characterId, languageId).
-- schema.prisma uses @@id([characterId, languageId]) and onDelete: Cascade.
-- Live table has 18 rows; the unique key already matches the new primary key.

-- DropForeignKey
ALTER TABLE `CharacterLanguageMap` DROP FOREIGN KEY `CharacterLanguageMap_characterId_fkey`;

-- DropIndex
DROP INDEX `CharacterLanguageMap_characterId_languageId_key` ON `CharacterLanguageMap`;

-- AlterTable
ALTER TABLE `CharacterLanguageMap` DROP PRIMARY KEY,
    DROP COLUMN `id`,
    ADD PRIMARY KEY (`characterId`, `languageId`);

-- AddForeignKey
ALTER TABLE `CharacterLanguageMap` ADD CONSTRAINT `CharacterLanguageMap_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
