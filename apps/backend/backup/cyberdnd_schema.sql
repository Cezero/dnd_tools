/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.11-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: cybersql    Database: cyberdnd_old
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
-- Table structure for table `armor`
--

DROP TABLE IF EXISTS `armor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `armor` (
  `armor_id` int unsigned NOT NULL AUTO_INCREMENT,
  `armor_name` varchar(100) NOT NULL,
  `armor_description` text,
  `armor_category` tinyint unsigned NOT NULL,
  `armor_cost` decimal(5,2) DEFAULT NULL,
  `armor_bonus` tinyint unsigned DEFAULT NULL,
  `armor_dex_cap` tinyint unsigned DEFAULT NULL,
  `armor_check_penalty` tinyint DEFAULT NULL,
  `armor_arcane_spell_failure` tinyint unsigned DEFAULT NULL,
  `armor_speed_cap_thirty` tinyint unsigned DEFAULT NULL,
  `armor_speed_cap_twenty` tinyint unsigned DEFAULT NULL,
  `armor_weight` tinyint unsigned DEFAULT NULL,
  PRIMARY KEY (`armor_id`,`armor_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_features`
--

DROP TABLE IF EXISTS `class_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_features` (
  `class_id` int unsigned NOT NULL,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `level` tinyint unsigned DEFAULT NULL,
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`),
  KEY `class_features_class_id_IDX` (`class_id`,`id`) USING BTREE,
  CONSTRAINT `class_features_classes_FK` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_level_attributes`
--

DROP TABLE IF EXISTS `class_level_attributes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_level_attributes` (
  `id` int unsigned NOT NULL,
  `level` tinyint unsigned NOT NULL,
  `base_attack_bonus` tinyint unsigned NOT NULL,
  `fort_save` tinyint unsigned NOT NULL,
  `ref_save` tinyint unsigned NOT NULL,
  `will_save` tinyint unsigned NOT NULL,
  PRIMARY KEY (`id`,`level`),
  CONSTRAINT `class_level_attributes_classes_FK` FOREIGN KEY (`id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_level_spells`
--

DROP TABLE IF EXISTS `class_level_spells`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_level_spells` (
  `id` int unsigned NOT NULL,
  `level` tinyint unsigned NOT NULL,
  `spell_level` tinyint unsigned NOT NULL,
  PRIMARY KEY (`id`,`level`,`spell_level`),
  CONSTRAINT `class_level_spells_classes_FK` FOREIGN KEY (`id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_skill_map`
--

DROP TABLE IF EXISTS `class_skill_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_skill_map` (
  `id` int unsigned NOT NULL,
  `skill_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`,`skill_id`),
  KEY `class_skill_map_skills_FK` (`skill_id`),
  CONSTRAINT `class_skill_map_classes_FK` FOREIGN KEY (`id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `class_skill_map_skills_FK` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_source_map`
--

DROP TABLE IF EXISTS `class_source_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_source_map` (
  `id` int unsigned NOT NULL,
  `book_id` int unsigned NOT NULL,
  `page_number` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`,`book_id`),
  KEY `fk_class_sources_book` (`book_id`),
  CONSTRAINT `fk_class_sources_book` FOREIGN KEY (`book_id`) REFERENCES `source_books` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_class_sources_class` FOREIGN KEY (`id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `abbr` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `edition_id` int unsigned DEFAULT NULL,
  `is_prestige` tinyint(1) NOT NULL DEFAULT '0',
  `display` tinyint(1) DEFAULT '1',
  `can_cast` tinyint(1) DEFAULT '0',
  `hit_die` int unsigned NOT NULL DEFAULT '1',
  `desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `skill_points` tinyint unsigned NOT NULL,
  `cast_ability` tinyint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_class_abbreviation_edition` (`abbr`,`edition_id`),
  KEY `fk_classes_edition` (`edition_id`),
  KEY `classes_dice_FK` (`hit_die`)
) ENGINE=InnoDB AUTO_INCREMENT=132 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feat_benefit_map`
--

DROP TABLE IF EXISTS `feat_benefit_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `feat_benefit_map` (
  `feat_id` int unsigned NOT NULL,
  `type` tinyint unsigned NOT NULL,
  `reference_id` int unsigned DEFAULT NULL COMMENT 'This maps to the skill, attribute or save ID that the benefit applies to',
  `amount` tinyint unsigned DEFAULT NULL COMMENT 'Bonus applied',
  `index` tinyint unsigned NOT NULL,
  PRIMARY KEY (`feat_id`,`index`),
  CONSTRAINT `feat_benefit_map_feats_FK` FOREIGN KEY (`feat_id`) REFERENCES `feats` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feat_prereq_map`
--

DROP TABLE IF EXISTS `feat_prereq_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `feat_prereq_map` (
  `feat_id` int unsigned NOT NULL,
  `type` tinyint unsigned NOT NULL COMMENT 'Maps to the type of prereq associated with this feat',
  `amount` tinyint unsigned DEFAULT NULL COMMENT 'How much of ''type'' is required to qualify for this feat',
  `reference_id` int unsigned DEFAULT NULL COMMENT 'ID of the prereq type to check for qualification',
  `index` tinyint unsigned NOT NULL,
  PRIMARY KEY (`feat_id`,`index`),
  CONSTRAINT `feat_prereq_map_feats_FK` FOREIGN KEY (`feat_id`) REFERENCES `feats` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feats`
--

DROP TABLE IF EXISTS `feats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `feats` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `type` tinyint unsigned NOT NULL,
  `desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `benefit_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `normal_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `special_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `prereq_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `can_take_repeat` tinyint(1) DEFAULT NULL,
  `is_fighter_bonus` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `race_ability_adjustments`
--

DROP TABLE IF EXISTS `race_ability_adjustments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `race_ability_adjustments` (
  `id` int unsigned NOT NULL,
  `ability_id` tinyint unsigned NOT NULL,
  `adjustment` tinyint NOT NULL,
  PRIMARY KEY (`id`,`ability_id`),
  CONSTRAINT `race_attribute_adjustments_races_FK` FOREIGN KEY (`id`) REFERENCES `races` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `race_language_map`
--

DROP TABLE IF EXISTS `race_language_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `race_language_map` (
  `id` int unsigned NOT NULL,
  `language_id` int unsigned NOT NULL,
  `is_automatic` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`,`language_id`),
  CONSTRAINT `racial_language_map_races_FK` FOREIGN KEY (`id`) REFERENCES `races` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `race_source_map`
--

DROP TABLE IF EXISTS `race_source_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `race_source_map` (
  `id` int unsigned NOT NULL,
  `book_id` int unsigned NOT NULL,
  `page_number` smallint unsigned NOT NULL,
  PRIMARY KEY (`id`,`book_id`),
  KEY `race_source_map_source_books_FK` (`book_id`),
  CONSTRAINT `race_source_map_races_FK` FOREIGN KEY (`id`) REFERENCES `races` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `race_source_map_source_books_FK` FOREIGN KEY (`book_id`) REFERENCES `source_books` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `race_trait_map`
--

DROP TABLE IF EXISTS `race_trait_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `race_trait_map` (
  `id` int unsigned NOT NULL,
  `value` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `slug` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`id`,`slug`),
  KEY `race_trait_map_race_traits_FK` (`slug`),
  CONSTRAINT `race_trait_map_race_traits_FK` FOREIGN KEY (`slug`) REFERENCES `race_traits` (`slug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `race_trait_map_races_FK` FOREIGN KEY (`id`) REFERENCES `races` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `race_traits`
--

DROP TABLE IF EXISTS `race_traits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `race_traits` (
  `desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `has_value` tinyint(1) NOT NULL DEFAULT '0',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `slug` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `races`
--

DROP TABLE IF EXISTS `races`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `races` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `edition_id` int unsigned DEFAULT NULL,
  `display` tinyint(1) DEFAULT '1',
  `desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `size_id` tinyint unsigned NOT NULL DEFAULT '5',
  `speed` tinyint unsigned NOT NULL DEFAULT '30',
  `favored_class_id` smallint NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_races_edition` (`edition_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reference_table_cells`
--

DROP TABLE IF EXISTS `reference_table_cells`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reference_table_cells` (
  `id` int NOT NULL AUTO_INCREMENT,
  `row_id` int NOT NULL,
  `column_id` int NOT NULL,
  `value` text,
  `col_span` int DEFAULT '1',
  `row_span` int DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `row_id` (`row_id`),
  KEY `column_id` (`column_id`),
  CONSTRAINT `reference_table_cells_ibfk_1` FOREIGN KEY (`row_id`) REFERENCES `reference_table_rows` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reference_table_cells_ibfk_2` FOREIGN KEY (`column_id`) REFERENCES `reference_table_columns` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=753 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reference_table_columns`
--

DROP TABLE IF EXISTS `reference_table_columns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reference_table_columns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `table_id` int NOT NULL,
  `column_index` int NOT NULL,
  `header` varchar(255) NOT NULL,
  `span` int DEFAULT '1',
  `alignment` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `table_id` (`table_id`),
  CONSTRAINT `reference_table_columns_ibfk_1` FOREIGN KEY (`table_id`) REFERENCES `reference_tables` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=127 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reference_table_rows`
--

DROP TABLE IF EXISTS `reference_table_rows`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reference_table_rows` (
  `id` int NOT NULL AUTO_INCREMENT,
  `table_id` int NOT NULL,
  `row_index` int NOT NULL,
  `label` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `table_id` (`table_id`),
  CONSTRAINT `reference_table_rows_ibfk_1` FOREIGN KEY (`table_id`) REFERENCES `reference_tables` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=299 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reference_tables`
--

DROP TABLE IF EXISTS `reference_tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reference_tables` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `slug` char(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference_tables_slug_IDX` (`slug`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `skills`
--

DROP TABLE IF EXISTS `skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `skills` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `skill_abbr` varchar(10) DEFAULT NULL,
  `ability_id` int unsigned NOT NULL DEFAULT '1',
  `check_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `action_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `retry_id` tinyint unsigned DEFAULT NULL,
  `retry_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `special_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `synergy_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `untrained_desc` varchar(200) DEFAULT NULL,
  `ac_penalty_applies` tinyint(1) NOT NULL DEFAULT '0',
  `desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `trained_only` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `skills_attributes_FK` (`ability_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `source_books`
--

DROP TABLE IF EXISTS `source_books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `source_books` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `abbr` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `release_date` date DEFAULT NULL,
  `edition_id` int unsigned DEFAULT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  `desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `display` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_abbrev_edition` (`abbr`,`edition_id`),
  KEY `fk_books_edition` (`edition_id`)
) ENGINE=InnoDB AUTO_INCREMENT=146 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_component_map`
--

DROP TABLE IF EXISTS `spell_component_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_component_map` (
  `id` int unsigned NOT NULL,
  `comp_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`,`comp_id`),
  KEY `comp_id` (`comp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_descriptor_map`
--

DROP TABLE IF EXISTS `spell_descriptor_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_descriptor_map` (
  `id` int unsigned NOT NULL,
  `desc_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`,`desc_id`),
  KEY `spell_descriptor_map_ibfk_1` (`desc_id`),
  CONSTRAINT `fk_sdesc_school_id` FOREIGN KEY (`id`) REFERENCES `spells` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_level_map`
--

DROP TABLE IF EXISTS `spell_level_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_level_map` (
  `id` int unsigned NOT NULL,
  `class_id` int unsigned NOT NULL,
  `level` tinyint unsigned DEFAULT NULL,
  `display` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`,`class_id`),
  KEY `fk_spell_levels_class` (`class_id`),
  KEY `id_spell_level_map_spell_id` (`id`),
  KEY `spell_level_map_spell_id_IDX` (`id`,`class_id`,`display`) USING BTREE,
  CONSTRAINT `fk_spell_levels_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_spell_levels_spell` FOREIGN KEY (`id`) REFERENCES `spells` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_school_map`
--

DROP TABLE IF EXISTS `spell_school_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_school_map` (
  `id` int unsigned NOT NULL,
  `school_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`,`school_id`),
  KEY `fk_spell_school_id` (`school_id`),
  CONSTRAINT `fk_ss_school_id` FOREIGN KEY (`id`) REFERENCES `spells` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_source_map`
--

DROP TABLE IF EXISTS `spell_source_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_source_map` (
  `id` int unsigned NOT NULL,
  `book_id` int unsigned NOT NULL,
  `page_number` int unsigned NOT NULL,
  `display` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`,`book_id`),
  KEY `fk_spell_sources_book` (`book_id`),
  CONSTRAINT `fk_spell_sources_book` FOREIGN KEY (`book_id`) REFERENCES `source_books` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ssource_school_id` FOREIGN KEY (`id`) REFERENCES `spells` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_subschool_map`
--

DROP TABLE IF EXISTS `spell_subschool_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_subschool_map` (
  `id` int unsigned NOT NULL,
  `sub_id` int unsigned NOT NULL,
  PRIMARY KEY (`id`,`sub_id`),
  KEY `fk_spell_subschool_id` (`sub_id`),
  CONSTRAINT `fk_ssub_school_id` FOREIGN KEY (`id`) REFERENCES `spells` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spells`
--

DROP TABLE IF EXISTS `spells`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spells` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `summary` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `cast_time` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `range_str` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `range_id` int unsigned DEFAULT NULL,
  `range_value` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `area_desc` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `duration_desc` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `save_desc` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `sr_desc` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `edition_id` int unsigned NOT NULL,
  `base_level` int unsigned NOT NULL,
  `effect_desc` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `target_desc` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_spells_spell_id_edition_id` (`id`,`edition_id`),
  KEY `id_spells_edition_id` (`edition_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2800 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_char_attr_map`
--

DROP TABLE IF EXISTS `user_char_attr_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_char_attr_map` (
  `character_id` int unsigned NOT NULL,
  `attribute_id` int unsigned NOT NULL,
  `value` int unsigned NOT NULL DEFAULT '3',
  KEY `user_char_attr_map_attributes_FK` (`attribute_id`),
  KEY `user_char_attr_map_user_characters_FK` (`character_id`),
  CONSTRAINT `user_char_attr_map_user_characters_FK` FOREIGN KEY (`character_id`) REFERENCES `user_characters` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_characters`
--

DROP TABLE IF EXISTS `user_characters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_characters` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `race_id` int unsigned DEFAULT NULL,
  `alignment_id` int unsigned DEFAULT NULL,
  `age` int unsigned DEFAULT NULL,
  `height` int unsigned DEFAULT NULL,
  `weight` int unsigned DEFAULT NULL,
  `eyes` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `hair` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `gender` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_characters_character_id_IDX` (`id`,`user_id`) USING BTREE,
  KEY `fk_character_user_id` (`user_id`),
  KEY `user_characters_races_FK` (`race_id`),
  KEY `user_characters_alignments_FK` (`alignment_id`),
  CONSTRAINT `fk_character_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_characters_races_FK` FOREIGN KEY (`race_id`) REFERENCES `races` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `preferred_edition_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_users_preferred_edition` (`preferred_edition_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `weapon_dmg_type_map`
--

DROP TABLE IF EXISTS `weapon_dmg_type_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `weapon_dmg_type_map` (
  `weapon_id` int unsigned NOT NULL,
  `damage_type` tinyint unsigned NOT NULL,
  PRIMARY KEY (`weapon_id`,`damage_type`),
  CONSTRAINT `weapon_dmg_type_map_weapons_FK` FOREIGN KEY (`weapon_id`) REFERENCES `weapons` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `weapons`
--

DROP TABLE IF EXISTS `weapons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `weapons` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `category` tinyint unsigned NOT NULL,
  `type` tinyint unsigned NOT NULL,
  `cost_gp` decimal(5,2) DEFAULT NULL,
  `dmg_s` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `dmg_m` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `crit_str` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `range_str` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `weight` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-28 11:19:57
