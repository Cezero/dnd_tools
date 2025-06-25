
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
  CONSTRAINT `user_char_attr_map_user_characters_FK` FOREIGN KEY (`character_id`) REFERENCES `user_characters` (`character_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_characters`
--

DROP TABLE IF EXISTS `user_characters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_characters` (
  `character_id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `character_name` varchar(200) NOT NULL,
  `race_id` int unsigned DEFAULT NULL,
  `alignment_id` int unsigned DEFAULT NULL,
  `character_age` int unsigned DEFAULT NULL,
  `character_height` int unsigned DEFAULT NULL,
  `character_weight` int unsigned DEFAULT NULL,
  `character_eyes` varchar(100) DEFAULT NULL,
  `character_hair` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`character_id`),
  UNIQUE KEY `user_characters_character_id_IDX` (`character_id`,`user_id`) USING BTREE,
  KEY `fk_character_user_id` (`user_id`),
  KEY `user_characters_races_FK` (`race_id`),
  KEY `user_characters_alignments_FK` (`alignment_id`),
  CONSTRAINT `fk_character_user_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `user_characters_races_FK` FOREIGN KEY (`race_id`) REFERENCES `races` (`race_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
