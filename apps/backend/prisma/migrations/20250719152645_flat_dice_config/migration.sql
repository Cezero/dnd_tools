/*
  Warnings:

  - You are about to drop the column `config` on the `DiceBoxTheme` table. All the data in the column will be lost.
  - Added the required column `diceAvailable` to the `DiceBoxTheme` table without a default value. This is not possible if the table is not empty.
  - Added the required column `materialType` to the `DiceBoxTheme` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `DiceBoxTheme` table without a default value. This is not possible if the table is not empty.
  - Added the required column `themeColor` to the `DiceBoxTheme` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `DiceBoxTheme` DROP COLUMN `config`,
    ADD COLUMN `author` VARCHAR(191) NULL,
    ADD COLUMN `bumpLevel` DOUBLE NULL,
    ADD COLUMN `bumpTexture` VARCHAR(191) NULL,
    ADD COLUMN `d4FaceDown` BOOLEAN NULL DEFAULT false,
    ADD COLUMN `diceAvailable` VARCHAR(191) NOT NULL,
    ADD COLUMN `diffuseLevel` DOUBLE NULL,
    ADD COLUMN `diffuseTexture` VARCHAR(191) NULL,
    ADD COLUMN `diffuseTextureDark` VARCHAR(191) NULL,
    ADD COLUMN `diffuseTextureLight` VARCHAR(191) NULL,
    ADD COLUMN `extends` VARCHAR(191) NULL,
    ADD COLUMN `materialType` VARCHAR(191) NOT NULL,
    ADD COLUMN `meshFile` VARCHAR(191) NULL,
    ADD COLUMN `meshName` VARCHAR(191) NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `specularPower` DOUBLE NULL,
    ADD COLUMN `specularTexture` VARCHAR(191) NULL,
    ADD COLUMN `themeColor` VARCHAR(191) NOT NULL,
    ADD COLUMN `thumbnail` VARCHAR(191) NULL,
    ADD COLUMN `version` INTEGER NULL;
