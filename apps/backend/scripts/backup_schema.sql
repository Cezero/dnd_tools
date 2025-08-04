/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.11-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: cybersql.local.cyberdeck.org    Database: cyberdnd_bkp
-- ------------------------------------------------------
-- Server version	8.0.41-32.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `AdvancementClassFeature`
--

DROP TABLE IF EXISTS `AdvancementClassFeature`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `AdvancementClassFeature` (
  `advancementId` int NOT NULL,
  `featureSlug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `choice` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`advancementId`,`featureSlug`),
  KEY `AdvancementClassFeature_featureSlug_fkey` (`featureSlug`),
  CONSTRAINT `AdvancementClassFeature_advancementId_fkey` FOREIGN KEY (`advancementId`) REFERENCES `CharacterAdvancement` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `AdvancementClassFeature_featureSlug_fkey` FOREIGN KEY (`featureSlug`) REFERENCES `ClassFeature` (`slug`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `AdvancementFeat`
--

DROP TABLE IF EXISTS `AdvancementFeat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `AdvancementFeat` (
  `advancementId` int NOT NULL,
  `featId` int NOT NULL,
  PRIMARY KEY (`advancementId`,`featId`),
  KEY `AdvancementFeat_featId_fkey` (`featId`),
  CONSTRAINT `AdvancementFeat_advancementId_fkey` FOREIGN KEY (`advancementId`) REFERENCES `CharacterAdvancement` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `AdvancementFeat_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `AdvancementSkill`
--

DROP TABLE IF EXISTS `AdvancementSkill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `AdvancementSkill` (
  `advancementId` int NOT NULL,
  `skillId` int NOT NULL,
  `pointsSpent` int NOT NULL,
  PRIMARY KEY (`advancementId`,`skillId`),
  KEY `AdvancementSkill_skillId_fkey` (`skillId`),
  CONSTRAINT `AdvancementSkill_advancementId_fkey` FOREIGN KEY (`advancementId`) REFERENCES `CharacterAdvancement` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `AdvancementSkill_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `AdvancementSpell`
--

DROP TABLE IF EXISTS `AdvancementSpell`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `AdvancementSpell` (
  `advancementId` int NOT NULL,
  `spellId` int NOT NULL,
  PRIMARY KEY (`advancementId`,`spellId`),
  KEY `AdvancementSpell_spellId_fkey` (`spellId`),
  CONSTRAINT `AdvancementSpell_advancementId_fkey` FOREIGN KEY (`advancementId`) REFERENCES `CharacterAdvancement` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `AdvancementSpell_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Armor`
--

DROP TABLE IF EXISTS `Armor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Armor` (
  `id` int NOT NULL,
  `category` int NOT NULL,
  `bonus` int DEFAULT NULL,
  `dexterityCap` int DEFAULT NULL,
  `checkPenalty` int DEFAULT NULL,
  `arcaneSpellFailure` int DEFAULT NULL,
  `speedCapThirty` int DEFAULT NULL,
  `speedCapTwenty` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `Armor_id_fkey` FOREIGN KEY (`id`) REFERENCES `Item` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `CharacterAdvancement`
--

DROP TABLE IF EXISTS `CharacterAdvancement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `CharacterAdvancement` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterId` int NOT NULL,
  `level` int NOT NULL,
  `version` int NOT NULL,
  `classId` int NOT NULL,
  `secondaryClassId` int DEFAULT NULL,
  `hitPoints` int NOT NULL,
  `attributeId` int DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `CharacterAdvancement_characterId_level_version_key` (`characterId`,`level`,`version`),
  KEY `CharacterAdvancement_classId_fkey` (`classId`),
  KEY `CharacterAdvancement_secondaryClassId_fkey` (`secondaryClassId`),
  CONSTRAINT `CharacterAdvancement_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `CharacterAdvancement_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `CharacterAdvancement_secondaryClassId_fkey` FOREIGN KEY (`secondaryClassId`) REFERENCES `Class` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `CharacterItem`
--

DROP TABLE IF EXISTS `CharacterItem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `CharacterItem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int DEFAULT NULL,
  `characterId` int NOT NULL,
  `baseItemId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `CharacterItem_characterId_fkey` (`characterId`),
  KEY `CharacterItem_baseItemId_fkey` (`baseItemId`),
  CONSTRAINT `CharacterItem_baseItemId_fkey` FOREIGN KEY (`baseItemId`) REFERENCES `Item` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `CharacterItem_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `CharacterItemProperty`
--

DROP TABLE IF EXISTS `CharacterItemProperty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `CharacterItemProperty` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterItemId` int NOT NULL,
  `propertyId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `CharacterItemProperty_characterItemId_fkey` (`characterItemId`),
  KEY `CharacterItemProperty_propertyId_fkey` (`propertyId`),
  CONSTRAINT `CharacterItemProperty_characterItemId_fkey` FOREIGN KEY (`characterItemId`) REFERENCES `CharacterItem` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `CharacterItemProperty_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `ItemProperty` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `CharacterSpellPreparation`
--

DROP TABLE IF EXISTS `CharacterSpellPreparation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `CharacterSpellPreparation` (
  `characterId` int NOT NULL,
  `classId` int NOT NULL,
  `spellId` int NOT NULL,
  `spellLevel` int NOT NULL,
  `quantity` int NOT NULL,
  `prepKey` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slotType` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`characterId`,`prepKey`),
  KEY `CharacterSpellPreparation_classId_fkey` (`classId`),
  KEY `CharacterSpellPreparation_spellId_fkey` (`spellId`),
  CONSTRAINT `CharacterSpellPreparation_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `CharacterSpellPreparation_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `CharacterSpellPreparation_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Class`
--

DROP TABLE IF EXISTS `Class`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Class` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abbreviation` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `editionId` int DEFAULT NULL,
  `isPrestige` tinyint(1) NOT NULL DEFAULT '0',
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  `canCastSpells` tinyint(1) NOT NULL DEFAULT '0',
  `hitDie` int NOT NULL DEFAULT '1',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `skillPoints` int NOT NULL,
  `castingAbilityId` int DEFAULT NULL,
  `babProgression` int NOT NULL,
  `fortProgression` int NOT NULL,
  `refProgression` int NOT NULL,
  `spellProgression` int DEFAULT NULL,
  `willProgression` int NOT NULL,
  `spellsKnown` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=132 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ClassFeature`
--

DROP TABLE IF EXISTS `ClassFeature`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ClassFeature` (
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `slug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ClassFeatureMap`
--

DROP TABLE IF EXISTS `ClassFeatureMap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ClassFeatureMap` (
  `classId` int NOT NULL,
  `featureSlug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `level` int NOT NULL,
  PRIMARY KEY (`classId`,`featureSlug`),
  KEY `ClassFeatureMap_featureSlug_fkey` (`featureSlug`),
  CONSTRAINT `ClassFeatureMap_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ClassFeatureMap_featureSlug_fkey` FOREIGN KEY (`featureSlug`) REFERENCES `ClassFeature` (`slug`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ClassFeatureProgression`
--

DROP TABLE IF EXISTS `ClassFeatureProgression`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ClassFeatureProgression` (
  `featureSlug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `classId` int NOT NULL,
  `level` int NOT NULL,
  `aspect` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `valueInt` int DEFAULT NULL,
  `valueString` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`featureSlug`,`classId`,`level`,`aspect`),
  KEY `ClassFeatureProgression_classId_fkey` (`classId`),
  CONSTRAINT `ClassFeatureProgression_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ClassFeatureProgression_featureSlug_fkey` FOREIGN KEY (`featureSlug`) REFERENCES `ClassFeature` (`slug`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ClassProficiencies`
--

DROP TABLE IF EXISTS `ClassProficiencies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ClassProficiencies` (
  `classId` int NOT NULL,
  `featId` int NOT NULL,
  `itemId` int NOT NULL,
  PRIMARY KEY (`classId`,`featId`,`itemId`),
  KEY `ClassProficiencies_featId_fkey` (`featId`),
  KEY `ClassProficiencies_itemId_fkey` (`itemId`),
  CONSTRAINT `ClassProficiencies_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ClassProficiencies_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ClassProficiencies_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ClassSkillMap`
--

DROP TABLE IF EXISTS `ClassSkillMap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ClassSkillMap` (
  `classId` int NOT NULL,
  `skillId` int NOT NULL,
  PRIMARY KEY (`classId`,`skillId`),
  KEY `ClassSkillMap_skillId_fkey` (`skillId`),
  CONSTRAINT `ClassSkillMap_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ClassSkillMap_skillId_fkey` FOREIGN KEY (`skillId`) REFERENCES `Skill` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ClassSourceMap`
--

DROP TABLE IF EXISTS `ClassSourceMap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ClassSourceMap` (
  `classId` int NOT NULL,
  `pageNumber` int DEFAULT NULL,
  `sourceBookId` int NOT NULL,
  PRIMARY KEY (`classId`,`sourceBookId`),
  KEY `ClassSourceMap_sourceBookId_fkey` (`sourceBookId`),
  CONSTRAINT `ClassSourceMap_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ClassSourceMap_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `DiceBoxAdminConfig`
--

DROP TABLE IF EXISTS `DiceBoxAdminConfig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `DiceBoxAdminConfig` (
  `id` int NOT NULL AUTO_INCREMENT,
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
  `themeColor` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '#2e8555',
  `scale` double NOT NULL DEFAULT '6',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Default Configuration',
  `iconColor` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Feat`
--

DROP TABLE IF EXISTS `Feat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Feat` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `typeId` int NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `benefit` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `normalEffect` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `specialEffect` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `prerequisites` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `repeatable` tinyint(1) DEFAULT NULL,
  `fighterBonus` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=322 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `FeatBenefitMap`
--

DROP TABLE IF EXISTS `FeatBenefitMap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `FeatBenefitMap` (
  `featId` int NOT NULL,
  `typeId` int NOT NULL,
  `referenceId` int DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `index` int NOT NULL,
  PRIMARY KEY (`featId`,`index`),
  CONSTRAINT `FeatBenefitMap_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `FeatPrerequisiteMap`
--

DROP TABLE IF EXISTS `FeatPrerequisiteMap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `FeatPrerequisiteMap` (
  `featId` int NOT NULL,
  `typeId` int NOT NULL,
  `referenceId` int DEFAULT NULL,
  `amount` int DEFAULT NULL,
  `index` int NOT NULL,
  `featureSlug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`featId`,`index`),
  CONSTRAINT `FeatPrerequisiteMap_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Item`
--

DROP TABLE IF EXISTS `Item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Item` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `cost` decimal(10,2) DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `typeId` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `Item_typeId_fkey` (`typeId`),
  CONSTRAINT `Item_typeId_fkey` FOREIGN KEY (`typeId`) REFERENCES `ItemType` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=780 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ItemProperty`
--

DROP TABLE IF EXISTS `ItemProperty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ItemProperty` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('Material','Enhancement','SpecialAbility','Structural') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `flatCostModifier` int DEFAULT NULL,
  `costMultiplier` double DEFAULT NULL,
  `costFormula` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enhancementBonusValue` int DEFAULT NULL,
  `bonusEquivalentModifier` int DEFAULT NULL,
  `exclusiveMaterial` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ItemPropertyAppliesTo`
--

DROP TABLE IF EXISTS `ItemPropertyAppliesTo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ItemPropertyAppliesTo` (
  `id` int NOT NULL AUTO_INCREMENT,
  `propertyId` int NOT NULL,
  `itemType` enum('Weapon','Armor','Shield','MountArmor','Ammunition') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ItemPropertyAppliesTo_propertyId_fkey` (`propertyId`),
  CONSTRAINT `ItemPropertyAppliesTo_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `ItemProperty` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ItemPropertyIncompatibility`
--

DROP TABLE IF EXISTS `ItemPropertyIncompatibility`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ItemPropertyIncompatibility` (
  `id` int NOT NULL AUTO_INCREMENT,
  `propertyAId` int NOT NULL,
  `propertyBId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ItemPropertyIncompatibility_propertyAId_fkey` (`propertyAId`),
  KEY `ItemPropertyIncompatibility_propertyBId_fkey` (`propertyBId`),
  CONSTRAINT `ItemPropertyIncompatibility_propertyAId_fkey` FOREIGN KEY (`propertyAId`) REFERENCES `ItemProperty` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ItemPropertyIncompatibility_propertyBId_fkey` FOREIGN KEY (`propertyBId`) REFERENCES `ItemProperty` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ItemTemplate`
--

DROP TABLE IF EXISTS `ItemTemplate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ItemTemplate` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `itemId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ItemTemplate_itemId_fkey` (`itemId`),
  CONSTRAINT `ItemTemplate_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `Item` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ItemTemplateProperty`
--

DROP TABLE IF EXISTS `ItemTemplateProperty`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ItemTemplateProperty` (
  `id` int NOT NULL AUTO_INCREMENT,
  `templateId` int NOT NULL,
  `propertyId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ItemTemplateProperty_templateId_fkey` (`templateId`),
  KEY `ItemTemplateProperty_propertyId_fkey` (`propertyId`),
  CONSTRAINT `ItemTemplateProperty_propertyId_fkey` FOREIGN KEY (`propertyId`) REFERENCES `ItemProperty` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ItemTemplateProperty_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `ItemTemplate` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ItemType`
--

DROP TABLE IF EXISTS `ItemType`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ItemType` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Race`
--

DROP TABLE IF EXISTS `Race`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Race` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `editionId` int DEFAULT NULL,
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `sizeId` int NOT NULL DEFAULT '5',
  `speed` int NOT NULL DEFAULT '30',
  `favoredClassId` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `RaceAbilityAdjustment`
--

DROP TABLE IF EXISTS `RaceAbilityAdjustment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `RaceAbilityAdjustment` (
  `raceId` int NOT NULL,
  `abilityId` int NOT NULL,
  `value` int NOT NULL,
  PRIMARY KEY (`raceId`,`abilityId`),
  CONSTRAINT `RaceAbilityAdjustment_raceId_fkey` FOREIGN KEY (`raceId`) REFERENCES `Race` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `RaceLanguageMap`
--

DROP TABLE IF EXISTS `RaceLanguageMap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `RaceLanguageMap` (
  `raceId` int NOT NULL,
  `languageId` int NOT NULL,
  `isAutomatic` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`raceId`,`languageId`),
  CONSTRAINT `RaceLanguageMap_raceId_fkey` FOREIGN KEY (`raceId`) REFERENCES `Race` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `RaceSourceMap`
--

DROP TABLE IF EXISTS `RaceSourceMap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `RaceSourceMap` (
  `raceId` int NOT NULL,
  `sourceBookId` int NOT NULL,
  `pageNumber` int DEFAULT NULL,
  PRIMARY KEY (`raceId`,`sourceBookId`),
  KEY `RaceSourceMap_sourceBookId_fkey` (`sourceBookId`),
  CONSTRAINT `RaceSourceMap_raceId_fkey` FOREIGN KEY (`raceId`) REFERENCES `Race` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `RaceSourceMap_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `RaceTrait`
--

DROP TABLE IF EXISTS `RaceTrait`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `RaceTrait` (
  `slug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `hasValue` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `RaceTraitMap`
--

DROP TABLE IF EXISTS `RaceTraitMap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `RaceTraitMap` (
  `raceId` int NOT NULL,
  `value` int DEFAULT NULL,
  `traitSlug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`raceId`,`traitSlug`),
  KEY `RaceTraitMap_traitSlug_fkey` (`traitSlug`),
  CONSTRAINT `RaceTraitMap_raceId_fkey` FOREIGN KEY (`raceId`) REFERENCES `Race` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `RaceTraitMap_traitSlug_fkey` FOREIGN KEY (`traitSlug`) REFERENCES `RaceTrait` (`slug`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ReferenceTable`
--

DROP TABLE IF EXISTS `ReferenceTable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ReferenceTable` (
  `slug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ReferenceTableCell`
--

DROP TABLE IF EXISTS `ReferenceTableCell`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ReferenceTableCell` (
  `tableSlug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `columnIndex` int NOT NULL,
  `rowIndex` int NOT NULL,
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `colSpan` int DEFAULT NULL,
  `rowSpan` int DEFAULT NULL,
  PRIMARY KEY (`tableSlug`,`columnIndex`,`rowIndex`),
  KEY `ReferenceTableCell_tableSlug_rowIndex_fkey` (`tableSlug`,`rowIndex`),
  CONSTRAINT `ReferenceTableCell_tableSlug_columnIndex_fkey` FOREIGN KEY (`tableSlug`, `columnIndex`) REFERENCES `ReferenceTableColumn` (`tableSlug`, `index`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ReferenceTableCell_tableSlug_fkey` FOREIGN KEY (`tableSlug`) REFERENCES `ReferenceTable` (`slug`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `ReferenceTableCell_tableSlug_rowIndex_fkey` FOREIGN KEY (`tableSlug`, `rowIndex`) REFERENCES `ReferenceTableRow` (`tableSlug`, `index`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ReferenceTableColumn`
--

DROP TABLE IF EXISTS `ReferenceTableColumn`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ReferenceTableColumn` (
  `tableSlug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `index` int NOT NULL,
  `header` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `span` int DEFAULT NULL,
  `alignment` enum('left','center','right') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`tableSlug`,`index`),
  CONSTRAINT `ReferenceTableColumn_tableSlug_fkey` FOREIGN KEY (`tableSlug`) REFERENCES `ReferenceTable` (`slug`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ReferenceTableRow`
--

DROP TABLE IF EXISTS `ReferenceTableRow`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ReferenceTableRow` (
  `tableSlug` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `index` int NOT NULL,
  PRIMARY KEY (`tableSlug`,`index`),
  CONSTRAINT `ReferenceTableRow_tableSlug_fkey` FOREIGN KEY (`tableSlug`) REFERENCES `ReferenceTable` (`slug`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Skill`
--

DROP TABLE IF EXISTS `Skill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Skill` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilityId` int NOT NULL DEFAULT '1',
  `checkDescription` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `actionDescription` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `retryTypeId` int DEFAULT NULL,
  `retryDescription` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `specialNotes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `synergyNotes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `untrainedNotes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `affectedByArmor` tinyint(1) NOT NULL DEFAULT '0',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `trainedOnly` tinyint(1) DEFAULT NULL,
  `restrictionNotes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SourceBook`
--

DROP TABLE IF EXISTS `SourceBook`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SourceBook` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `abbreviation` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `releaseDate` datetime(3) DEFAULT NULL,
  `editionId` int DEFAULT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=146 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Spell`
--

DROP TABLE IF EXISTS `Spell`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Spell` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `summary` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `castingTime` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `range` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rangeTypeId` int DEFAULT NULL,
  `rangeValue` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `savingThrow` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `spellResistance` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `editionId` int NOT NULL,
  `baseLevel` int NOT NULL,
  `effect` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2800 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SpellComponentMap`
--

DROP TABLE IF EXISTS `SpellComponentMap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SpellComponentMap` (
  `spellId` int NOT NULL,
  `componentId` int NOT NULL,
  PRIMARY KEY (`spellId`,`componentId`),
  CONSTRAINT `SpellComponentMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SpellDescriptorMap`
--

DROP TABLE IF EXISTS `SpellDescriptorMap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SpellDescriptorMap` (
  `spellId` int NOT NULL,
  `descriptorId` int NOT NULL,
  PRIMARY KEY (`spellId`,`descriptorId`),
  CONSTRAINT `SpellDescriptorMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SpellLevelMap`
--

DROP TABLE IF EXISTS `SpellLevelMap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SpellLevelMap` (
  `classId` int NOT NULL,
  `spellId` int NOT NULL,
  `level` int NOT NULL,
  `isVisible` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`spellId`,`classId`),
  KEY `SpellLevelMap_classId_fkey` (`classId`),
  CONSTRAINT `SpellLevelMap_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `SpellLevelMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SpellPreparationMetamagic`
--

DROP TABLE IF EXISTS `SpellPreparationMetamagic`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SpellPreparationMetamagic` (
  `characterId` int NOT NULL,
  `prepKey` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `featId` int NOT NULL,
  PRIMARY KEY (`characterId`,`prepKey`,`featId`),
  KEY `SpellPreparationMetamagic_featId_fkey` (`featId`),
  CONSTRAINT `SpellPreparationMetamagic_characterId_prepKey_fkey` FOREIGN KEY (`characterId`, `prepKey`) REFERENCES `CharacterSpellPreparation` (`characterId`, `prepKey`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `SpellPreparationMetamagic_featId_fkey` FOREIGN KEY (`featId`) REFERENCES `Feat` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SpellSchoolMap`
--

DROP TABLE IF EXISTS `SpellSchoolMap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SpellSchoolMap` (
  `spellId` int NOT NULL,
  `schoolId` int NOT NULL,
  PRIMARY KEY (`spellId`,`schoolId`),
  CONSTRAINT `SpellSchoolMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SpellSourceMap`
--

DROP TABLE IF EXISTS `SpellSourceMap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SpellSourceMap` (
  `spellId` int NOT NULL,
  `sourceBookId` int NOT NULL,
  `pageNumber` int DEFAULT NULL,
  PRIMARY KEY (`spellId`,`sourceBookId`),
  KEY `SpellSourceMap_sourceBookId_fkey` (`sourceBookId`),
  CONSTRAINT `SpellSourceMap_sourceBookId_fkey` FOREIGN KEY (`sourceBookId`) REFERENCES `SourceBook` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `SpellSourceMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `SpellSubschoolMap`
--

DROP TABLE IF EXISTS `SpellSubschoolMap`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `SpellSubschoolMap` (
  `spellId` int NOT NULL,
  `subSchoolId` int NOT NULL,
  PRIMARY KEY (`spellId`,`subSchoolId`),
  CONSTRAINT `SpellSubschoolMap_spellId_fkey` FOREIGN KEY (`spellId`) REFERENCES `Spell` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `User`
--

DROP TABLE IF EXISTS `User`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `User` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `isAdmin` tinyint(1) NOT NULL DEFAULT '0',
  `createdAt` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` datetime(3) NOT NULL,
  `preferredEditionId` int DEFAULT NULL,
  `diceConfigBase` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `User_diceConfigBase_fkey` (`diceConfigBase`),
  CONSTRAINT `User_diceConfigBase_fkey` FOREIGN KEY (`diceConfigBase`) REFERENCES `DiceBoxAdminConfig` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserCharacter`
--

DROP TABLE IF EXISTS `UserCharacter`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserCharacter` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `name` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `raceId` int NOT NULL,
  `alignmentId` int NOT NULL,
  `age` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  `weight` int DEFAULT NULL,
  `eyes` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hair` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `xp` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `UserCharacter_raceId_fkey` (`raceId`),
  KEY `UserCharacter_userId_fkey` (`userId`),
  CONSTRAINT `UserCharacter_raceId_fkey` FOREIGN KEY (`raceId`) REFERENCES `Race` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `UserCharacter_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserCharacterAttribute`
--

DROP TABLE IF EXISTS `UserCharacterAttribute`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserCharacterAttribute` (
  `id` int NOT NULL AUTO_INCREMENT,
  `characterId` int NOT NULL,
  `attributeId` int NOT NULL,
  `value` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `UserCharacterAttribute_characterId_fkey` (`characterId`),
  CONSTRAINT `UserCharacterAttribute_characterId_fkey` FOREIGN KEY (`characterId`) REFERENCES `UserCharacter` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `UserDiceConfigOverride`
--

DROP TABLE IF EXISTS `UserDiceConfigOverride`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `UserDiceConfigOverride` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `propertyName` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `propertyValue` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserDiceConfigOverride_userId_propertyName_key` (`userId`,`propertyName`),
  CONSTRAINT `UserDiceConfigOverride_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `Weapon`
--

DROP TABLE IF EXISTS `Weapon`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `Weapon` (
  `id` int NOT NULL,
  `category` int NOT NULL,
  `damageSmall` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `damageMedium` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `critical` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `range` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` int NOT NULL,
  `attackBonus` int DEFAULT NULL,
  `damageType` varchar(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reach` tinyint(1) NOT NULL DEFAULT '0',
  `double` tinyint(1) NOT NULL DEFAULT '0',
  `nonlethal` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  CONSTRAINT `Weapon_id_fkey` FOREIGN KEY (`id`) REFERENCES `Item` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-02 14:17:52
