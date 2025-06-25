
--
-- Table structure for table `class_features`
--

DROP TABLE IF EXISTS `class_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_features` (
  `class_id` int unsigned NOT NULL,
  `feature_name` varchar(200) NOT NULL,
  `feature_description` text,
  `feature_level` tinyint unsigned DEFAULT NULL,
  `feature_id` int unsigned NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`feature_id`),
  KEY `class_features_class_id_IDX` (`class_id`,`feature_id`) USING BTREE,
  CONSTRAINT `class_features_classes_FK` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_level_attributes`
--

DROP TABLE IF EXISTS `class_level_attributes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_level_attributes` (
  `class_id` int unsigned NOT NULL,
  `level` tinyint unsigned NOT NULL,
  `base_attack_bonus` tinyint unsigned NOT NULL,
  `fort_save` tinyint unsigned NOT NULL,
  `ref_save` tinyint unsigned NOT NULL,
  `will_save` tinyint unsigned NOT NULL,
  PRIMARY KEY (`class_id`,`level`),
  CONSTRAINT `class_level_attributes_classes_FK` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_level_spells`
--

DROP TABLE IF EXISTS `class_level_spells`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_level_spells` (
  `class_id` int unsigned NOT NULL,
  `level` tinyint unsigned NOT NULL,
  `spell_level` tinyint unsigned NOT NULL,
  PRIMARY KEY (`class_id`,`level`,`spell_level`),
  CONSTRAINT `class_level_spells_classes_FK` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_skill_map`
--

DROP TABLE IF EXISTS `class_skill_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_skill_map` (
  `class_id` int unsigned NOT NULL,
  `skill_id` int unsigned NOT NULL,
  PRIMARY KEY (`class_id`,`skill_id`),
  KEY `class_skill_map_skills_FK` (`skill_id`),
  CONSTRAINT `class_skill_map_classes_FK` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `class_skill_map_skills_FK` FOREIGN KEY (`skill_id`) REFERENCES `skills` (`skill_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

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
  `class_abbr` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `edition_id` int unsigned DEFAULT NULL,
  `is_prestige_class` tinyint(1) NOT NULL DEFAULT '0',
  `display` tinyint(1) DEFAULT '1',
  `caster` tinyint(1) DEFAULT '0',
  `hit_die` int unsigned NOT NULL DEFAULT '1',
  `class_description` text,
  `skill_points` tinyint unsigned NOT NULL,
  `cast_ability` tinyint unsigned DEFAULT NULL,
  PRIMARY KEY (`class_id`),
  UNIQUE KEY `uq_class_abbreviation_edition` (`class_abbr`,`edition_id`),
  KEY `fk_classes_edition` (`edition_id`),
  KEY `classes_dice_FK` (`hit_die`),
  CONSTRAINT `fk_classes_edition` FOREIGN KEY (`edition_id`) REFERENCES `editions` (`edition_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=132 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

