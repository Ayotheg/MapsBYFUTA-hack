import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/funaab'
});

// Bounding box around FUNAAB Permanent Site, Alabata, Abeokuta
const BBOX = '7.205,3.415,7.245,3.460';

const OVERPASS_QUERY = `
[out:json][timeout:30];
(
  node["name"](${BBOX});
  way["name"](${BBOX});
  relation["name"](${BBOX});
);
out center;
`;

async function seed() {
  console.log('Fetching FUNAAB data from OpenStreetMap...');
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });

  if (!res.ok) throw new Error(`Overpass error: ${res.status}`);
  const data = await res.json();

  let inserted = 0;
  for (const el of data.elements) {
    const name = el.tags?.name;
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!name || !lat || !lng) continue;

    const category =
      el.tags?.amenity ||
      el.tags?.building ||
      el.tags?.leisure ||
      el.tags?.shop ||
      'campus';

    await pool.query(
      `INSERT INTO places (osm_id, name, category, lat, lng)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (osm_id) DO NOTHING`,
      [String(el.id), name, category, lat, lng]
    );
    inserted++;
  }

  console.log(`Done! Seeded ${inserted} FUNAAB places into PostgreSQL.`);
  await pool.end();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});