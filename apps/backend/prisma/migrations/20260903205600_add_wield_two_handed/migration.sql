-- One-handed melee used in two hands (1.5x STR). Ignored when off-hand is a weapon.

ALTER TABLE `CharacterAttackDefinition`
    ADD COLUMN `wieldTwoHanded` BOOLEAN NOT NULL DEFAULT false;
