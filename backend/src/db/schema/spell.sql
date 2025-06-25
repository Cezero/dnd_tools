
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
  `spell_id` int unsigned NOT NULL,
  `desc_id` int unsigned NOT NULL,
  PRIMARY KEY (`spell_id`,`desc_id`),
  KEY `spell_descriptor_map_ibfk_1` (`desc_id`),
  CONSTRAINT `fk_sdesc_school_id` FOREIGN KEY (`spell_id`) REFERENCES `spells` (`spell_id`) ON DELETE CASCADE ON UPDATE CASCADE
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
  `display` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`spell_id`,`class_id`),
  KEY `fk_spell_levels_class` (`class_id`),
  KEY `id_spell_level_map_spell_id` (`spell_id`),
  KEY `spell_level_map_spell_id_IDX` (`spell_id`,`class_id`,`display`) USING BTREE,
  CONSTRAINT `fk_spell_levels_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`class_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_spell_levels_spell` FOREIGN KEY (`spell_id`) REFERENCES `spells` (`spell_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  CONSTRAINT `fk_ss_school_id` FOREIGN KEY (`spell_id`) REFERENCES `spells` (`spell_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  `display` tinyint(1) DEFAULT '1',
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
  CONSTRAINT `fk_ssub_school_id` FOREIGN KEY (`spell_id`) REFERENCES `spells` (`spell_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
  `cast_time` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `spell_range` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `spell_range_id` int unsigned DEFAULT NULL,
  `spell_range_value` varchar(200) DEFAULT NULL,
  `spell_area` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `spell_duration` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `spell_save` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `spell_resistance` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `edition_id` int unsigned NOT NULL,
  `spell_level` int unsigned NOT NULL,
  `spell_effect` varchar(200) DEFAULT NULL,
  `spell_target` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`spell_id`),
  KEY `id_spells_spell_id_edition_id` (`spell_id`,`edition_id`),
  KEY `id_spells_edition_id` (`edition_id`),
  CONSTRAINT `fk_spells_edition` FOREIGN KEY (`edition_id`) REFERENCES `editions` (`edition_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2800 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
