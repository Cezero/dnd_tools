-- Character-level stand-in until campaign settings exist.
-- Official 3.0/3.5: maximum Hit Die at 1st level (default true).

ALTER TABLE `CharacterConfig`
    ADD COLUMN `maxHpAtFirstLevel` BOOLEAN NOT NULL DEFAULT true;
