import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'unimaps.db');
export const db = new DatabaseSync(dbPath);

db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS campuses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    state TEXT NOT NULL,
    center_lat REAL NOT NULL,
    center_lng REAL NOT NULL,
    default_zoom INTEGER NOT NULL DEFAULT 16,
    gate_lat REAL NOT NULL,
    gate_lng REAL NOT NULL,
    gate_label TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS places (
    id TEXT PRIMARY KEY,
    campus_id TEXT NOT NULL REFERENCES campuses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    is_promoted INTEGER NOT NULL DEFAULT 0,
    promo_tag TEXT,
    status TEXT NOT NULL DEFAULT 'approved',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id TEXT PRIMARY KEY,
    place_id TEXT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL DEFAULT 'Student',
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_places_campus ON places(campus_id, status);
  CREATE INDEX IF NOT EXISTS idx_reviews_place ON reviews(place_id);

  CREATE TABLE IF NOT EXISTS promotions (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL DEFAULT 'place',
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    amount_ngn INTEGER NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    tagline TEXT NOT NULL DEFAULT '',
    contact TEXT NOT NULL,
    event_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending_review',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

export function seedIfEmpty() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM campuses').get();
  if (count > 0) return;

  const insertCampus = db.prepare(`
    INSERT INTO campuses (id, name, short_name, state, center_lat, center_lng, default_zoom, gate_lat, gate_lng, gate_label)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const campuses = [
    ['funaab', 'Federal University of Agriculture, Abeokuta', 'FUNAAB', 'Ogun State', 7.2296, 3.4388, 16, 7.2189, 3.4352, 'FUNAAB Main Gate'],
    ['mapoly', 'Moshood Abiola Polytechnic, Abeokuta', 'MAPOLY', 'Ogun State', 7.1055, 3.3292, 16, 7.1012, 3.3264, 'MAPOLY Main Gate'],
    ['futa', 'Federal University of Technology, Akure', 'FUTA', 'Ondo State', 7.3025, 5.1370, 16, 7.3075, 5.1398, 'FUTA North Gate'],
  ];

  for (const c of campuses) insertCampus.run(...c);

  const insertPlace = db.prepare(`
    INSERT INTO places (id, campus_id, name, category, description, lat, lng, is_promoted, promo_tag)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const places = [
    // FUNAAB (Ogun State)
    ['funaab-main-gate', 'funaab', 'FUNAAB Main Gate', 'gate', 'Primary campus entrance along Alabata Road with shuttle & keke park.', 7.2189, 3.4352, 0, null],
    ['funaab-senate', 'funaab', 'Senate Building', 'admin', 'Central administration, Vice-Chancellor office, and student affairs.', 7.2299, 3.4382, 0, null],
    ['funaab-1000-seater', 'funaab', '1000-Seater Lecture Theatre', 'academic', 'Major auditorium for 100-level general courses and orientation.', 7.2283, 3.4396, 0, null],
    ['funaab-colphys', 'funaab', 'COLPHYS (Physical Sciences)', 'academic', 'Departments of Computer Science, Physics, Mathematics & Chemistry.', 7.2314, 3.4408, 0, null],
    ['funaab-library', 'funaab', 'Nimbe Adedipe Library', 'academic', 'Main university library with e-learning wing and 24hr reading room.', 7.2291, 3.4371, 0, null],
    ['funaab-health', 'funaab', 'FUNAAB Health Centre', 'health', '24/7 campus clinic and emergency medical unit for students.', 7.2268, 3.4362, 0, null],
    ['funaab-sub-food', 'funaab', 'SUB & Campus Food Court', 'food', 'Affordable student buka, snacks, printing & cybercafe hub.', 7.2275, 3.4389, 1, 'Popular Spot'],
    ['funaab-camp-lodges', 'funaab', 'Camp Junction / Isolu Lodges', 'housing', 'Off-campus student hostels, supermarkets, and shuttle drop-off.', 7.2145, 3.4335, 1, 'Featured Area'],
    ['funaab-atm', 'funaab', 'Campus ATM Gallery', 'service', 'Cluster of GTBank, Access, UBA & Zenith ATMs near SUB.', 7.2279, 3.4384, 0, null],

    // MAPOLY (Ogun State)
    ['mapoly-gate', 'mapoly', 'MAPOLY Main Gate (Ojere)', 'gate', 'Main campus entrance with Ojere cab & shuttle park.', 7.1012, 3.3264, 0, null],
    ['mapoly-admin', 'mapoly', 'Rectorate & Admin Block', 'admin', 'Central polytechnic administration, admissions & bursary.', 7.1051, 3.3289, 0, null],
    ['mapoly-ict', 'mapoly', 'ICT & Mass Comm Complex', 'academic', 'Computer Science labs, CBT hall, and Mass Communication studios.', 7.1063, 3.3298, 0, null],
    ['mapoly-library', 'mapoly', 'Salawu Abiola Memorial Library', 'academic', 'Central study halls and digital reference library.', 7.1058, 3.3282, 0, null],
    ['mapoly-food', 'mapoly', 'Ojere Student Market & Buka', 'food', 'Quick meals, photocopy centres, and student stationery shops.', 7.1038, 3.3278, 1, 'Featured Hub'],
    ['mapoly-lodges', 'mapoly', 'Oluwo / Onikolobo Student Lodges', 'housing', 'Popular off-campus student hostels along Ojere road.', 7.1088, 3.3315, 1, 'Featured Area'],

    // FUTA (Ondo State)
    ['futa-north-gate', 'futa', 'FUTA North Gate (Main Gate)', 'gate', 'Main entrance off Akure-Ilesha Expressway with campus shuttle stand.', 7.3075, 5.1398, 0, null],
    ['futa-south-gate', 'futa', 'FUTA South Gate (Obanla)', 'gate', 'Pedestrian & shuttle gate connecting directly to Obanla hostels.', 7.2968, 5.1342, 0, null],
    ['futa-senate', 'futa', 'Senate Building (Obanla)', 'admin', 'Central administration, registry, and bursary.', 7.3018, 5.1365, 0, null],
    ['futa-auditorium', 'futa', '2500-Seater Auditorium (Obakekere)', 'academic', 'Main large lecture auditorium for general studies and exams.', 7.3036, 5.1379, 0, null],
    ['futa-library', 'futa', 'Albert Ilemobade Library', 'academic', 'Main campus library and digital research commons.', 7.3011, 5.1355, 0, null],
    ['futa-seet', 'futa', 'SEET Building (Engineering)', 'academic', 'School of Engineering and Engineering Technology complex.', 7.3031, 5.1348, 0, null],
    ['futa-health', 'futa', 'FUTA Health Centre', 'health', 'University medical centre and student clinic.', 7.2995, 5.1361, 0, null],
    ['futa-obanla-food', 'futa', 'Obanla Food & Print Hub', 'food', 'Fast student meals, cold drinks, and project printing.', 7.2989, 5.1352, 1, 'Featured Vendor'],
    ['futa-akindeko', 'futa', 'Akindeko Hostel', 'housing', 'On-campus student hall of residence.', 7.2982, 5.1376, 0, null],
    ['futa-apatapiti', 'futa', 'Apatapiti / West Gate Lodges', 'housing', 'High-density off-campus student apartments and mini-marts.', 7.3042, 5.1312, 1, 'Featured Area'],
  ];

  for (const p of places) insertPlace.run(...p);

  const insertReview = db.prepare(`
    INSERT INTO reviews (id, place_id, author_name, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `);

  const reviews = [
    ['rev-1', 'funaab-1000-seater', 'Tunde (100L)', 5, 'Saved me on my first day—right beside COLPHYS!'],
    ['rev-2', 'funaab-sub-food', 'Amaka', 5, 'Best jollof & quick print shop between lectures.'],
    ['rev-3', 'mapoly-ict', 'Kemi (ND2)', 5, 'Easy to locate from Ojere gate once you follow the walkway.'],
    ['rev-4', 'futa-obanla-food', 'Dami (SEET)', 5, 'Fast printing and affordable student meals.'],
  ];

  for (const r of reviews) insertReview.run(...r);
}
