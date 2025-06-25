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
  CONSTRAINT `weapon_dmg_type_map_weapons_FK` FOREIGN KEY (`weapon_id`) REFERENCES `weapons` (`weapon_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `weapons`
--

DROP TABLE IF EXISTS `weapons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `weapons` (
  `weapon_id` int unsigned NOT NULL AUTO_INCREMENT,
  `weapon_name` varchar(100) NOT NULL,
  `weapon_description` text,
  `weapon_category` tinyint unsigned NOT NULL,
  `weapon_type` tinyint unsigned NOT NULL,
  `weapon_cost` decimal(5,2) DEFAULT NULL,
  `weapon_dmg_s` varchar(20) DEFAULT NULL,
  `weapon_dmg_m` varchar(20) DEFAULT NULL,
  `weapon_crit` varchar(20) DEFAULT NULL,
  `weapon_range` varchar(20) DEFAULT NULL,
  `weapon_weight` decimal(5,2) DEFAULT NULL,
  PRIMARY KEY (`weapon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
