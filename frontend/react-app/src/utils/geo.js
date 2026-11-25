const EARTH_RADIUS_M = 6371000;

export function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLng = (lng2 - lng1) * toRad;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function bearingBetween(a, b) {
  const toRad = Math.PI / 180;
  const y = Math.sin((b[1] - a[1]) * toRad) * Math.cos(b[0] * toRad);
  const x =
    Math.cos(a[0] * toRad) * Math.sin(b[0] * toRad) -
    Math.sin(a[0] * toRad) * Math.cos(b[0] * toRad) * Math.cos((b[1] - a[1]) * toRad);
  return ((Math.atan2(y, x) / toRad) + 360) % 360;
}

export function turnAngle(fromBearing, toBearing) {
  return ((toBearing - fromBearing + 540) % 360) - 180;
}

export function cumulativeDistances(coords) {
  const cum = [0];
  for (let i = 1; i < coords.length; i += 1) {
    cum.push(
      cum[i - 1] +
        haversineMeters(
          coords[i - 1][0],
          coords[i - 1][1],
          coords[i][0],
          coords[i][1]
        )
    );
  }
  return cum;
}

export function pointAlong(coords, cum, d) {
  if (!coords.length) return [0, 0];
  if (d <= 0) return coords[0];
  const total = cum[cum.length - 1];
  if (d >= total) return coords[coords.length - 1];

  let i = 1;
  while (i < cum.length - 1 && cum[i] < d) i += 1;
  const span = cum[i] - cum[i - 1] || 1;
  const t = (d - cum[i - 1]) / span;
  return [
    coords[i - 1][0] + (coords[i][0] - coords[i - 1][0]) * t,
    coords[i - 1][1] + (coords[i][1] - coords[i - 1][1]) * t,
  ];
}

export function headingAhead(coords, cum, along, lookAhead = 30) {
  if (coords.length < 2) return 0;
  const total = cum[cum.length - 1];
  const from = Math.min(along, Math.max(0, total - lookAhead));
  return bearingBetween(
    pointAlong(coords, cum, from),
    pointAlong(coords, cum, from + lookAhead)
  );
}

/**
 * Projects a lat/lng point onto a polyline, returning perpendicular offset
 * and distance along the route in metres.
 */
export function distanceToPolyline(lat, lng, coords, cum) {
  if (coords.length < 2) {
    return { offsetMeters: Infinity, alongMeters: 0 };
  }

  const origin = coords[0];
  const cosLat = Math.cos((origin[0] * Math.PI) / 180);
  const toXY = (lt, lg) => ({
    x: (lg - origin[1]) * 111320 * cosLat,
    y: (lt - origin[0]) * 110540,
  });

  const p = toXY(lat, lng);
  let bestOffset = Infinity;
  let bestAlong = 0;

  for (let i = 1; i < coords.length; i += 1) {
    const a = toXY(coords[i - 1][0], coords[i - 1][1]);
    const b = toXY(coords[i][0], coords[i][1]);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const den = dx * dx + dy * dy;
    if (den === 0) continue;

    const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / den));
    const offset = Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
    if (offset < bestOffset) {
      bestOffset = offset;
      bestAlong = cum[i - 1] + (cum[i] - cum[i - 1]) * t;
    }
  }

  return { offsetMeters: bestOffset, alongMeters: bestAlong };
}

/**
 * Finds places within `maxOffset` metres of the route between `from` and `to`
 * metres along it, sorted nearest first, with left/right side relative to travel.
 */
export function placesAlong(
  coords,
  cum,
  from,
  to,
  places,
  { maxOffset = 45, limit = 10 } = {}
) {
  if (to <= from || coords.length < 2 || !Array.isArray(places)) return [];

  let first = 1;
  while (first < coords.length - 1 && cum[first] < from) first += 1;
  let last = first;
  while (last < coords.length - 1 && cum[last] < to) last += 1;

  const origin = coords[first - 1];
  const cosLat = Math.cos((origin[0] * Math.PI) / 180);
  const toXY = (lat, lng) => ({
    x: (lng - origin[1]) * 111320 * cosLat,
    y: (lat - origin[0]) * 110540,
  });

  const segs = [];
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLng = Infinity;
  let maxLng = -Infinity;

  for (let i = first; i <= last; i += 1) {
    const a = coords[i - 1];
    const b = coords[i];
    segs.push({
      a: toXY(a[0], a[1]),
      b: toXY(b[0], b[1]),
      start: cum[i - 1],
      len: cum[i] - cum[i - 1],
    });
    minLat = Math.min(minLat, a[0], b[0]);
    maxLat = Math.max(maxLat, a[0], b[0]);
    minLng = Math.min(minLng, a[1], b[1]);
    maxLng = Math.max(maxLng, a[1], b[1]);
  }

  const padLat = maxOffset / 110540;
  const padLng = maxOffset / (111320 * cosLat);
  const found = [];

  for (const place of places) {
    const lat = Number(place.lat);
    const lng = Number(place.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    if (
      lat < minLat - padLat ||
      lat > maxLat + padLat ||
      lng < minLng - padLng ||
      lng > maxLng + padLng
    ) {
      continue;
    }

    const p = toXY(lat, lng);
    let best = null;
    for (const s of segs) {
      const dx = s.b.x - s.a.x;
      const dy = s.b.y - s.a.y;
      const den = dx * dx + dy * dy;
      if (den === 0) continue;

      const t = Math.max(0, Math.min(1, ((p.x - s.a.x) * dx + (p.y - s.a.y) * dy) / den));
      const offset = Math.hypot(p.x - (s.a.x + dx * t), p.y - (s.a.y + dy * t));
      const along = s.start + s.len * t;
      if (offset > maxOffset || along < from || along > to) continue;

      if (!best || offset < best.offset) {
        const cross = dx * (p.y - s.a.y) - dy * (p.x - s.a.x);
        best = { offset, along, side: cross > 0 ? 'left' : 'right' };
      }
    }

    if (best) {
      found.push({ place, ahead: best.along - from, side: best.side });
    }
  }

  found.sort((x, y) => x.ahead - y.ahead);
  return found.slice(0, limit);
}

export function formatDistance(meters) {
  if (!Number.isFinite(meters)) return '—';
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.max(5, Math.round(meters))} m`;
}
