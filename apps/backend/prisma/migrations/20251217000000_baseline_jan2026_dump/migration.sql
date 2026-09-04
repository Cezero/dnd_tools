-- Baseline: schema-only CREATE from apps/backend/backup/cyberdnd_bkp_01192026.sql
-- (Jan 19 2026 dump). Absorbs 20251217150155 / 20251217163121 which were already
-- present in that dump. Tables are created without FKs, then constraints are added
-- so InnoDB can open parents (avoids MySQL 1824 on shadow replay).
-- Do not run against live cyberdnd; mark applied instead.

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE `AdvancementFeat` (
  `advancementId` int NOT NULL,
  `featId` int NOT NULL,
  `featSubId` int DEFAULT NULL,
  PRIMARY KEY (`advancementId`,`featId`),
  KEY `AdvancementFeat_featId_fkey` (`featId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `AdvancementSkill` (
  `id` int NOT NULL AUTO_INCREMENT,
  `advancementId` int NOT NULL,
  `skillId` int NOT NULL,
  `skillSubId` int DEFAULT NULL,
  `pointsSpent` int NOT NULL,
  `customSubtype` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `AdvancementSkill_advancementId_skillId_skillSubId_customSubt_key` (`advancementId`,`skillId`,`skillSubId`,`customSubtype`),
  KEY `AdvancementSkill_skillId_fkey` (`skillId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `AdvancementSpell` (
  `advancementId` int NOT NULL,
  `spellId` int NOT NULL,
  `isFreeGrant` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`advancementId`,`spellId`),
  KEY `AdvancementSpell_spellId_fkey` (`spellId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Armor` (
  `id` int NOT NULL,
  `category` int NOT NULL,
  `bonus` int DEFAULT NULL,
  `dexterityCap` int DEFAULT NULL,
  `checkPenalty` int DEFAULT NULL,
  `arcaneSpellFailure` int DEFAULT NULL,
  `speedCapThirty` int DEFAULT NULL,
  `speedCapTwenty` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `CharacterAdvancement` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterId` int NOT NULL,
  `level` int NOT NULL,
  `version` int NOT NULL,
  `classId` int NOT NULL,
  `secondaryClassId` int DEFAULT NULL,
  `hitPoints` int NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `abilityId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `CharacterAdvancement_characterId_level_version_key` (`characterId`,`level`,`version`),
  KEY `CharacterAdvancement_classId_fkey` (`classId`),
  KEY `CharacterAdvancement_secondaryClassId_fkey` (`secondaryClassId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `CharacterAttackDefinition` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterId` int NOT NULL,
  `attackSlot` int DEFAULT NULL,
  `mainHandCharacterItemId` int DEFAULT NULL,
  `offHandCharacterItemId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `CharacterAttackDefinition_characterId_idx` (`characterId`),
  KEY `CharacterAttackDefinition_attackSlot_idx` (`attackSlot`),
  KEY `CharacterAttackDefinition_mainHandCharacterItemId_fkey` (`mainHandCharacterItemId`),
  KEY `CharacterAttackDefinition_offHandCharacterItemId_fkey` (`offHandCharacterItemId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `CharacterCompanion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterId` int NOT NULL,
  `levelAcquired` int DEFAULT NULL,
  `hitPoints` int DEFAULT NULL,
  `wounds` int NOT NULL DEFAULT '0',
  `monsterId` int NOT NULL,
  `companionId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `CharacterCompanion_characterId_idx` (`characterId`),
  KEY `CharacterCompanion_monsterId_idx` (`monsterId`),
  KEY `CharacterCompanion_companionId_idx` (`companionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `CharacterCompanionTrick` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterCompanionId` int NOT NULL,
  `trickId` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `CharacterCompanionTrick_characterCompanionId_trickId_key` (`characterCompanionId`,`trickId`),
  KEY `CharacterCompanionTrick_characterCompanionId_idx` (`characterCompanionId`),
  KEY `CharacterCompanionTrick_trickId_idx` (`trickId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `CharacterDisallowedSource` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterId` int NOT NULL,
  `sourceBookId` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `CharacterDisallowedSource_characterId_sourceBookId_key` (`characterId`,`sourceBookId`),
  KEY `CharacterDisallowedSource_sourceBookId_fkey` (`sourceBookId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `CharacterFeatureChoice` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterId` int NOT NULL,
  `progressionId` int NOT NULL,
  `advancementId` int NOT NULL,
  `choiceIndex` int DEFAULT NULL,
  `appliesToId` int NOT NULL,
  `appliesToSubId` int DEFAULT NULL,
  `featureEntityId` int NOT NULL,
  `choiceData` json DEFAULT NULL,
  `choiceGroupId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `linkedChoiceGroupId` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `CharacterFeatureChoice_advancementId_progressionId_featureEn_key` (`advancementId`,`progressionId`,`featureEntityId`),
  KEY `CharacterFeatureChoice_progressionId_fkey` (`progressionId`),
  KEY `CharacterFeatureChoice_featureEntityId_fkey` (`featureEntityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `CharacterFeatureUses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterId` int NOT NULL,
  `progressionId` int NOT NULL,
  `featureEntityId` int NOT NULL,
  `currentUses` int NOT NULL DEFAULT '0',
  `maxUses` int NOT NULL,
  `frequency` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `CharacterFeatureUses_characterId_progressionId_featureEntity_key` (`characterId`,`progressionId`,`featureEntityId`),
  KEY `CharacterFeatureUses_characterId_idx` (`characterId`),
  KEY `CharacterFeatureUses_progressionId_fkey` (`progressionId`),
  KEY `CharacterFeatureUses_featureEntityId_fkey` (`featureEntityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `CharacterItem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int DEFAULT NULL,
  `characterId` int NOT NULL,
  `baseItemId` int NOT NULL,
  `location` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `CharacterItem_characterId_fkey` (`characterId`),
  KEY `CharacterItem_baseItemId_fkey` (`baseItemId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `CharacterItemProperty` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterItemId` int NOT NULL,
  `propertyId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `CharacterItemProperty_characterItemId_fkey` (`characterItemId`),
  KEY `CharacterItemProperty_propertyId_fkey` (`propertyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `CharacterLanguageMap` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterId` int NOT NULL,
  `languageId` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `CharacterLanguageMap_characterId_languageId_key` (`characterId`,`languageId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `CharacterSpellPreparation` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterId` int NOT NULL,
  `classId` int NOT NULL,
  `spellId` int NOT NULL,
  `spellLevel` int NOT NULL,
  `quantity` int NOT NULL,
  `timesCast` int NOT NULL DEFAULT '0',
  `slotType` int NOT NULL DEFAULT '0',
  `featId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `CharacterSpellPreparation_characterId_idx` (`characterId`),
  KEY `CharacterSpellPreparation_classId_fkey` (`classId`),
  KEY `CharacterSpellPreparation_spellId_fkey` (`spellId`),
  KEY `CharacterSpellPreparation_featId_fkey` (`featId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Class` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abbreviation` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `editionId` int NOT NULL,
  `isPrestige` tinyint(1) NOT NULL DEFAULT '0',
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  `canCastSpells` tinyint(1) NOT NULL DEFAULT '0',
  `description` text COLLATE utf8mb4_unicode_ci,
  `spellsKnown` tinyint(1) NOT NULL DEFAULT '0',
  `isDivine` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ClassSourceMap` (
  `classId` int NOT NULL,
  `pageNumber` int DEFAULT NULL,
  `sourceBookId` int NOT NULL,
  PRIMARY KEY (`classId`,`sourceBookId`),
  KEY `ClassSourceMap_sourceBookId_fkey` (`sourceBookId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Companion` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` int NOT NULL,
  `monsterId` int NOT NULL,
  `minLevel` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Companion_type_monsterId_minLevel_key` (`type`,`monsterId`,`minLevel`),
  KEY `Companion_monsterId_idx` (`monsterId`),
  KEY `Companion_type_idx` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Deity` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alignmentId` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `editionId` int NOT NULL,
  `title` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pantheonId` int DEFAULT NULL,
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DeityClassMap` (
  `id` int NOT NULL AUTO_INCREMENT,
  `deityId` int NOT NULL,
  `classId` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `DeityClassMap_deityId_classId_key` (`deityId`,`classId`),
  KEY `DeityClassMap_classId_fkey` (`classId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DeityDomain` (
  `id` int NOT NULL AUTO_INCREMENT,
  `deityId` int NOT NULL,
  `domainId` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `DeityDomain_deityId_domainId_key` (`deityId`,`domainId`),
  KEY `DeityDomain_domainId_fkey` (`domainId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DeityFavoredWeaponMap` (
  `id` int NOT NULL AUTO_INCREMENT,
  `deityId` int NOT NULL,
  `itemId` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `DeityFavoredWeaponMap_deityId_itemId_key` (`deityId`,`itemId`),
  KEY `DeityFavoredWeaponMap_itemId_fkey` (`itemId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DeityRaceMap` (
  `id` int NOT NULL AUTO_INCREMENT,
  `deityId` int NOT NULL,
  `raceId` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `DeityRaceMap_deityId_raceId_key` (`deityId`,`raceId`),
  KEY `DeityRaceMap_raceId_fkey` (`raceId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DeitySourceMap` (
  `deityId` int NOT NULL,
  `sourceBookId` int NOT NULL,
  `pageNumber` int DEFAULT NULL,
  PRIMARY KEY (`deityId`,`sourceBookId`),
  KEY `DeitySourceMap_sourceBookId_fkey` (`sourceBookId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DiceBoxAdminConfig` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Default Configuration',
  `isDefault` tinyint(1) NOT NULL DEFAULT '0',
  `gravity` double NOT NULL DEFAULT '1',
  `mass` double NOT NULL DEFAULT '1',
  `friction` double NOT NULL DEFAULT '0.8',
  `restitution` double NOT NULL DEFAULT '0',
  `angularDamping` double NOT NULL DEFAULT '0.4',
  `linearDamping` double NOT NULL DEFAULT '0.4',
  `spinForce` double NOT NULL DEFAULT '4',
  `throwForce` double NOT NULL DEFAULT '5',
  `startingHeight` int NOT NULL DEFAULT '8',
  `settleTimeout` int NOT NULL DEFAULT '5000',
  `lightIntensity` double NOT NULL DEFAULT '1',
  `enableShadows` tinyint(1) NOT NULL DEFAULT '1',
  `shadowTransparency` double NOT NULL DEFAULT '0.8',
  `theme` int NOT NULL DEFAULT '1',
  `themeColor` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#2e8555',
  `iconColor` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scale` double NOT NULL DEFAULT '6',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Domain` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `editionId` int NOT NULL,
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DomainSourceMap` (
  `domainId` int NOT NULL,
  `sourceBookId` int NOT NULL,
  `pageNumber` int DEFAULT NULL,
  PRIMARY KEY (`domainId`,`sourceBookId`),
  KEY `DomainSourceMap_sourceBookId_fkey` (`sourceBookId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `DomainSpell` (
  `id` int NOT NULL AUTO_INCREMENT,
  `domainId` int NOT NULL,
  `spellId` int NOT NULL,
  `spellLevel` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `DomainSpell_domainId_spellLevel_key` (`domainId`,`spellLevel`),
  KEY `DomainSpell_spellId_fkey` (`spellId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Feat` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `typeId` int NOT NULL,
  `repeatable` tinyint(1) DEFAULT NULL,
  `fighterBonus` tinyint(1) DEFAULT NULL,
  `editionId` int NOT NULL,
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  `useSubId` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `FeatSourceBookMap` (
  `featId` int NOT NULL,
  `sourceBookId` int NOT NULL,
  `pageNumber` int DEFAULT NULL,
  PRIMARY KEY (`featId`,`sourceBookId`),
  KEY `FeatSourceBookMap_sourceBookId_fkey` (`sourceBookId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Feature` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary` text COLLATE utf8mb4_unicode_ci,
  `displayInCharacterSheet` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `Feature_slug_key` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `FeatureEntity` (
  `id` int NOT NULL AUTO_INCREMENT,
  `progressionId` int NOT NULL,
  `appliesTo` int NOT NULL,
  `appliesToId` int DEFAULT NULL,
  `appliesToSubId` int DEFAULT NULL,
  `formulaParamsId` int DEFAULT NULL,
  `groupingId` int NOT NULL DEFAULT '0',
  `type` int NOT NULL,
  `value` double DEFAULT NULL,
  `bonusType` int DEFAULT NULL,
  `displayInDetail` tinyint(1) NOT NULL DEFAULT '1',
  `filterType` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FeatureEntity_progressionId_fkey` (`progressionId`),
  KEY `FeatureEntity_formulaParamsId_fkey` (`formulaParamsId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `FeatureEntityCondition` (
  `id` int NOT NULL AUTO_INCREMENT,
  `featureEntityId` int NOT NULL,
  `conditionType` int NOT NULL,
  `conditionValue` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FeatureEntityCondition_featureEntityId_fkey` (`featureEntityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `FeatureFormulaParams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `formulaId` int NOT NULL,
  `interval` int DEFAULT NULL,
  `formulaStartLevel` int DEFAULT NULL,
  `abilityId` int DEFAULT NULL,
  `thresholds` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `values` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cumulative` tinyint(1) NOT NULL DEFAULT '0',
  `valuesRepresent` int DEFAULT NULL,
  `includeProgressionLevel` tinyint(1) NOT NULL DEFAULT '1',
  `baseValue` int DEFAULT NULL,
  `divisor` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `FeaturePrerequisite` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` int NOT NULL,
  `appliesToId` int DEFAULT NULL,
  `minValue` int NOT NULL,
  `featureId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FeaturePrerequisite_featureId_fkey` (`featureId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `FeatureProgression` (
  `id` int NOT NULL AUTO_INCREMENT,
  `sourceType` int NOT NULL,
  `level` int NOT NULL,
  `featureId` int NOT NULL,
  `domainId` int DEFAULT NULL,
  `featId` int DEFAULT NULL,
  `companionId` int DEFAULT NULL,
  `editionId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FeatureProgression_featureId_fkey` (`featureId`),
  KEY `FeatureProgression_domainId_fkey` (`domainId`),
  KEY `FeatureProgression_featId_idx` (`featId`),
  KEY `FeatureProgression_companionId_idx` (`companionId`),
  KEY `FeatureProgression_editionId_idx` (`editionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `FeatureProgressionClassMap` (
  `progressionId` int NOT NULL,
  `classId` int NOT NULL,
  PRIMARY KEY (`progressionId`,`classId`),
  KEY `FeatureProgressionClassMap_classId_idx` (`classId`),
  KEY `FeatureProgressionClassMap_progressionId_idx` (`progressionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `FeatureProgressionCondition` (
  `id` int NOT NULL AUTO_INCREMENT,
  `progressionId` int NOT NULL,
  `conditionType` int NOT NULL,
  `conditionValue` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FeatureProgressionCondition_progressionId_idx` (`progressionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `FeatureProgressionRaceMap` (
  `progressionId` int NOT NULL,
  `raceId` int NOT NULL,
  PRIMARY KEY (`progressionId`,`raceId`),
  KEY `FeatureProgressionRaceMap_raceId_idx` (`raceId`),
  KEY `FeatureProgressionRaceMap_progressionId_idx` (`progressionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Item` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `typeId` int NOT NULL DEFAULT '1',
  `cost` decimal(10,2) DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `sizeId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Item_typeId_fkey` (`typeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ItemProperty` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('Material','Enhancement','SpecialAbility','Structural') COLLATE utf8mb4_unicode_ci NOT NULL,
  `flatCostModifier` int DEFAULT NULL,
  `costMultiplier` double DEFAULT NULL,
  `costFormula` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enhancementBonusValue` int DEFAULT NULL,
  `bonusEquivalentModifier` int DEFAULT NULL,
  `exclusiveMaterial` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ItemPropertyAppliesTo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `propertyId` int NOT NULL,
  `itemType` enum('Weapon','Armor','Shield','MountArmor','Ammunition') COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ItemPropertyAppliesTo_propertyId_fkey` (`propertyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ItemPropertyIncompatibility` (
  `id` int NOT NULL AUTO_INCREMENT,
  `propertyAId` int NOT NULL,
  `propertyBId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ItemPropertyIncompatibility_propertyAId_fkey` (`propertyAId`),
  KEY `ItemPropertyIncompatibility_propertyBId_fkey` (`propertyBId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ItemTemplate` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `itemId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ItemTemplate_itemId_fkey` (`itemId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ItemTemplateProperty` (
  `id` int NOT NULL AUTO_INCREMENT,
  `templateId` int NOT NULL,
  `propertyId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ItemTemplateProperty_templateId_fkey` (`templateId`),
  KEY `ItemTemplateProperty_propertyId_fkey` (`propertyId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ItemType` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Monster` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `baseMonsterId` int DEFAULT NULL,
  `editionId` int NOT NULL,
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  `flavorText` text COLLATE utf8mb4_unicode_ci,
  `description` text COLLATE utf8mb4_unicode_ci,
  `combatDescription` text COLLATE utf8mb4_unicode_ci,
  `sizeId` int DEFAULT NULL,
  `baseSpeed` int DEFAULT NULL,
  `armorClass` int DEFAULT NULL,
  `touchAC` int DEFAULT NULL,
  `flatFootedAC` int DEFAULT NULL,
  `hitDiceQty` double DEFAULT NULL,
  `hitDiceType` int DEFAULT NULL,
  `bonusHP` int DEFAULT NULL,
  `averageHP` int DEFAULT NULL,
  `initiative` int DEFAULT NULL,
  `baseAttack` int DEFAULT NULL,
  `grapple` int DEFAULT NULL,
  `attack` text COLLATE utf8mb4_unicode_ci,
  `fullAttack` text COLLATE utf8mb4_unicode_ci,
  `space` double DEFAULT NULL,
  `reach` int DEFAULT NULL,
  `optionalReach` int DEFAULT NULL,
  `optionalReachDescription` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fortSave` int DEFAULT NULL,
  `refSave` int DEFAULT NULL,
  `willSave` int DEFAULT NULL,
  `strength` int DEFAULT NULL,
  `dexterity` int DEFAULT NULL,
  `constitution` int DEFAULT NULL,
  `intelligence` int DEFAULT NULL,
  `wisdom` int DEFAULT NULL,
  `charisma` int DEFAULT NULL,
  `organization` text COLLATE utf8mb4_unicode_ci,
  `treasure` text COLLATE utf8mb4_unicode_ci,
  `alignment` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `advancement` text COLLATE utf8mb4_unicode_ci,
  `challengeRating` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `levelAdjustment` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialAttacks` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialQualities` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Monster_baseMonsterId_fkey` (`baseMonsterId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `MonsterAlternateSpeed` (
  `id` int NOT NULL AUTO_INCREMENT,
  `monsterId` int NOT NULL,
  `movementTypeId` int NOT NULL,
  `speed` int NOT NULL,
  `maneuverability` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `MonsterAlternateSpeed_monsterId_idx` (`monsterId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `MonsterArmorBreakdown` (
  `id` int NOT NULL AUTO_INCREMENT,
  `monsterId` int NOT NULL,
  `componentType` int NOT NULL,
  `value` int DEFAULT NULL,
  `equipmentItemId` int DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `MonsterArmorBreakdown_monsterId_idx` (`monsterId`),
  KEY `MonsterArmorBreakdown_equipmentItemId_fkey` (`equipmentItemId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `MonsterDomainMap` (
  `monsterId` int NOT NULL,
  `domainId` int NOT NULL,
  PRIMARY KEY (`monsterId`,`domainId`),
  KEY `MonsterDomainMap_monsterId_idx` (`monsterId`),
  KEY `MonsterDomainMap_domainId_fkey` (`domainId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `MonsterEquipment` (
  `monsterId` int NOT NULL,
  `itemId` int NOT NULL,
  PRIMARY KEY (`monsterId`,`itemId`),
  KEY `MonsterEquipment_itemId_fkey` (`itemId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `MonsterExtraDescription` (
  `id` int NOT NULL AUTO_INCREMENT,
  `monsterId` int NOT NULL,
  `type` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `MonsterExtraDescription_monsterId_idx` (`monsterId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `MonsterExtraHitDie` (
  `id` int NOT NULL AUTO_INCREMENT,
  `monsterId` int NOT NULL,
  `hitDiceQty` double NOT NULL,
  `hitDiceType` int NOT NULL,
  `bonusHP` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `MonsterExtraHitDie_monsterId_idx` (`monsterId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `MonsterFeatMap` (
  `monsterId` int NOT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  `featId` int NOT NULL,
  `notes` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `MonsterFeatMap_monsterId_featId_notes_key` (`monsterId`,`featId`,`notes`),
  KEY `MonsterFeatMap_monsterId_idx` (`monsterId`),
  KEY `MonsterFeatMap_featId_fkey` (`featId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `MonsterPreparedSpellSlots` (
  `id` int NOT NULL AUTO_INCREMENT,
  `monsterId` int NOT NULL,
  `spellLevel` int NOT NULL,
  `numSlots` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `MonsterPreparedSpellSlots_monsterId_spellLevel_key` (`monsterId`,`spellLevel`),
  KEY `MonsterPreparedSpellSlots_monsterId_idx` (`monsterId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `MonsterSkillMap` (
  `monsterId` int NOT NULL,
  `skillId` int NOT NULL,
  `ranks` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `skillSubId` int DEFAULT NULL,
  `id` int NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  UNIQUE KEY `MonsterSkillMap_monsterId_skillId_skillSubId_key` (`monsterId`,`skillId`,`skillSubId`),
  KEY `MonsterSkillMap_skillId_fkey` (`skillId`),
  KEY `MonsterSkillMap_monsterId_idx` (`monsterId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `MonsterSourceMap` (
  `monsterId` int NOT NULL,
  `sourceBookId` int NOT NULL,
  `pageNumber` int DEFAULT NULL,
  PRIMARY KEY (`monsterId`,`sourceBookId`),
  KEY `MonsterSourceMap_sourceBookId_fkey` (`sourceBookId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `MonsterSpecialAbility` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `abilityType` int NOT NULL,
  `effectiveCasterLevel` int DEFAULT NULL,
  `saveAbility` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `MonsterSpecialAbilityMap` (
  `monsterId` int NOT NULL,
  `abilityId` int NOT NULL,
  PRIMARY KEY (`monsterId`,`abilityId`),
  KEY `MonsterSpecialAbilityMap_abilityId_fkey` (`abilityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `MonsterSpell` (
  `id` int NOT NULL AUTO_INCREMENT,
  `monsterId` int NOT NULL,
  `spellId` int NOT NULL,
  `spellType` int NOT NULL,
  `quantity` int DEFAULT NULL,
  `usesPerDayId` int DEFAULT NULL,
  `saveDC` int DEFAULT NULL,
  `specialAbilityId` int DEFAULT NULL,
  `notes` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `level` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `MonsterSpell_monsterId_idx` (`monsterId`),
  KEY `MonsterSpell_spellId_fkey` (`spellId`),
  KEY `MonsterSpell_specialAbilityId_idx` (`specialAbilityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `MonsterSubtypeMap` (
  `monsterId` int NOT NULL,
  `subtypeId` int NOT NULL,
  PRIMARY KEY (`monsterId`,`subtypeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `MonsterTypeMap` (
  `monsterId` int NOT NULL,
  `typeId` int NOT NULL,
  PRIMARY KEY (`monsterId`,`typeId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Race` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `editionId` int NOT NULL,
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `RaceSourceMap` (
  `raceId` int NOT NULL,
  `sourceBookId` int NOT NULL,
  `pageNumber` int DEFAULT NULL,
  PRIMARY KEY (`raceId`,`sourceBookId`),
  KEY `RaceSourceMap_sourceBookId_fkey` (`sourceBookId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ReferenceTable` (
  `slug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ReferenceTableCell` (
  `tableSlug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `columnIndex` int NOT NULL,
  `rowIndex` int NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `colSpan` int DEFAULT NULL,
  `rowSpan` int DEFAULT NULL,
  PRIMARY KEY (`tableSlug`,`columnIndex`,`rowIndex`),
  KEY `ReferenceTableCell_tableSlug_rowIndex_fkey` (`tableSlug`,`rowIndex`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ReferenceTableColumn` (
  `tableSlug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `index` int NOT NULL,
  `header` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `span` int DEFAULT NULL,
  `alignment` enum('left','center','right') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`tableSlug`,`index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `ReferenceTableRow` (
  `tableSlug` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `index` int NOT NULL,
  PRIMARY KEY (`tableSlug`,`index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Skill` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilityId` int NOT NULL DEFAULT '1',
  `checkDescription` text COLLATE utf8mb4_unicode_ci,
  `actionDescription` text COLLATE utf8mb4_unicode_ci,
  `retryTypeId` int DEFAULT NULL,
  `retryDescription` text COLLATE utf8mb4_unicode_ci,
  `specialNotes` text COLLATE utf8mb4_unicode_ci,
  `synergyNotes` text COLLATE utf8mb4_unicode_ci,
  `untrainedNotes` text COLLATE utf8mb4_unicode_ci,
  `affectedByArmor` tinyint(1) NOT NULL DEFAULT '0',
  `description` text COLLATE utf8mb4_unicode_ci,
  `restrictionNotes` text COLLATE utf8mb4_unicode_ci,
  `trainedOnly` tinyint(1) DEFAULT NULL,
  `isAnalog` tinyint(1) NOT NULL DEFAULT '0',
  `editionId` int NOT NULL,
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  `doubleArmorPenalty` tinyint(1) NOT NULL DEFAULT '0',
  `hasNoMaxRanks` tinyint(1) NOT NULL DEFAULT '0',
  `hasSubtypes` tinyint(1) NOT NULL DEFAULT '0',
  `usesCustomSubtype` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `SkillSourceBookMap` (
  `skillId` int NOT NULL,
  `sourceBookId` int NOT NULL,
  `pageNumber` int DEFAULT NULL,
  PRIMARY KEY (`skillId`,`sourceBookId`),
  KEY `SkillSourceBookMap_sourceBookId_fkey` (`sourceBookId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `SkillSubtype` (
  `id` int NOT NULL AUTO_INCREMENT,
  `skillId` int NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `editionId` int NOT NULL,
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `SkillSubtype_skillId_name_editionId_key` (`skillId`,`name`,`editionId`),
  KEY `SkillSubtype_skillId_idx` (`skillId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `SourceBook` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abbreviation` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `releaseDate` datetime(3) DEFAULT NULL,
  `editionId` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `isVisible` tinyint(1) NOT NULL DEFAULT '0',
  `hasClasses` tinyint(1) NOT NULL DEFAULT '0',
  `hasDeities` tinyint(1) NOT NULL DEFAULT '0',
  `hasDomains` tinyint(1) NOT NULL DEFAULT '0',
  `hasItems` tinyint(1) NOT NULL DEFAULT '0',
  `hasRaces` tinyint(1) NOT NULL DEFAULT '0',
  `hasSpells` tinyint(1) NOT NULL DEFAULT '0',
  `settingId` int DEFAULT NULL,
  `hasCore` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Spell` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary` text COLLATE utf8mb4_unicode_ci,
  `description` text COLLATE utf8mb4_unicode_ci,
  `castingTime` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `range` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rangeTypeId` int DEFAULT NULL,
  `rangeValue` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `savingThrow` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spellResistance` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `editionId` int NOT NULL,
  `baseLevel` int NOT NULL,
  `effect` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `SpellComponentMap` (
  `spellId` int NOT NULL,
  `componentId` int NOT NULL,
  PRIMARY KEY (`spellId`,`componentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `SpellDescriptorMap` (
  `spellId` int NOT NULL,
  `descriptorId` int NOT NULL,
  PRIMARY KEY (`spellId`,`descriptorId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `SpellLevelMap` (
  `classId` int NOT NULL,
  `spellId` int NOT NULL,
  `level` int NOT NULL,
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`spellId`,`classId`),
  KEY `SpellLevelMap_classId_fkey` (`classId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `SpellSchoolMap` (
  `spellId` int NOT NULL,
  `schoolId` int NOT NULL,
  PRIMARY KEY (`spellId`,`schoolId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `SpellSourceMap` (
  `spellId` int NOT NULL,
  `sourceBookId` int NOT NULL,
  `pageNumber` int DEFAULT NULL,
  PRIMARY KEY (`spellId`,`sourceBookId`),
  KEY `SpellSourceMap_sourceBookId_fkey` (`sourceBookId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `SpellSubschoolMap` (
  `spellId` int NOT NULL,
  `subSchoolId` int NOT NULL,
  PRIMARY KEY (`spellId`,`subSchoolId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `SpellcastingLink` (
  `id` int NOT NULL AUTO_INCREMENT,
  `featureProgressionId` int NOT NULL,
  `progressionId` int NOT NULL,
  `inheritedFrom` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `levelOffset` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SpellcastingLink_featureProgressionId_key` (`featureProgressionId`),
  KEY `SpellcastingLink_progressionId_fkey` (`progressionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `SpellcastingProgression` (
  `id` int NOT NULL AUTO_INCREMENT,
  `classLevel` int NOT NULL,
  `featureProgressionId` int DEFAULT NULL,
  `spellcastingType` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SpellcastingProgression_featureProgressionId_key` (`featureProgressionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `SpellcastingSlot` (
  `id` int NOT NULL AUTO_INCREMENT,
  `progressionId` int NOT NULL,
  `spellLevel` int NOT NULL,
  `slotsPerDay` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `SpellcastingSlot_progressionId_fkey` (`progressionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `TransformationFormEligibility` (
  `id` int NOT NULL AUTO_INCREMENT,
  `featureId` int NOT NULL,
  `monsterId` int NOT NULL,
  `minLevel` int DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `TransformationFormEligibility_featureId_monsterId_key` (`featureId`,`monsterId`),
  KEY `TransformationFormEligibility_featureId_idx` (`featureId`),
  KEY `TransformationFormEligibility_monsterId_idx` (`monsterId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Trick` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `editionId` int NOT NULL,
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `TrickSourceMap` (
  `trickId` int NOT NULL,
  `sourceBookId` int NOT NULL,
  `pageNumber` int DEFAULT NULL,
  PRIMARY KEY (`trickId`,`sourceBookId`),
  KEY `TrickSourceMap_sourceBookId_fkey` (`sourceBookId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `User` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `isAdmin` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `preferredEditionId` int DEFAULT NULL,
  `diceConfigBase` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `User_diceConfigBase_fkey` (`diceConfigBase`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `UserCharacter` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `raceId` int NOT NULL,
  `alignmentId` int DEFAULT NULL,
  `xp` int NOT NULL DEFAULT '0',
  `age` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `weight` int DEFAULT NULL,
  `eyes` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hair` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `deityId` int DEFAULT NULL,
  `allowVariantClasses` tinyint(1) NOT NULL DEFAULT '0',
  `editionId` int NOT NULL,
  `ignoreLevelAdjustment` tinyint(1) NOT NULL DEFAULT '0',
  `isGestalt` tinyint(1) NOT NULL DEFAULT '0',
  `copper` int NOT NULL DEFAULT '0',
  `gold` int NOT NULL DEFAULT '0',
  `platinum` int NOT NULL DEFAULT '0',
  `silver` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `UserCharacter_raceId_fkey` (`raceId`),
  KEY `UserCharacter_userId_fkey` (`userId`),
  KEY `UserCharacter_deityId_fkey` (`deityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `UserCharacterAbilityScore` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterId` int NOT NULL,
  `abilityId` int NOT NULL,
  `value` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `UserCharacterAbilityScore_characterId_fkey` (`characterId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `UserDiceConfigOverride` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `propertyName` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `propertyValue` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserDiceConfigOverride_userId_propertyName_key` (`userId`,`propertyName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `Weapon` (
  `id` int NOT NULL,
  `category` int NOT NULL,
  `type` int NOT NULL,
  `attackBonus` int DEFAULT NULL,
  `damageSmall` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `damageMedium` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `critical` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `range` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `damageType` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reach` tinyint(1) NOT NULL DEFAULT '0',
  `double` tinyint(1) NOT NULL DEFAULT '0',
  `nonlethal` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Foreign keys

ALTER TABLE `AdvancementFeat` ADD CONSTRAINT `AdvancementFeat_advancementId_fkey` FOREIGN KEY (`advancementId`) REFERENCES `CharacterAdvancement` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `AdvancementFeat` ADD CONSTRAINT `AdvancementFeat_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `AdvancementSkill` ADD CONSTRAINT `AdvancementSkill_advancementId_fkey` FOREIGN KEY (`advancementId`) REFERENCES `CharacterAdvancement` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `AdvancementSkill` ADD CONSTRAINT `AdvancementSkill_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `AdvancementSpell` ADD CONSTRAINT `AdvancementSpell_advancementId_fkey` FOREIGN KEY (`advancementId`) REFERENCES `CharacterAdvancement` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `AdvancementSpell` ADD CONSTRAINT `AdvancementSpell_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Armor` ADD CONSTRAINT `Armor_id_fkey` FOREIGN KEY (`id`) REFERENCES `Item` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `CharacterAdvancement` ADD CONSTRAINT `CharacterAdvancement_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterAdvancement` ADD CONSTRAINT `CharacterAdvancement_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterAdvancement` ADD CONSTRAINT `CharacterAdvancement_secondaryClassId_fkey` FOREIGN KEY (`secondaryClassId`) REFERENCES `Class` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `CharacterAttackDefinition` ADD CONSTRAINT `CharacterAttackDefinition_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `CharacterAttackDefinition` ADD CONSTRAINT `CharacterAttackDefinition_mainHandCharacterItemId_fkey` FOREIGN KEY (`mainHandCharacterItemId`) REFERENCES `CharacterItem` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `CharacterAttackDefinition` ADD CONSTRAINT `CharacterAttackDefinition_offHandCharacterItemId_fkey` FOREIGN KEY (`offHandCharacterItemId`) REFERENCES `CharacterItem` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `CharacterCompanion` ADD CONSTRAINT `CharacterCompanion_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `CharacterCompanion` ADD CONSTRAINT `CharacterCompanion_companionId_fkey` FOREIGN KEY (`companionId`) REFERENCES `Companion` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `CharacterCompanion` ADD CONSTRAINT `CharacterCompanion_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterCompanionTrick` ADD CONSTRAINT `CharacterCompanionTrick_characterCompanionId_fkey` FOREIGN KEY (`characterCompanionId`) REFERENCES `CharacterCompanion` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `CharacterCompanionTrick` ADD CONSTRAINT `CharacterCompanionTrick_trickId_fkey` FOREIGN KEY (`trickId`) REFERENCES `Trick` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `CharacterDisallowedSource` ADD CONSTRAINT `CharacterDisallowedSource_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `CharacterDisallowedSource` ADD CONSTRAINT `CharacterDisallowedSource_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterFeatureChoice` ADD CONSTRAINT `CharacterFeatureChoice_advancementId_fkey` FOREIGN KEY (`advancementId`) REFERENCES `CharacterAdvancement` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterFeatureChoice` ADD CONSTRAINT `CharacterFeatureChoice_featureEntityId_fkey` FOREIGN KEY (`featureEntityId`) REFERENCES `FeatureEntity` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterFeatureChoice` ADD CONSTRAINT `CharacterFeatureChoice_progressionId_fkey` FOREIGN KEY (`progressionId`) REFERENCES `FeatureProgression` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterFeatureUses` ADD CONSTRAINT `CharacterFeatureUses_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterFeatureUses` ADD CONSTRAINT `CharacterFeatureUses_featureEntityId_fkey` FOREIGN KEY (`featureEntityId`) REFERENCES `FeatureEntity` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterFeatureUses` ADD CONSTRAINT `CharacterFeatureUses_progressionId_fkey` FOREIGN KEY (`progressionId`) REFERENCES `FeatureProgression` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterItem` ADD CONSTRAINT `CharacterItem_baseItemId_fkey` FOREIGN KEY (`baseItemId`) REFERENCES `Item` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterItem` ADD CONSTRAINT `CharacterItem_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterItemProperty` ADD CONSTRAINT `CharacterItemProperty_characterItemId_fkey` FOREIGN KEY (`characterItemId`) REFERENCES `CharacterItem` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterItemProperty` ADD CONSTRAINT `CharacterItemProperty_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `ItemProperty` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterLanguageMap` ADD CONSTRAINT `CharacterLanguageMap_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterSpellPreparation` ADD CONSTRAINT `CharacterSpellPreparation_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterSpellPreparation` ADD CONSTRAINT `CharacterSpellPreparation_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CharacterSpellPreparation` ADD CONSTRAINT `CharacterSpellPreparation_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `CharacterSpellPreparation` ADD CONSTRAINT `CharacterSpellPreparation_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ClassSourceMap` ADD CONSTRAINT `ClassSourceMap_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ClassSourceMap` ADD CONSTRAINT `ClassSourceMap_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Companion` ADD CONSTRAINT `Companion_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DeityClassMap` ADD CONSTRAINT `DeityClassMap_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DeityClassMap` ADD CONSTRAINT `DeityClassMap_deityId_fkey` FOREIGN KEY (`deityId`) REFERENCES `Deity` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DeityDomain` ADD CONSTRAINT `DeityDomain_deityId_fkey` FOREIGN KEY (`deityId`) REFERENCES `Deity` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DeityDomain` ADD CONSTRAINT `DeityDomain_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `Domain` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DeityFavoredWeaponMap` ADD CONSTRAINT `DeityFavoredWeaponMap_deityId_fkey` FOREIGN KEY (`deityId`) REFERENCES `Deity` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DeityFavoredWeaponMap` ADD CONSTRAINT `DeityFavoredWeaponMap_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DeityRaceMap` ADD CONSTRAINT `DeityRaceMap_deityId_fkey` FOREIGN KEY (`deityId`) REFERENCES `Deity` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DeityRaceMap` ADD CONSTRAINT `DeityRaceMap_raceId_fkey` FOREIGN KEY (`raceId`) REFERENCES `Race` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DeitySourceMap` ADD CONSTRAINT `DeitySourceMap_deityId_fkey` FOREIGN KEY (`deityId`) REFERENCES `Deity` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DeitySourceMap` ADD CONSTRAINT `DeitySourceMap_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DomainSourceMap` ADD CONSTRAINT `DomainSourceMap_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `Domain` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DomainSourceMap` ADD CONSTRAINT `DomainSourceMap_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DomainSpell` ADD CONSTRAINT `DomainSpell_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `Domain` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `DomainSpell` ADD CONSTRAINT `DomainSpell_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `FeatSourceBookMap` ADD CONSTRAINT `FeatSourceBookMap_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `FeatSourceBookMap` ADD CONSTRAINT `FeatSourceBookMap_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `FeatureEntity` ADD CONSTRAINT `FeatureEntity_formulaParamsId_fkey` FOREIGN KEY (`formulaParamsId`) REFERENCES `FeatureFormulaParams` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `FeatureEntity` ADD CONSTRAINT `FeatureEntity_progressionId_fkey` FOREIGN KEY (`progressionId`) REFERENCES `FeatureProgression` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `FeatureEntityCondition` ADD CONSTRAINT `FeatureEntityCondition_featureEntityId_fkey` FOREIGN KEY (`featureEntityId`) REFERENCES `FeatureEntity` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `FeaturePrerequisite` ADD CONSTRAINT `FeaturePrerequisite_featureId_fkey` FOREIGN KEY (`featureId`) REFERENCES `Feature` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `FeatureProgression` ADD CONSTRAINT `FeatureProgression_companionId_fkey` FOREIGN KEY (`companionId`) REFERENCES `Companion` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `FeatureProgression` ADD CONSTRAINT `FeatureProgression_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `Domain` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `FeatureProgression` ADD CONSTRAINT `FeatureProgression_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `FeatureProgression` ADD CONSTRAINT `FeatureProgression_featureId_fkey` FOREIGN KEY (`featureId`) REFERENCES `Feature` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `FeatureProgressionClassMap` ADD CONSTRAINT `FeatureProgressionClassMap_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `FeatureProgressionClassMap` ADD CONSTRAINT `FeatureProgressionClassMap_progressionId_fkey` FOREIGN KEY (`progressionId`) REFERENCES `FeatureProgression` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `FeatureProgressionCondition` ADD CONSTRAINT `FeatureProgressionCondition_progressionId_fkey` FOREIGN KEY (`progressionId`) REFERENCES `FeatureProgression` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `FeatureProgressionRaceMap` ADD CONSTRAINT `FeatureProgressionRaceMap_progressionId_fkey` FOREIGN KEY (`progressionId`) REFERENCES `FeatureProgression` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `FeatureProgressionRaceMap` ADD CONSTRAINT `FeatureProgressionRaceMap_raceId_fkey` FOREIGN KEY (`raceId`) REFERENCES `Race` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Item` ADD CONSTRAINT `Item_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `ItemType` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ItemPropertyAppliesTo` ADD CONSTRAINT `ItemPropertyAppliesTo_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `ItemProperty` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ItemPropertyIncompatibility` ADD CONSTRAINT `ItemPropertyIncompatibility_propertyAId_fkey` FOREIGN KEY (`propertyAId`) REFERENCES `ItemProperty` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ItemPropertyIncompatibility` ADD CONSTRAINT `ItemPropertyIncompatibility_propertyBId_fkey` FOREIGN KEY (`propertyBId`) REFERENCES `ItemProperty` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ItemTemplate` ADD CONSTRAINT `ItemTemplate_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ItemTemplateProperty` ADD CONSTRAINT `ItemTemplateProperty_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `ItemProperty` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ItemTemplateProperty` ADD CONSTRAINT `ItemTemplateProperty_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `ItemTemplate` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Monster` ADD CONSTRAINT `Monster_baseMonsterId_fkey` FOREIGN KEY (`baseMonsterId`) REFERENCES `Monster` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `MonsterAlternateSpeed` ADD CONSTRAINT `MonsterAlternateSpeed_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MonsterArmorBreakdown` ADD CONSTRAINT `MonsterArmorBreakdown_equipmentItemId_fkey` FOREIGN KEY (`equipmentItemId`) REFERENCES `Item` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `MonsterArmorBreakdown` ADD CONSTRAINT `MonsterArmorBreakdown_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MonsterDomainMap` ADD CONSTRAINT `MonsterDomainMap_domainId_fkey` FOREIGN KEY (`domainId`) REFERENCES `Domain` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `MonsterDomainMap` ADD CONSTRAINT `MonsterDomainMap_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MonsterEquipment` ADD CONSTRAINT `MonsterEquipment_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `MonsterEquipment` ADD CONSTRAINT `MonsterEquipment_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MonsterExtraDescription` ADD CONSTRAINT `MonsterExtraDescription_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MonsterExtraHitDie` ADD CONSTRAINT `MonsterExtraHitDie_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MonsterFeatMap` ADD CONSTRAINT `MonsterFeatMap_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `MonsterFeatMap` ADD CONSTRAINT `MonsterFeatMap_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MonsterPreparedSpellSlots` ADD CONSTRAINT `MonsterPreparedSpellSlots_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MonsterSkillMap` ADD CONSTRAINT `MonsterSkillMap_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MonsterSkillMap` ADD CONSTRAINT `MonsterSkillMap_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `MonsterSourceMap` ADD CONSTRAINT `MonsterSourceMap_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MonsterSourceMap` ADD CONSTRAINT `MonsterSourceMap_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `MonsterSpecialAbilityMap` ADD CONSTRAINT `MonsterSpecialAbilityMap_abilityId_fkey` FOREIGN KEY (`abilityId`) REFERENCES `MonsterSpecialAbility` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `MonsterSpecialAbilityMap` ADD CONSTRAINT `MonsterSpecialAbilityMap_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MonsterSpell` ADD CONSTRAINT `MonsterSpell_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MonsterSpell` ADD CONSTRAINT `MonsterSpell_specialAbilityId_fkey` FOREIGN KEY (`specialAbilityId`) REFERENCES `MonsterSpecialAbility` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `MonsterSpell` ADD CONSTRAINT `MonsterSpell_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `MonsterSubtypeMap` ADD CONSTRAINT `MonsterSubtypeMap_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `MonsterTypeMap` ADD CONSTRAINT `MonsterTypeMap_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `RaceSourceMap` ADD CONSTRAINT `RaceSourceMap_raceId_fkey` FOREIGN KEY (`raceId`) REFERENCES `Race` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `RaceSourceMap` ADD CONSTRAINT `RaceSourceMap_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ReferenceTableCell` ADD CONSTRAINT `ReferenceTableCell_tableSlug_columnIndex_fkey` FOREIGN KEY (`tableSlug`, `columnIndex`) REFERENCES `ReferenceTableColumn` (`tableSlug`, `index`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ReferenceTableCell` ADD CONSTRAINT `ReferenceTableCell_tableSlug_fkey` FOREIGN KEY (`tableSlug`) REFERENCES `ReferenceTable` (`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ReferenceTableCell` ADD CONSTRAINT `ReferenceTableCell_tableSlug_rowIndex_fkey` FOREIGN KEY (`tableSlug`, `rowIndex`) REFERENCES `ReferenceTableRow` (`tableSlug`, `index`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ReferenceTableColumn` ADD CONSTRAINT `ReferenceTableColumn_tableSlug_fkey` FOREIGN KEY (`tableSlug`) REFERENCES `ReferenceTable` (`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ReferenceTableRow` ADD CONSTRAINT `ReferenceTableRow_tableSlug_fkey` FOREIGN KEY (`tableSlug`) REFERENCES `ReferenceTable` (`slug`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SkillSourceBookMap` ADD CONSTRAINT `SkillSourceBookMap_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SkillSourceBookMap` ADD CONSTRAINT `SkillSourceBookMap_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SkillSubtype` ADD CONSTRAINT `SkillSubtype_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SpellComponentMap` ADD CONSTRAINT `SpellComponentMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SpellDescriptorMap` ADD CONSTRAINT `SpellDescriptorMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SpellLevelMap` ADD CONSTRAINT `SpellLevelMap_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SpellLevelMap` ADD CONSTRAINT `SpellLevelMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SpellSchoolMap` ADD CONSTRAINT `SpellSchoolMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SpellSourceMap` ADD CONSTRAINT `SpellSourceMap_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SpellSourceMap` ADD CONSTRAINT `SpellSourceMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SpellSubschoolMap` ADD CONSTRAINT `SpellSubschoolMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SpellcastingLink` ADD CONSTRAINT `SpellcastingLink_featureProgressionId_fkey` FOREIGN KEY (`featureProgressionId`) REFERENCES `FeatureProgression` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SpellcastingLink` ADD CONSTRAINT `SpellcastingLink_progressionId_fkey` FOREIGN KEY (`progressionId`) REFERENCES `SpellcastingProgression` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SpellcastingSlot` ADD CONSTRAINT `SpellcastingSlot_progressionId_fkey` FOREIGN KEY (`progressionId`) REFERENCES `SpellcastingProgression` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `TransformationFormEligibility` ADD CONSTRAINT `TransformationFormEligibility_featureId_fkey` FOREIGN KEY (`featureId`) REFERENCES `Feature` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `TransformationFormEligibility` ADD CONSTRAINT `TransformationFormEligibility_monsterId_fkey` FOREIGN KEY (`monsterId`) REFERENCES `Monster` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `TrickSourceMap` ADD CONSTRAINT `TrickSourceMap_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `TrickSourceMap` ADD CONSTRAINT `TrickSourceMap_trickId_fkey` FOREIGN KEY (`trickId`) REFERENCES `Trick` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `User` ADD CONSTRAINT `User_diceConfigBase_fkey` FOREIGN KEY (`diceConfigBase`) REFERENCES `DiceBoxAdminConfig` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `UserCharacter` ADD CONSTRAINT `UserCharacter_deityId_fkey` FOREIGN KEY (`deityId`) REFERENCES `Deity` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `UserCharacter` ADD CONSTRAINT `UserCharacter_raceId_fkey` FOREIGN KEY (`raceId`) REFERENCES `Race` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `UserCharacter` ADD CONSTRAINT `UserCharacter_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `UserCharacterAbilityScore` ADD CONSTRAINT `UserCharacterAbilityScore_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `UserDiceConfigOverride` ADD CONSTRAINT `UserDiceConfigOverride_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Weapon` ADD CONSTRAINT `Weapon_id_fkey` FOREIGN KEY (`id`) REFERENCES `Item` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `UserCharacter` ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
