# Unimaps Backend API Contract

Base URL (local): `http://localhost:4000`
Base URL (Nobus Cloud): `https://your-domain-or-sslip.io` (same origin when serving `frontend/dist`)

## Endpoints

### 1. Health Check
`GET /api/health`
Returns `{ ok: true, service: "unimaps-backend", timestamp }`

### 2. List Campuses
`GET /api/campuses`
Returns array of campuses (`funaab`, `mapoly`, `futa`) with `center_lat`, `center_lng`, `gate_lat`, `gate_lng`, `gate_label`.

### 3. List & Filter Places
`GET /api/places?campus=funaab&category=food&q=library&promoted=1`
All query params are optional. Each place includes `avg_rating` and `review_count`.

### 4. Suggest / Create a Place
`POST /api/places`
```json
{
  "campus_id": "funaab",
  "name": "Yellow House Buka",
  "category": "food",
  "description": "Opposite COLPHYS walkway",
  "lat": 7.2301,
  "lng": 3.4399
}
```
Categories: `academic | admin | housing | food | service | health | gate`

### 5. Get Reviews for a Place
`GET /api/places/:id/reviews`

### 6. Post a Review
`POST /api/places/:id/reviews`
```json
{
  "author_name": "Tunde (100L)",
  "rating": 5,
  "comment": "Very easy to locate from Main Gate!"
}
```

### 7. Walking Directions (OSRM + Fallback)
`GET /api/route?fromLat=7.2189&fromLng=3.4352&toLat=7.2283&toLng=3.4396`
Returns `{ coords: [[lat, lng], ...], distance_m, duration_min, steps: [{ instruction, distance_m }], source }`.
