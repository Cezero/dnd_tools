/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.11-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: cybersql.local.cyberdeck.org    Database: cyberdnd
-- ------------------------------------------------------
-- Server version	9.3.0-router

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
-- Table structure for table `class_source_map`
--

DROP TABLE IF EXISTS `class_source_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_source_map` (
  `class_id` int unsigned NOT NULL,
  `book_id` int unsigned NOT NULL,
  `page_number` int unsigned DEFAULT NULL,
  PRIMARY KEY (`class_id`,`book_id`),
  KEY `fk_class_sources_book` (`book_id`),
  CONSTRAINT `fk_class_sources_book` FOREIGN KEY (`book_id`) REFERENCES `source_books` (`book_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_class_sources_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `class_id` int unsigned NOT NULL AUTO_INCREMENT,
  `class_name` varchar(100) NOT NULL,
  `class_abbreviation` varchar(20) NOT NULL,
  `edition_id` int unsigned DEFAULT NULL,
  `is_prestige_class` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`class_id`),
  UNIQUE KEY `uq_class_abbreviation_edition` (`class_abbreviation`,`edition_id`),
  KEY `fk_classes_edition` (`edition_id`),
  CONSTRAINT `fk_classes_edition` FOREIGN KEY (`edition_id`) REFERENCES `editions` (`edition_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=132 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `editions`
--

DROP TABLE IF EXISTS `editions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `editions` (
  `edition_id` int unsigned NOT NULL AUTO_INCREMENT,
  `edition_name` varchar(100) NOT NULL,
  `edition_abbrev` varchar(20) NOT NULL,
  PRIMARY KEY (`edition_id`),
  UNIQUE KEY `edition_abbrev` (`edition_abbrev`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `source_books`
--

DROP TABLE IF EXISTS `source_books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `source_books` (
  `book_id` int unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `abbrev_title` varchar(50) NOT NULL,
  `release_date` date DEFAULT NULL,
  `edition_id` int unsigned DEFAULT NULL,
  `sort_order` int unsigned NOT NULL DEFAULT '0',
  `summary` text,
  PRIMARY KEY (`book_id`),
  UNIQUE KEY `uq_abbrev_edition` (`abbrev_title`,`edition_id`),
  KEY `fk_books_edition` (`edition_id`),
  CONSTRAINT `fk_books_edition` FOREIGN KEY (`edition_id`) REFERENCES `editions` (`edition_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=146 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_component_map`
--

DROP TABLE IF EXISTS `spell_component_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_component_map` (
  `spell_id` int unsigned NOT NULL,
  `comp_id` int unsigned NOT NULL,
  PRIMARY KEY (`spell_id`,`comp_id`),
  KEY `comp_id` (`comp_id`),
  CONSTRAINT `spell_component_map_ibfk_1` FOREIGN KEY (`comp_id`) REFERENCES `spell_components` (`comp_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_components`
--

DROP TABLE IF EXISTS `spell_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_components` (
  `comp_id` int unsigned NOT NULL AUTO_INCREMENT,
  `comp_name` varchar(30) NOT NULL,
  `comp_abbrev` varchar(10) NOT NULL,
  PRIMARY KEY (`comp_id`),
  UNIQUE KEY `comp_name` (`comp_name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_descriptor_map`
--

DROP TABLE IF EXISTS `spell_descriptor_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_descriptor_map` (
  `spell_id` int unsigned NOT NULL,
  `desc_id` int unsigned NOT NULL,
  PRIMARY KEY (`spell_id`,`desc_id`),
  KEY `spell_descriptor_map_ibfk_1` (`desc_id`),
  CONSTRAINT `fk_sdesc_school_id` FOREIGN KEY (`spell_id`) REFERENCES `spells` (`spell_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `spell_descriptor_map_ibfk_1` FOREIGN KEY (`desc_id`) REFERENCES `spell_descriptors` (`desc_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_descriptors`
--

DROP TABLE IF EXISTS `spell_descriptors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_descriptors` (
  `desc_id` int unsigned NOT NULL AUTO_INCREMENT,
  `descriptor` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`desc_id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_domain_map`
--

DROP TABLE IF EXISTS `spell_domain_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_domain_map` (
  `spell_id` int unsigned NOT NULL,
  `domain_id` int unsigned NOT NULL,
  PRIMARY KEY (`spell_id`,`domain_id`),
  KEY `domain_id` (`domain_id`),
  CONSTRAINT `fk_sdomain_school_id` FOREIGN KEY (`spell_id`) REFERENCES `spells` (`spell_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `spell_domain_map_ibfk_1` FOREIGN KEY (`domain_id`) REFERENCES `spell_domains` (`domain_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_domains`
--

DROP TABLE IF EXISTS `spell_domains`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_domains` (
  `domain_id` int unsigned NOT NULL AUTO_INCREMENT,
  `domain_name` varchar(30) NOT NULL,
  `domain_abbrev` varchar(10) NOT NULL,
  PRIMARY KEY (`domain_id`),
  UNIQUE KEY `domain_name` (`domain_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_level_map`
--

DROP TABLE IF EXISTS `spell_level_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_level_map` (
  `spell_id` int unsigned NOT NULL,
  `class_id` int unsigned NOT NULL,
  `spell_level` tinyint unsigned DEFAULT NULL,
  PRIMARY KEY (`spell_id`,`class_id`),
  KEY `fk_spell_levels_class` (`class_id`),
  CONSTRAINT `fk_spell_levels_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_spell_levels_spell` FOREIGN KEY (`spell_id`) REFERENCES `spells` (`spell_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_ranges`
--

DROP TABLE IF EXISTS `spell_ranges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_ranges` (
  `range_id` int unsigned NOT NULL AUTO_INCREMENT,
  `range_name` varchar(30) DEFAULT NULL,
  `range_abbr` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`range_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_school_map`
--

DROP TABLE IF EXISTS `spell_school_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_school_map` (
  `spell_id` int unsigned NOT NULL,
  `school_id` int unsigned NOT NULL,
  PRIMARY KEY (`spell_id`,`school_id`),
  KEY `fk_spell_school_id` (`school_id`),
  CONSTRAINT `fk_spell_school_id` FOREIGN KEY (`school_id`) REFERENCES `spell_schools` (`school_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ss_school_id` FOREIGN KEY (`spell_id`) REFERENCES `spells` (`spell_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_schools`
--

DROP TABLE IF EXISTS `spell_schools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_schools` (
  `school_id` int unsigned NOT NULL AUTO_INCREMENT,
  `school_name` varchar(30) NOT NULL,
  `school_abbrev` varchar(10) NOT NULL,
  PRIMARY KEY (`school_id`),
  UNIQUE KEY `school_name` (`school_name`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_source_map`
--

DROP TABLE IF EXISTS `spell_source_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_source_map` (
  `spell_id` int unsigned NOT NULL,
  `book_id` int unsigned NOT NULL,
  `page_number` int unsigned NOT NULL,
  PRIMARY KEY (`spell_id`,`book_id`),
  KEY `fk_spell_sources_book` (`book_id`),
  CONSTRAINT `fk_spell_sources_book` FOREIGN KEY (`book_id`) REFERENCES `source_books` (`book_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ssource_school_id` FOREIGN KEY (`spell_id`) REFERENCES `spells` (`spell_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_subschool_map`
--

DROP TABLE IF EXISTS `spell_subschool_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_subschool_map` (
  `spell_id` int unsigned NOT NULL,
  `sub_id` int unsigned NOT NULL,
  PRIMARY KEY (`spell_id`,`sub_id`),
  KEY `fk_spell_subschool_id` (`sub_id`),
  CONSTRAINT `fk_spell_subschool_id` FOREIGN KEY (`sub_id`) REFERENCES `spell_subschools` (`sub_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_ssub_school_id` FOREIGN KEY (`spell_id`) REFERENCES `spells` (`spell_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spell_subschools`
--

DROP TABLE IF EXISTS `spell_subschools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spell_subschools` (
  `sub_id` int unsigned NOT NULL AUTO_INCREMENT,
  `subschool` varchar(100) NOT NULL,
  `school_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`sub_id`),
  UNIQUE KEY `subschool` (`subschool`),
  KEY `fk_school_id` (`school_id`),
  CONSTRAINT `fk_school_id` FOREIGN KEY (`school_id`) REFERENCES `spell_schools` (`school_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `spells`
--

DROP TABLE IF EXISTS `spells`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `spells` (
  `spell_id` int unsigned NOT NULL AUTO_INCREMENT,
  `spell_name` varchar(50) NOT NULL,
  `spell_summary` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `spell_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `cast_time` varchar(200) DEFAULT NULL,
  `spell_range` varchar(200) DEFAULT NULL,
  `spell_range_id` int unsigned DEFAULT NULL,
  `spell_range_value` varchar(200) DEFAULT NULL,
  `spell_area` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `spell_duration` varchar(200) DEFAULT NULL,
  `spell_save` varchar(200) DEFAULT NULL,
  `spell_resistance` varchar(200) DEFAULT NULL,
  `spell_effect` varchar(200) DEFAULT NULL,
  `spell_target` varchar(200) DEFAULT NULL,
  `source_id` int unsigned DEFAULT NULL,
  `page_number` int unsigned DEFAULT NULL,
  `edition_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`spell_id`),
  KEY `fk_spell_range` (`spell_range_id`),
  CONSTRAINT `fk_spell_range` FOREIGN KEY (`spell_range_id`) REFERENCES `spell_ranges` (`range_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_spell_edition` FOREIGN KEY (`edition_id`) REFERENCES `editions` (`edition_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2800 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `user_id` int unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `preferred_edition_id` int unsigned DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_users_preferred_edition` (`preferred_edition_id`),
  CONSTRAINT `fk_users_preferred_edition` FOREIGN KEY (`preferred_edition_id`) REFERENCES `editions` (`edition_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dump completed on 2025-06-08 11:03:16
