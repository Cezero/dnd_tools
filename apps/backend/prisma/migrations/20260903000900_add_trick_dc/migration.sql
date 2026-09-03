-- Handle Animal teaching DC. Existing Attack trick is DC 20 (SRD).

ALTER TABLE `Trick`
    ADD COLUMN `dc` INTEGER NOT NULL DEFAULT 15;

UPDATE `Trick`
    SET `dc` = 20
    WHERE `name` = 'Attack';
