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
  `display` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`book_id`),
  UNIQUE KEY `uq_abbrev_edition` (`abbrev_title`,`edition_id`),
  KEY `fk_books_edition` (`edition_id`),
  CONSTRAINT `fk_books_edition` FOREIGN KEY (`edition_id`) REFERENCES `editions` (`edition_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=146 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
