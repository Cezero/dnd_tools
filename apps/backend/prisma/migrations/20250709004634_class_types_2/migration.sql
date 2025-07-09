/*
  Warnings:

  - You are about to alter the column `babProgression` on the `Class` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(1))` to `Int`.
  - You are about to alter the column `fortProgression` on the `Class` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(2))` to `Int`.
  - You are about to alter the column `refProgression` on the `Class` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(3))` to `Int`.
  - You are about to alter the column `spellProgression` on the `Class` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(4))` to `Int`.
  - You are about to alter the column `willProgression` on the `Class` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(5))` to `Int`.

*/
-- AlterTable
ALTER TABLE `Class` MODIFY `babProgression` INTEGER NOT NULL,
    MODIFY `fortProgression` INTEGER NOT NULL,
    MODIFY `refProgression` INTEGER NOT NULL,
    MODIFY `spellProgression` INTEGER NULL,
    MODIFY `willProgression` INTEGER NOT NULL;
