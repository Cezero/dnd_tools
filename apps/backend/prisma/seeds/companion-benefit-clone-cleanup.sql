-- Delete leftover companion-benefit clones from the Feature + FeatureProgression merge.
-- Keep companion-{companionId}-benefit. Idempotent.

DELETE fec
FROM FeatureEntityCondition fec
JOIN FeatureEntity fe ON fe.id = fec.featureEntityId
JOIN Feature f ON f.id = fe.featureId
WHERE f.slug = 'companion-benefit'
   OR f.slug LIKE 'companion-benefit-%';

DELETE fe
FROM FeatureEntity fe
JOIN Feature f ON f.id = fe.featureId
WHERE f.slug = 'companion-benefit'
   OR f.slug LIKE 'companion-benefit-%';

DELETE FROM Feature
WHERE slug = 'companion-benefit'
   OR slug LIKE 'companion-benefit-%';
