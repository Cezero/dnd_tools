
--
-- Table structure for table `feat_benefit_map`
--

DROP TABLE IF EXISTS `feat_benefit_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `feat_benefit_map` (
  `benefit_id` int unsigned NOT NULL AUTO_INCREMENT,
  `feat_id` int unsigned NOT NULL,
  `benefit_type` tinyint unsigned NOT NULL,
  `benefit_type_id` int unsigned DEFAULT NULL COMMENT 'This maps to the skill, attribute or save ID that the benefit applies to',
  `benefit_amount` tinyint unsigned DEFAULT NULL COMMENT 'Bonus applied',
  PRIMARY KEY (`benefit_id`),
  KEY `feat_benefit_map_feats_FK` (`feat_id`),
  CONSTRAINT `feat_benefit_map_feats_FK` FOREIGN KEY (`feat_id`) REFERENCES `feats` (`feat_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feat_prereq_map`
--

DROP TABLE IF EXISTS `feat_prereq_map`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `feat_prereq_map` (
  `prereq_id` int unsigned NOT NULL AUTO_INCREMENT,
  `feat_id` int unsigned NOT NULL,
  `prereq_type` tinyint unsigned NOT NULL COMMENT 'Maps to the type of prereq associated with this feat',
  `prereq_amount` tinyint unsigned DEFAULT NULL COMMENT 'How much of ''type'' is required to qualify for this feat',
  `prereq_type_id` int unsigned DEFAULT NULL COMMENT 'ID of the prereq type to check for qualification',
  PRIMARY KEY (`prereq_id`),
  KEY `feat_prereq_map_feats_FK` (`feat_id`),
  CONSTRAINT `feat_prereq_map_feats_FK` FOREIGN KEY (`feat_id`) REFERENCES `feats` (`feat_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feats`
--

DROP TABLE IF EXISTS `feats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `feats` (
  `feat_id` int unsigned NOT NULL AUTO_INCREMENT,
  `feat_name` varchar(100) NOT NULL,
  `feat_type` tinyint unsigned NOT NULL,
  `feat_description` text,
  `feat_benefit` text,
  `feat_normal` text,
  `feat_special` text,
  `feat_prereq` text,
  `feat_fighter_bonus` tinyint(1) DEFAULT NULL,
  `feat_multi_times` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`feat_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
