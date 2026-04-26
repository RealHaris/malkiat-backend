INSERT INTO "amenities" ("slug", "name", "category", "subcategory", "value_type", "value_options", "is_active")
VALUES
  ('main-elevator-lift', 'Elevator/Lift', 'Main Features', NULL, 'boolean', '[]'::jsonb, true),
  ('main-cctv-camera', 'CCTV Camera', 'Main Features', NULL, 'boolean', '[]'::jsonb, true),
  ('main-accessing-boulevard', 'Accessing Boulevard', 'Main Features', NULL, 'boolean', '[]'::jsonb, true),
  ('utilities-sewerage', 'Sewerage', 'Utilities', NULL, 'boolean', '[]'::jsonb, true),
  ('utilities-electricity', 'Electricity', 'Utilities', NULL, 'boolean', '[]'::jsonb, true),
  ('utilities-water-supply', 'Water Supply', 'Utilities', NULL, 'boolean', '[]'::jsonb, true),
  ('utilities-gas', 'Gas', 'Utilities', NULL, 'boolean', '[]'::jsonb, true),
  ('secondary-floor-unit-number', 'Which floor is your unit on', 'Secondary Features', NULL, 'number', '[]'::jsonb, true),
  ('secondary-facing', 'Facing', 'Secondary Features', NULL, 'text', '[]'::jsonb, true)
ON CONFLICT ("slug") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "category" = EXCLUDED."category",
  "subcategory" = EXCLUDED."subcategory",
  "value_type" = EXCLUDED."value_type",
  "value_options" = EXCLUDED."value_options",
  "is_active" = true,
  "updated_at" = NOW();
