WITH incoming_areas (city, name, country_code, latitude, longitude, is_active) AS (
  VALUES
    ('Karachi', '141 Broadway Heights', 'PK', 24.837312, 67.069697, true),
    ('Karachi', 'Abid Town', 'PK', 24.925015565389632, 67.08423561783258, true),
    ('Karachi', 'Ablagh-e-Ama CHS', 'PK', 24.929572051224046, 67.1592698813156, true),
    ('Karachi', 'Abul Hassan Isphani Road', 'PK', 24.9383826, 67.1017004, true),
    ('Karachi', 'Abuzar CHS', 'PK', 25.00790667329283, 67.1267141503605, true),
    ('Karachi', 'Adamjee Nagar Society', 'PK', 24.8796288858661, 67.0842738972225, true),
    ('Karachi', 'Afridi Colony', 'PK', 24.9188433652525, 66.9758857166837, true),
    ('Karachi', 'Agha Town', 'PK', 24.864642253635438, 67.21000138998332, true),
    ('Karachi', 'Ahsanabad', 'PK', 25.003083, 67.11226, true),
    ('Karachi', 'Ahsan Town', 'PK', 24.98637155433091, 67.16844604325176, true),
    ('Karachi', 'Airforce Housing Scheme', 'PK', 24.9570648, 67.2167201, true),
    ('Karachi', 'Ajmer Moinia CHS', 'PK', 24.987696882848113, 67.12583410933418, true),
    ('Karachi', 'Akhtar Colony', 'PK', 24.839711, 67.073918, true),
    ('Karachi', 'Al-Ameen Society', 'PK', 24.8727458, 67.1930025, true),
    ('Karachi', 'Alamgir Road', 'PK', 24.882887, 67.066457, true),
    ('Karachi', 'Al Ashraf CHS', 'PK', 24.964014469925267, 67.10519136983726, true),
    ('Karachi', 'Al Falah Extension', 'PK', 24.879272066104804, 67.17949383202637, true),
    ('Karachi', 'Al Falah Society', 'PK', 24.876684, 67.175888, true),
    ('Karachi', 'Al Habib CHS', 'PK', 24.992842571198448, 67.13037675063123, true),
    ('Karachi', 'Al-Hamra Cooperative Housing Society', 'PK', 24.8735411514385, 67.0808039853135, true)
),
normalized_incoming AS (
  SELECT
    city,
    name,
    country_code,
    latitude,
    longitude,
    is_active,
    regexp_replace(lower(name), '[^a-z0-9]+', '', 'g') AS normalized_name
  FROM incoming_areas
),
matched_existing AS (
  SELECT
    a.id,
    ni.latitude,
    ni.longitude,
    ni.is_active
  FROM normalized_incoming ni
  JOIN "areas" a
    ON lower(a.city) = lower(ni.city)
   AND (
     lower(a.name) = lower(ni.name)
     OR regexp_replace(lower(a.name), '[^a-z0-9]+', '', 'g') = ni.normalized_name
   )
),
updated_existing AS (
  UPDATE "areas" a
  SET
    latitude = COALESCE(a.latitude, me.latitude),
    longitude = COALESCE(a.longitude, me.longitude),
    is_active = CASE WHEN a.is_active THEN a.is_active ELSE me.is_active END,
    updated_at = NOW()
  FROM matched_existing me
  WHERE a.id = me.id
  RETURNING a.id
)
INSERT INTO "areas" ("city", "name", "country_code", "latitude", "longitude", "is_active")
SELECT ni.city, ni.name, ni.country_code, ni.latitude, ni.longitude, ni.is_active
FROM normalized_incoming ni
WHERE NOT EXISTS (
  SELECT 1
  FROM "areas" a
  WHERE lower(a.city) = lower(ni.city)
    AND (
      lower(a.name) = lower(ni.name)
      OR regexp_replace(lower(a.name), '[^a-z0-9]+', '', 'g') = ni.normalized_name
    )
);
