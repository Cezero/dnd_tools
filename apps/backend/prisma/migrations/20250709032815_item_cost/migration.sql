/*
  Warnings:

  - You are about to alter the column `cost` on the `Item` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `Decimal(10,2)`.

*/
-- AlterTable
ALTER TABLE `Item` MODIFY `cost` DECIMAL(10, 2) NULL;
