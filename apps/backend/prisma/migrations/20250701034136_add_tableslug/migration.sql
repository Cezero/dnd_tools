-- AlterTable
ALTER TABLE `ReferenceTableCell` ADD COLUMN `tableSlug` VARCHAR(191) NOT NULL DEFAULT '';

-- AddForeignKey
ALTER TABLE `ReferenceTableCell` ADD CONSTRAINT `ReferenceTableCell_tableSlug_fkey` FOREIGN KEY (`tableSlug`) REFERENCES `ReferenceTable`(`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;
