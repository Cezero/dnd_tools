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
