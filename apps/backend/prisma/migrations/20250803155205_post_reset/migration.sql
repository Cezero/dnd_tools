-- AddForeignKey
ALTER TABLE `ClassFeatureModifier` ADD CONSTRAINT `ClassFeatureModifier_featureProgressionId_fkey` FOREIGN KEY (`featureProgressionId`) REFERENCES `ClassFeatureProgression`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CharacterFeatureChoice` ADD CONSTRAINT `CharacterFeatureChoice_advancementId_fkey` FOREIGN KEY (`advancementId`) REFERENCES `CharacterAdvancement`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
