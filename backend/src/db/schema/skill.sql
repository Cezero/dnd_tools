--
-- Table structure for table `skills`
--

DROP TABLE IF EXISTS `skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `skills` (
  `skill_id` int unsigned NOT NULL AUTO_INCREMENT,
  `skill_name` varchar(100) NOT NULL,
  `skill_abbr` varchar(10) DEFAULT NULL,
  `ability_id` int unsigned NOT NULL DEFAULT '1',
  `skill_check` text,
  `skill_action` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `skill_try_again` tinyint(1) DEFAULT NULL,
  `skill_try_again_desc` text CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `skill_special` text,
  `skill_synergy_desc` text,
  `untrained_desc` varchar(200) DEFAULT NULL,
  `skill_armor_check_penalty` tinyint(1) NOT NULL DEFAULT '0',
  `skill_description` text,
  `trained_only` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`skill_id`),
  KEY `skills_attributes_FK` (`ability_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
