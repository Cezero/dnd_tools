
--
-- Table structure for table `race_ability_adjustments`
--

DROP TABLE IF EXISTS `race_ability_adjustments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `race_ability_adjustments` (
  `race_id` int unsigned NOT NULL,
  `ability_id` tinyint unsigned NOT NULL,
  `ability_adjustment` tinyint NOT NULL,
  PRIMARY KEY (`race_id`,`ability_id`),
  CONSTRAINT `race_attribute_adjustments_races_FK` FOREIGN KEY (`race_id`) REFERENCES `races` (`race_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `race_language_map`
--

DROP TABLE IF EXISTS `race_language_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `race_language_map` (
  `race_id` int unsigned NOT NULL,
  `language_id` int unsigned NOT NULL,
  `automatic` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`race_id`,`language_id`),
  CONSTRAINT `racial_language_map_races_FK` FOREIGN KEY (`race_id`) REFERENCES `races` (`race_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `race_trait_map`
--

DROP TABLE IF EXISTS `race_trait_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `race_trait_map` (
  `race_id` int unsigned NOT NULL,
  `trait_value` varchar(100) DEFAULT NULL,
  `trait_slug` varchar(100) NOT NULL,
  PRIMARY KEY (`trait_slug`,`race_id`),
  KEY `race_trait_map_races_FK` (`race_id`),
  CONSTRAINT `race_trait_map_race_traits_FK` FOREIGN KEY (`trait_slug`) REFERENCES `race_traits` (`trait_slug`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `race_trait_map_races_FK` FOREIGN KEY (`race_id`) REFERENCES `races` (`race_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `race_traits`
--

DROP TABLE IF EXISTS `race_traits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `race_traits` (
  `trait_description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `value_flag` tinyint(1) NOT NULL DEFAULT '0',
  `trait_name` varchar(100) DEFAULT NULL,
  `trait_slug` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`trait_slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `races`
--

DROP TABLE IF EXISTS `races`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `races` (
  `race_id` int unsigned NOT NULL AUTO_INCREMENT,
  `race_name` varchar(100) NOT NULL,
  `edition_id` int unsigned DEFAULT NULL,
  `display` tinyint(1) DEFAULT '1',
  `race_description` text,
  `size_id` tinyint unsigned NOT NULL DEFAULT '5',
  `race_speed` tinyint unsigned NOT NULL DEFAULT '30',
  `favored_class_id` smallint NOT NULL DEFAULT '0',
  PRIMARY KEY (`race_id`),
  KEY `fk_races_edition` (`edition_id`),
  CONSTRAINT `fk_races_edition` FOREIGN KEY (`edition_id`) REFERENCES `editions` (`edition_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
