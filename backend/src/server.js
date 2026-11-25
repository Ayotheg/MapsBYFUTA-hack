import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import { db, seedIfEmpty } from './db.js';
import { getWalkingRoute } from './routing.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 5000);

seedIfEmpty();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'unimaps-backend',
    timestamp: new Date().toISOString(),
  });
});

// List all campuses
app.get('/api/campuses', (_req, res) => {
  const campuses = db.prepare('SELECT * FROM campuses ORDER BY id ASC').all();
  res.json(campuses);
});

// List places with optional filters: ?campus=funaab&category=food&q=library&promoted=1
app.get('/api/places', (req, res) => {
  const { campus, category, q, promoted } = req.query;
  const where = ["p.status = 'approved'"];
  const params = [];

  if (campus) {
    where.push('p.campus_id = ?');
    params.push(String(campus));
  }
  if (category && category !== 'all') {
    where.push('p.category = ?');
    params.push(String(category));
  }
  if (promoted === '1' || promoted === 'true') {
    where.push('p.is_promoted = 1');
  }
  if (q && String(q).trim()) {
    where.push('(LOWER(p.name) LIKE ? OR LOWER(p.description) LIKE ?)');
    const term = `%${String(q).trim().toLowerCase()}%`;
    params.push(term, term);
  }

  const sql = `
    SELECT
      p.*,
      COALESCE(ROUND(AVG(r.rating), 1), 0) AS avg_rating,
      COUNT(r.id) AS review_count
    FROM places p
    LEFT JOIN reviews r ON r.place_id = p.id
    WHERE ${where.join(' AND ')}
    GROUP BY p.id
    ORDER BY p.is_promoted DESC, p.created_at DESC
  `;

  const rows = db.prepare(sql).all(...params).map((row) => ({
    ...row,
    is_promoted: Boolean(row.is_promoted),
  }));

  res.json(rows);
});

// Suggest / add a new campus place
app.post('/api/places', (req, res) => {
  const { campus_id, name, category, description = '', lat, lng } = req.body || {};

  if (!campus_id || !name || String(name).trim().length < 2) {
    return res.status(400).json({ error: 'campus_id and name (min 2 chars) are required' });
  }
  if (typeof Number(lat) !== 'number' || Number.isNaN(Number(lat)) || Number.isNaN(Number(lng))) {
    return res.status(400).json({ error: 'Valid numeric lat and lng are required' });
  }

  const allowedCategories = ['academic', 'admin', 'housing', 'food', 'service', 'health', 'gate'];
  const safeCat = allowedCategories.includes(category) ? category : 'academic';
  const id = `place-${crypto.randomUUID().slice(0, 8)}`;

  db.prepare(`
    INSERT INTO places (id, campus_id, name, category, description, lat, lng, is_promoted, promo_tag, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'Student Added', 'approved')
  `).run(id, String(campus_id), String(name).trim(), safeCat, String(description).trim(), Number(lat), Number(lng));

  const created = db.prepare('SELECT * FROM places WHERE id = ?').get(id);
  res.status(201).json({ ...created, is_promoted: Boolean(created.is_promoted), avg_rating: 0, review_count: 0 });
});

// Get reviews for a place
app.get('/api/places/:id/reviews', (req, res) => {
  const reviews = db
    .prepare('SELECT * FROM reviews WHERE place_id = ? ORDER BY created_at DESC')
    .all(req.params.id);
  res.json(reviews);
});

// Post a review for a place
app.post('/api/places/:id/reviews', (req, res) => {
  const place = db.prepare('SELECT id FROM places WHERE id = ?').get(req.params.id);
  if (!place) return res.status(404).json({ error: 'Place not found' });

  const { author_name = 'Student', rating, comment = '' } = req.body || {};
  const numRating = Number(rating);
  if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    return res.status(400).json({ error: 'rating must be an integer between 1 and 5' });
  }

  const id = `rev-${crypto.randomUUID().slice(0, 8)}`;
  db.prepare(`
    INSERT INTO reviews (id, place_id, author_name, rating, comment)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, req.params.id, String(author_name).trim() || 'Student', numRating, String(comment).trim());

  const created = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
  res.status(201).json(created);
});

// Walking directions proxy (OSRM + direct fallback)
app.get('/api/route', async (req, res) => {
  const fromLat = Number(req.query.fromLat);
  const fromLng = Number(req.query.fromLng);
  const toLat = Number(req.query.toLat);
  const toLng = Number(req.query.toLng);

  if ([fromLat, fromLng, toLat, toLng].some((v) => Number.isNaN(v))) {
    return res.status(400).json({ error: 'fromLat, fromLng, toLat, toLng query params are required' });
  }

  const route = await getWalkingRoute(fromLat, fromLng, toLat, toLng);
  res.json(route);
});

// Promotions: list & submit campus business/event promotions
app.get('/api/promotions', (_req, res) => {
  const rows = db.prepare('SELECT * FROM promotions ORDER BY created_at DESC').all();
  res.json(rows);
});

app.post('/api/promotions', (req, res) => {
  const {
    kind = 'place',
    plan_id = 'spotlight',
    plan_name = 'Campus Spotlight',
    amount_ngn = 6000,
    title,
    category = '',
    location = '',
    tagline = '',
    contact,
    event_date = null,
  } = req.body || {};

  if (!title || String(title).trim().length < 2) {
    return res.status(400).json({ error: 'title is required' });
  }
  if (!contact || String(contact).trim().length < 5) {
    return res.status(400).json({ error: 'contact is required' });
  }

  const id = `PRM-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  db.prepare(`
    INSERT INTO promotions (id, kind, plan_id, plan_name, amount_ngn, title, category, location, tagline, contact, event_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    kind === 'event' ? 'event' : 'place',
    String(plan_id),
    String(plan_name),
    Number(amount_ngn) || 6000,
    String(title).trim(),
    String(category).trim(),
    String(location).trim(),
    String(tagline).trim(),
    String(contact).trim(),
    event_date ? String(event_date).trim() : null
  );

  const created = db.prepare('SELECT * FROM promotions WHERE id = ?').get(id);
  res.status(201).json(created);
});

// Auth: quick sign-in / sign-up persisted in SQLite
app.post('/api/auth/signin', (req, res) => {
  const { name = '', email = '', department = '' } = req.body || {};
  const cleanEmail = String(email).trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);
  if (existing) {
    if (name.trim() && name.trim() !== existing.name) {
      db.prepare('UPDATE users SET name = ?, department = ? WHERE id = ?').run(
        name.trim(),
        String(department).trim() || existing.department,
        existing.id
      );
    }
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id);
    return res.json({ user: updated });
  }

  const id = `usr-${crypto.randomUUID().slice(0, 8)}`;
  const displayName = String(name).trim() || cleanEmail.split('@')[0];
  db.prepare('INSERT INTO users (id, name, email, department) VALUES (?, ?, ?, ?)').run(
    id,
    displayName,
    cleanEmail,
    String(department).trim()
  );

  const created = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  res.status(201).json({ user: created });
});

// Optional: serve built frontend from ../frontend/dist on Nobus Cloud single-server deploy
const frontendDist = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Unimaps backend listening on http://0.0.0.0:${PORT}`);
});
