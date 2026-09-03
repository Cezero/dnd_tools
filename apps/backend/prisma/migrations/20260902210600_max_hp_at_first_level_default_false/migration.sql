-- Checkbox is opt-in. Existing rows keep their stored value.

ALTER TABLE `CharacterConfig`
    ALTER COLUMN `maxHpAtFirstLevel` SET DEFAULT false;
