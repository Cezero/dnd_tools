-- AlterTable
ALTER TABLE `Weapon` ADD COLUMN `double` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `nonlethal` BOOLEAN NOT NULL DEFAULT false;
