/*
  Warnings:

  - You are about to alter the column `alignment` on the `ReferenceTableColumn` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `ReferenceTableCell` ALTER COLUMN `tableSlug` DROP DEFAULT;

-- AlterTable
ALTER TABLE `ReferenceTableColumn` MODIFY `alignment` ENUM('left', 'center', 'right') NULL;

-- AddForeignKey
ALTER TABLE `SpellComponentMap` ADD CONSTRAINT `SpellComponentMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
