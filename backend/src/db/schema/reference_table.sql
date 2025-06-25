
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
