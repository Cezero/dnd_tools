-- Remap FeatureEntity.appliesToSubId for skills from 1-based SkillSubtype
-- ordinals (old seed) to SkillSubtype.id (what display and class-skill
-- matching use). Idempotent: skips rows whose appliesToSubId already
-- joins SkillSubtype for that skill. Leaves null and -1 (all subtypes) alone.
--
-- EntityAppliesToType.Skill = 1
-- Example: Druid Knowledge (nature) 7 -> 92; Gnome Alchemy Craft 1 -> 2.

UPDATE FeatureEntity fe
JOIN (
  SELECT id, skillId,
         ROW_NUMBER() OVER (PARTITION BY skillId ORDER BY id) AS ordinal
  FROM SkillSubtype
) ranked
  ON ranked.skillId = fe.appliesToId
 AND ranked.ordinal = fe.appliesToSubId
SET fe.appliesToSubId = ranked.id
WHERE fe.appliesTo = 1
  AND fe.appliesToSubId IS NOT NULL
  AND fe.appliesToSubId > 0
  AND NOT EXISTS (
    SELECT 1 FROM SkillSubtype ss
    WHERE ss.id = fe.appliesToSubId AND ss.skillId = fe.appliesToId
  );

-- Verify: every remaining specific subtype should join a name.
-- SELECT fe.id, f.slug, fe.appliesToId, fe.appliesToSubId, ss.name
-- FROM FeatureEntity fe
-- JOIN Feature f ON f.id = fe.featureId
-- LEFT JOIN SkillSubtype ss ON ss.id = fe.appliesToSubId AND ss.skillId = fe.appliesToId
-- WHERE fe.appliesTo = 1 AND fe.appliesToSubId IS NOT NULL AND fe.appliesToSubId != -1;
