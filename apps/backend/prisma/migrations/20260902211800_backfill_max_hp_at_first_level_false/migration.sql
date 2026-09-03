-- First add-column migration stored true for every existing row.
-- The option is opt-in; nobody set it explicitly.

UPDATE `CharacterConfig`
SET `maxHpAtFirstLevel` = false;
