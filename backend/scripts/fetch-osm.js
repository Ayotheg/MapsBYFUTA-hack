import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'data', 'places.json');

// Bounding boxes: [south, west, north, east]
const CAMPUSES = [
  {
    id: 'funaab',
    name: 'Federal University of Agriculture, Abeokuta',
    short_name: 'FUNAAB',
    state: 'Ogun State',
    center_lat: 7.2296,
    center_lng: 3.4388,
    default_zoom: 16,
    gate_lat: 7.2189,
    gate_lng: 3.4352,
    gate_label: 'FUNAAB Main Gate',
    bbox: [7.212, 3.428, 7.240, 3.452],
  },
  {
    id: 'mapoly',
    name: 'Moshood Abiola Polytechnic, Abeokuta',
    short_name: 'MAPOLY',
    state: 'Ogun State',
    center_lat: 7.1055,
    center_lng: 3.3292,
    default_zoom: 16,
    gate_lat: 7.1012,
    gate_lng: 3.3264,
    gate_label: 'MAPOLY Main Gate',
    bbox: [7.095, 3.318, 7.116, 3.340],
  },
  {
    id: 'futa',
    name: 'Federal University of Technology, Akure',
    short_name: 'FUTA',
    state: 'Ondo State',
    center_lat: 7.3025,
    center_lng: 5.137,
    default_zoom: 16,
    gate_lat: 7.3075,
    gate_lng: 5.1398,
    gate_label: 'FUTA North Gate',
    bbox: [7.292, 5.124, 7.313, 5.150],
  },
];

function classifyTags(tags = {}) {
  const name = (tags.name || '').toLowerCase();
  if (tags.amenity === 'restaurant' || tags.amenity === 'fast_food' || tags.amenity === 'cafe' || tags.shop === 'supermarket' || tags.shop === 'convenience' || name.includes('food') || name.includes('buka') || name.includes('cafe')) {
    return 'food';
  }
  if (tags.amenity === 'hospital' || tags.amenity === 'clinic' || tags.amenity === 'pharmacy' || name.includes('health') || name.includes('clinic')) {
    return 'health';
  }
  if (tags.amenity === 'bank' || tags.amenity === 'atm' || tags.amenity === 'fuel' || name.includes('bank') || name.includes('atm')) {
    return 'service';
  }
  if (tags.building === 'dormitory' || tags.tourism === 'hostel' || name.includes('hostel') || name.includes('hall') || name.includes('lodge')) {
    return 'housing';
  }
  if (tags.barrier === 'gate' || tags.highway === 'bus_stop' || name.includes('gate') || name.includes('park')) {
    return 'gate';
  }
  if (name.includes('senate') || name.includes('admin') || name.includes('registry') || name.includes('rector') || name.includes('bursary')) {
    return 'admin';
  }
  return 'academic';
}

async function fetchCampusOsm(campus) {
  const [s, w, n, e] = campus.bbox;
  const query = `
    [out:json][timeout:25];
    (
      node["name"](${s},${w},${n},${e});
      way["name"]["building"](${s},${w},${n},${e});
      way["name"]["amenity"](${s},${w},${n},${e});
    );
    out center 60;
  `;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
  ];

  let res;
  for (const endpoint of endpoints) {
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Accept: 'application/json',
          'User-Agent': 'UnimapsHackathon/1.0 (https://github.com/unimaps)',
        },
        body: `data=${encodeURIComponent(query)}`,
      });
      if (res.ok) break;
    } catch {
      // try next mirror
    }
  }

  if (!res || !res.ok) {
    throw new Error(`Overpass HTTP ${res?.status || 'network'} for ${campus.id}`);
  }

  const json = await res.json();
  const seen = new Set();
  const results = [];

  for (const el of json.elements || []) {
    const name = el.tags?.name?.trim();
    if (!name || name.length < 2) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;

    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;

    seen.add(key);
    results.push({
      id: `osm-${campus.id}-${el.type}-${el.id}`,
      campus_id: campus.id,
      name,
      category: classifyTags(el.tags),
      description: el.tags?.description || el.tags?.['addr:street'] || `${campus.short_name} OpenStreetMap landmark`,
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      sequence: results.length + 1,
      is_promoted: false,
      promo_tag: null,
      source: 'openstreetmap',
    });
  }

  return results;
}

async function main() {
  const allPlaces = [];
  for (const campus of CAMPUSES) {
    try {
      console.log(`Fetching OSM places for ${campus.short_name}...`);
      const items = await fetchCampusOsm(campus);
      console.log(`  -> Got ${items.length} places from OpenStreetMap for ${campus.short_name}`);
      allPlaces.push(...items);
    } catch (err) {
      console.warn(`  -> Failed Overpass for ${campus.short_name}: ${err.message}`);
    }
  }

  if (allPlaces.length === 0) {
    console.error('No places fetched from Overpass. Keeping existing places.json if present.');
    process.exit(1);
  }

  const payload = {
    generated_at: new Date().toISOString(),
    attribution: '© OpenStreetMap contributors (Overpass API)',
    campuses: CAMPUSES.map(({ bbox, ...rest }) => rest),
    places: allPlaces,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(`Saved ${allPlaces.length} total OSM places to ${outPath}`);
}

main();
