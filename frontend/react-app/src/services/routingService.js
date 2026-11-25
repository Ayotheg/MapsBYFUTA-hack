const OSRM_SERVERS = {
  walk: 'https://routing.openstreetmap.de/routed-foot',
  bike: 'https://routing.openstreetmap.de/routed-bike',
  ride: 'https://routing.openstreetmap.de/routed-car',
};

const REQUEST_TIMEOUT_MS = 10000;

export function mapTurnIcon(type, modifier) {
  const t = (type || '').toLowerCase();
  const m = (modifier || '').toLowerCase();
  if (t === 'arrive') return 'arrive';
  if (m === 'uturn') return 'uturn';
  if (m.includes('left')) return 'left';
  if (m.includes('right')) return 'right';
  return 'straight';
}

export function formatStepInstruction(step) {
  const t = (step.maneuver?.type || '').toLowerCase();
  const m = (step.maneuver?.modifier || '').toLowerCase();
  const road = step.name ? `onto ${step.name}` : step.ref ? `onto ${step.ref}` : '';

  if (t === 'arrive') {
    if (m === 'left') return 'Arrive — destination is on your left';
    if (m === 'right') return 'Arrive — destination is on your right';
    return 'You have arrived at your destination';
  }
  if (t === 'depart') {
    return step.name ? `Follow the route along ${step.name}` : 'Follow the route on the map';
  }
  if (t === 'turn') {
    if (m === 'sharp left') return `Turn sharp left${road ? ` ${road}` : ''}`;
    if (m === 'left') return `Turn left${road ? ` ${road}` : ''}`;
    if (m === 'slight left') return `Turn slightly left${road ? ` ${road}` : ''}`;
    if (m === 'straight') return `Continue straight${road ? ` ${road}` : ''}`;
    if (m === 'slight right') return `Turn slightly right${road ? ` ${road}` : ''}`;
    if (m === 'right') return `Turn right${road ? ` ${road}` : ''}`;
    if (m === 'sharp right') return `Turn sharp right${road ? ` ${road}` : ''}`;
    if (m === 'uturn') return 'Make a U-turn';
  }
  if (t === 'fork') {
    if (m.includes('left')) return `Keep left at the fork${road ? ` ${road}` : ''}`;
    if (m.includes('right')) return `Keep right at the fork${road ? ` ${road}` : ''}`;
    return `Take the fork${road ? ` ${road}` : ''}`;
  }
  if (t === 'roundabout' || t === 'rotary') {
    return `At the roundabout, take the exit${road ? ` ${road}` : ''}`;
  }
  if (t === 'end of road') {
    if (m === 'left') return `At the end of the road, turn left${road ? ` ${road}` : ''}`;
    if (m === 'right') return `At the end of the road, turn right${road ? ` ${road}` : ''}`;
  }
  if (m === 'uturn') return 'Make a U-turn';
  if (m.includes('left')) return `Bear left${road ? ` ${road}` : ''}`;
  if (m.includes('right')) return `Bear right${road ? ` ${road}` : ''}`;
  return road ? `Continue ${road}` : 'Continue straight';
}

export async function fetchRoute(
  fromLat,
  fromLng,
  toLat,
  toLng,
  travelMode = 'walk',
  { signal } = {}
) {
  const server = OSRM_SERVERS[travelMode] || OSRM_SERVERS.walk;
  const url =
    `${server}/route/v1/driving/` +
    `${fromLng},${fromLat};${toLng},${toLat}` +
    `?overview=full&geometries=geojson&steps=true&annotations=false&alternatives=true`;

  const controller = new AbortController();
  const onOuterAbort = () => controller.abort();
  signal?.addEventListener('abort', onOuterAbort);
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`Routing failed (${res.status})`);
    const data = await res.json();

    if (data.code !== 'Ok' || !Array.isArray(data.routes) || !data.routes.length) {
      throw new Error('No route found');
    }

    const bestRoute = data.routes.reduce((shortest, candidate) =>
      candidate.distance < shortest.distance ? candidate : shortest
    );

    const coords = bestRoute.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const steps = bestRoute.legs.flatMap((leg) => leg.steps).map((step) => ({
      instruction: formatStepInstruction(step),
      turnIcon: mapTurnIcon(step.maneuver?.type, step.maneuver?.modifier),
      type: step.maneuver?.type || 'straight',
      modifier: step.maneuver?.modifier || '',
      distance: step.distance || 0,
      duration: step.duration || 0,
      location: step.maneuver?.location
        ? [step.maneuver.location[1], step.maneuver.location[0]]
        : null,
      name: step.name || '',
    }));

    return {
      coords,
      distance: bestRoute.distance,
      duration: bestRoute.duration,
      steps,
    };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onOuterAbort);
  }
}
