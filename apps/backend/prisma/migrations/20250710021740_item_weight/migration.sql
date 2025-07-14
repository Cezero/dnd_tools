/*
  Warnings:

  - You are about to alter the column `weight` on the `Item` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(5,2)`.

*/
-- AlterTable
ALTER TABLE `Item` MODIFY `weight` DECIMAL(5, 2) NULL;
