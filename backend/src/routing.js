const EARTH_RADIUS_M = 6371000;

export function distanceMeters(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function walkingMinutes(meters) {
  return Math.max(1, Math.round(meters / 75));
}

function formatOsrmStep(step) {
  const type = step.maneuver?.type || 'continue';
  const mod = step.maneuver?.modifier ? ` ${step.maneuver.modifier}` : '';
  const road = step.name ? ` onto ${step.name}` : '';
  if (type === 'arrive') return 'Arrive at your destination';
  if (type === 'depart') return `Start walking${road}`;
  return `${type.charAt(0).toUpperCase() + type.slice(1)}${mod}${road}`;
}

export async function getWalkingRoute(fromLat, fromLng, toLat, toLng) {
  const directDist = Math.round(distanceMeters(fromLat, fromLng, toLat, toLng));
  const fallback = {
    coords: [
      [fromLat, fromLng],
      [toLat, toLng],
    ],
    distance_m: directDist,
    duration_min: walkingMinutes(directDist),
    steps: [{ instruction: 'Walk directly toward destination', distance_m: directDist }],
    source: 'fallback',
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4500);
    const url = `https://router.project-osrm.org/route/v1/foot/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson&steps=true`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (!res.ok) return fallback;
    const json = await res.json();
    const route = json?.routes?.[0];
    if (!route?.geometry?.coordinates?.length) return fallback;

    const coords = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const steps = (route.legs?.[0]?.steps || []).map((s) => ({
      instruction: formatOsrmStep(s),
      distance_m: Math.round(s.distance || 0),
    }));

    return {
      coords,
      distance_m: Math.round(route.distance),
      duration_min: walkingMinutes(route.distance),
      steps: steps.length ? steps : fallback.steps,
      source: 'osrm',
    };
  } catch {
    return fallback;
  }
}
