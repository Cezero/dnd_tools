-- DM-granted bonus skill ranks on a character. Counts as real ranks; does not spend skill points.

-- CreateTable
CREATE TABLE `CharacterBonusSkillRank` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `characterId` INTEGER NOT NULL,
    `skillId` INTEGER NOT NULL,
    `skillSubId` INTEGER NULL,
    `customSubtype` VARCHAR(191) NULL,
    `ranks` INTEGER NOT NULL,
    `description` VARCHAR(255) NOT NULL,

    INDEX `CharacterBonusSkillRank_characterId_idx` (`characterId`),
    INDEX `CharacterBonusSkillRank_skillId_idx` (`skillId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CharacterBonusSkillRank` ADD CONSTRAINT `CharacterBonusSkillRank_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterBonusSkillRank` ADD CONSTRAINT `CharacterBonusSkillRank_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
