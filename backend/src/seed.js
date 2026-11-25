import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db, seedIfEmpty } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const placesJsonPath = path.join(__dirname, '..', 'data', 'places.json');

export function seedFromPlacesJson() {
  // Ensure base campuses + curated landmarks exist first
  seedIfEmpty();

  // Add sequence column if migrating an existing DB file
  const cols = db.prepare('PRAGMA table_info(places)').all();
  if (!cols.some((c) => c.name === 'sequence')) {
    db.exec('ALTER TABLE places ADD COLUMN sequence INTEGER NOT NULL DEFAULT 0');
  }

  if (!fs.existsSync(placesJsonPath)) return { campuses: 0, places: 0 };

  const raw = JSON.parse(fs.readFileSync(placesJsonPath, 'utf8'));

  const upsertCampus = db.prepare(`
    INSERT INTO campuses (id, name, short_name, state, center_lat, center_lng, default_zoom, gate_lat, gate_lng, gate_label)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      short_name = excluded.short_name,
      state = excluded.state,
      center_lat = excluded.center_lat,
      center_lng = excluded.center_lng,
      default_zoom = excluded.default_zoom,
      gate_lat = excluded.gate_lat,
      gate_lng = excluded.gate_lng,
      gate_label = excluded.gate_label
  `);

  for (const c of raw.campuses || []) {
    upsertCampus.run(
      c.id,
      c.name,
      c.short_name,
      c.state,
      c.center_lat,
      c.center_lng,
      c.default_zoom || 16,
      c.gate_lat,
      c.gate_lng,
      c.gate_label || 'Main Gate'
    );
  }

  const upsertPlace = db.prepare(`
    INSERT INTO places (id, campus_id, name, category, description, lat, lng, sequence, is_promoted, promo_tag, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved')
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      description = excluded.description,
      lat = excluded.lat,
      lng = excluded.lng,
      sequence = excluded.sequence
  `);

  let count = 0;
  for (const p of raw.places || []) {
    upsertPlace.run(
      p.id,
      p.campus_id,
      p.name,
      p.category || 'academic',
      p.description || '',
      Number(p.lat),
      Number(p.lng),
      Number(p.sequence || count + 1),
      p.is_promoted ? 1 : 0,
      p.promo_tag || null
    );
    count += 1;
  }

  return { campuses: (raw.campuses || []).length, places: count };
}

// Allow running directly: `npm run seed`
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = seedFromPlacesJson();
  console.log(`Seeded ${result.campuses} campuses and upserted ${result.places} OSM places from places.json`);
}
