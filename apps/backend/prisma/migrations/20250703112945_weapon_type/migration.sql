/*
  Warnings:

  - Added the required column `type` to the `Weapon` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Weapon` ADD COLUMN `type` INTEGER NOT NULL;
