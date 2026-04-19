INSERT INTO "amenities" ("slug", "name", "category", "subcategory", "value_type", "value_options", "is_active")
VALUES
  -- Main Features
  ('main-flooring', 'Flooring', 'Main Features', NULL, 'select', '["Tiles","Marble","Wooden","Chip","Cement","Other"]'::jsonb, true),
  ('main-electricity-backup', 'Electricity Backup', 'Main Features', NULL, 'select', '["None","Generator","UPS","Solar","Other"]'::jsonb, true),
  ('main-view', 'View', 'Main Features', NULL, 'text', '[]'::jsonb, true),
  ('main-other-features', 'Other Main Features', 'Main Features', NULL, 'text', '[]'::jsonb, true),
  ('main-built-in-year', 'Built in year', 'Main Features', NULL, 'number', '[]'::jsonb, true),
  ('main-parking-spaces', 'Parking Spaces', 'Main Features', NULL, 'number', '[]'::jsonb, true),
  ('main-floors', 'Floors', 'Main Features', NULL, 'number', '[]'::jsonb, true),
  ('main-double-glazed-windows', 'Double Glazed Windows', 'Main Features', NULL, 'boolean', '[]'::jsonb, true),
  ('main-central-ac', 'Central Air Conditioning', 'Main Features', NULL, 'boolean', '[]'::jsonb, true),
  ('main-central-heating', 'Central Heating', 'Main Features', NULL, 'boolean', '[]'::jsonb, true),
  ('main-waste-disposal', 'Waste Disposal', 'Main Features', NULL, 'boolean', '[]'::jsonb, true),
  ('main-furnished', 'Furnished', 'Main Features', NULL, 'boolean', '[]'::jsonb, true),

  -- Rooms
  ('rooms-other-rooms', 'Other Rooms', 'Rooms', NULL, 'text', '[]'::jsonb, true),
  ('rooms-bedrooms', 'Bedrooms', 'Rooms', NULL, 'number', '[]'::jsonb, true),
  ('rooms-bathrooms', 'Bathrooms', 'Rooms', NULL, 'number', '[]'::jsonb, true),
  ('rooms-servant-quarters', 'Servant Quarters', 'Rooms', NULL, 'number', '[]'::jsonb, true),
  ('rooms-kitchens', 'Kitchens', 'Rooms', NULL, 'number', '[]'::jsonb, true),
  ('rooms-store-rooms', 'Store Rooms', 'Rooms', NULL, 'number', '[]'::jsonb, true),
  ('rooms-drawing-room', 'Drawing Room', 'Rooms', NULL, 'boolean', '[]'::jsonb, true),
  ('rooms-dining-room', 'Dining Room', 'Rooms', NULL, 'boolean', '[]'::jsonb, true),
  ('rooms-study-room', 'Study Room', 'Rooms', NULL, 'boolean', '[]'::jsonb, true),
  ('rooms-prayer-room', 'Prayer Room', 'Rooms', NULL, 'boolean', '[]'::jsonb, true),
  ('rooms-powder-room', 'Powder Room', 'Rooms', NULL, 'boolean', '[]'::jsonb, true),
  ('rooms-gym', 'Gym', 'Rooms', NULL, 'boolean', '[]'::jsonb, true),
  ('rooms-steam-room', 'Steam Room', 'Rooms', NULL, 'boolean', '[]'::jsonb, true),
  ('rooms-lounge-sitting-room', 'Lounge or Sitting Room', 'Rooms', NULL, 'boolean', '[]'::jsonb, true),
  ('rooms-laundry-room', 'Laundry Room', 'Rooms', NULL, 'boolean', '[]'::jsonb, true),

  -- Business and Communication
  ('business-other-facilities', 'Other Business and Communication Facilities', 'Business and Communication', NULL, 'text', '[]'::jsonb, true),
  ('business-broadband', 'Broadband Internet Access', 'Business and Communication', NULL, 'boolean', '[]'::jsonb, true),
  ('business-cable-tv', 'Satellite or Cable TV Ready', 'Business and Communication', NULL, 'boolean', '[]'::jsonb, true),
  ('business-intercom', 'Intercom', 'Business and Communication', NULL, 'boolean', '[]'::jsonb, true),

  -- Community Features
  ('community-other-facilities', 'Other Community Facilities', 'Community Features', NULL, 'text', '[]'::jsonb, true),
  ('community-lawn-garden', 'Community Lawn or Garden', 'Community Features', NULL, 'boolean', '[]'::jsonb, true),
  ('community-swimming-pool', 'Community Swimming Pool', 'Community Features', NULL, 'boolean', '[]'::jsonb, true),
  ('community-gym', 'Community Gym', 'Community Features', NULL, 'boolean', '[]'::jsonb, true),
  ('community-first-aid-centre', 'First Aid or Medical Centre', 'Community Features', NULL, 'boolean', '[]'::jsonb, true),
  ('community-day-care', 'Day Care Centre', 'Community Features', NULL, 'boolean', '[]'::jsonb, true),
  ('community-kids-play-area', 'Kids Play Area', 'Community Features', NULL, 'boolean', '[]'::jsonb, true),
  ('community-barbeque-area', 'Barbeque Area', 'Community Features', NULL, 'boolean', '[]'::jsonb, true),
  ('community-mosque', 'Mosque', 'Community Features', NULL, 'boolean', '[]'::jsonb, true),
  ('community-centre', 'Community Centre', 'Community Features', NULL, 'boolean', '[]'::jsonb, true),

  -- Healthcare Recreational
  ('health-other-facilities', 'Other Healthcare and Recreation Facilities', 'Healthcare Recreational', NULL, 'text', '[]'::jsonb, true),
  ('health-lawn-garden', 'Lawn or Garden', 'Healthcare Recreational', NULL, 'boolean', '[]'::jsonb, true),
  ('health-swimming-pool', 'Swimming Pool', 'Healthcare Recreational', NULL, 'boolean', '[]'::jsonb, true),
  ('health-sauna', 'Sauna', 'Healthcare Recreational', NULL, 'boolean', '[]'::jsonb, true),
  ('health-jacuzzi', 'Jacuzzi', 'Healthcare Recreational', NULL, 'boolean', '[]'::jsonb, true),

  -- Nearby Locations and Other Facilities
  ('nearby-schools', 'Nearby Schools', 'Nearby Locations and Other Facilities', NULL, 'text', '[]'::jsonb, true),
  ('nearby-hospitals', 'Nearby Hospitals', 'Nearby Locations and Other Facilities', NULL, 'text', '[]'::jsonb, true),
  ('nearby-shopping-malls', 'Nearby Shopping Malls', 'Nearby Locations and Other Facilities', NULL, 'text', '[]'::jsonb, true),
  ('nearby-restaurants', 'Nearby Restaurants', 'Nearby Locations and Other Facilities', NULL, 'text', '[]'::jsonb, true),
  ('nearby-airport-distance-km', 'Distance From Airport (kms)', 'Nearby Locations and Other Facilities', NULL, 'number', '[]'::jsonb, true),
  ('nearby-public-transport', 'Nearby Public Transport Service', 'Nearby Locations and Other Facilities', NULL, 'text', '[]'::jsonb, true),
  ('nearby-other-places', 'Other Nearby Places', 'Nearby Locations and Other Facilities', NULL, 'text', '[]'::jsonb, true),

  -- Other Facilities
  ('other-facilities-text', 'Other Facilities', 'Other Facilities', NULL, 'text', '[]'::jsonb, true),
  ('other-maintenance-staff', 'Maintenance Staff', 'Other Facilities', NULL, 'boolean', '[]'::jsonb, true),
  ('other-security-staff', 'Security Staff', 'Other Facilities', NULL, 'boolean', '[]'::jsonb, true),
  ('other-facilities-disabled', 'Facilities for Disabled', 'Other Facilities', NULL, 'boolean', '[]'::jsonb, true)
ON CONFLICT ("slug") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "category" = EXCLUDED."category",
  "subcategory" = EXCLUDED."subcategory",
  "value_type" = EXCLUDED."value_type",
  "value_options" = EXCLUDED."value_options",
  "is_active" = true,
  "updated_at" = NOW();
