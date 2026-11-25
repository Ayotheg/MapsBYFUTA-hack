const EXPLORE_API_URL = import.meta.env.VITE_EXPLORE_API_URL?.trim() || '';
const EXPLORE_API_KEY = import.meta.env.VITE_EXPLORE_API_KEY?.trim() || '';

export function isExploreApiConfigured() {
  return Boolean(EXPLORE_API_URL);
}

/**
 * Pure Fisher-Yates copy shuffle returning up to `count` random items.
 */
export function pickRandomItems(items, count = 5) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function extractImage(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (typeof raw.image === 'string' && raw.image.trim()) return raw.image.trim();
  if (typeof raw.image_url === 'string' && raw.image_url.trim()) return raw.image_url.trim();
  if (typeof raw.imageUrl === 'string' && raw.imageUrl.trim()) return raw.imageUrl.trim();
  if (typeof raw.photo === 'string' && raw.photo.trim()) return raw.photo.trim();
  if (typeof raw.thumbnail === 'string' && raw.thumbnail.trim()) return raw.thumbnail.trim();
  if (typeof raw.poster === 'string' && raw.poster.trim()) return raw.poster.trim();

  if (Array.isArray(raw.images) && raw.images.length > 0) {
    const first = raw.images[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
    if (first && typeof first === 'object' && typeof first.url === 'string' && first.url.trim()) {
      return first.url.trim();
    }
  }
  return null;
}

export function normalizePlace(raw, index = 0) {
  const rawType = (raw.type ?? raw.category ?? 'campus_spot').toString().trim();
  const normalizedType = rawType.toLowerCase();
  const badge = (raw.badge ?? rawType ?? 'PLACE').toString().replace(/_/g, ' ').toUpperCase();

  return {
    id: raw.id ?? raw._id ?? `place-${index}`,
    name: raw.name ?? raw.title ?? raw.place_name ?? 'Campus Spot',
    subtitle: raw.area ?? raw.subtitle ?? raw.location ?? raw.description ?? '',
    type: normalizedType,
    category: normalizedType,
    badge,
    image: extractImage(raw),
    lat: raw.lat != null ? Number(raw.lat) : raw.latitude != null ? Number(raw.latitude) : null,
    lng:
      raw.lng != null
        ? Number(raw.lng)
        : raw.lon != null
          ? Number(raw.lon)
          : raw.longitude != null
            ? Number(raw.longitude)
            : null,
    rating:
      raw.rating != null
        ? Number(raw.rating)
        : raw.avg_rating != null
          ? Number(raw.avg_rating)
          : null,
    walkMinutes: raw.walkMinutes ?? raw.walk_minutes ?? null,
    promoted: Boolean(raw.promoted ?? raw.is_promoted ?? raw.isPromoted ?? raw.featured),
  };
}

export function normalizeChannel(raw, index = 0) {
  const name = raw.name ?? raw.title ?? 'Campus Channel';
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  const defaultInitials = (
    words.length > 1 ? words[0][0] + words[1][0] : (words[0] || 'CH').slice(0, 2)
  ).toUpperCase();

  return {
    id: raw.id ?? raw._id ?? `channel-${index}`,
    name,
    platform: raw.platform ?? raw.channel_type ?? raw.subtitle ?? 'WhatsApp channel',
    initials: raw.initials ?? defaultInitials,
    image: extractImage(raw),
    url: raw.url ?? raw.link ?? raw.channelLink ?? '',
    featured: Boolean(raw.featured ?? raw.is_featured ?? index < 2),
    promoted: Boolean(raw.promoted ?? raw.is_promoted ?? raw.featured ?? index < 2),
  };
}

export function normalizeEvent(raw, index = 0) {
  const priceValue = raw.price ?? raw.amount ?? null;
  const isFree =
    raw.isFree ??
    raw.is_free ??
    (priceValue == null || Number(priceValue) === 0 || String(priceValue).toLowerCase() === 'free');

  return {
    id: raw.id ?? raw._id ?? `event-${index}`,
    title: raw.title ?? raw.name ?? 'Campus Event',
    month: raw.month ?? 'OCT',
    day: raw.day ?? '24',
    time: raw.time ?? raw.when ?? raw.starts_at ?? 'TBA',
    venue: raw.venue ?? raw.location ?? raw.place ?? 'FUTA Campus',
    isOnline: Boolean(raw.isOnline ?? raw.is_online ?? raw.online),
    priceLabel: raw.priceLabel ?? (isFree ? 'Free' : `₦${Number(priceValue).toLocaleString()}`),
    isFree: Boolean(isFree),
    timeframe: raw.timeframe ?? 'this-week',
    poster: extractImage(raw),
    featured: Boolean(raw.featured ?? raw.is_featured ?? index < 2),
    url: raw.url ?? raw.link ?? '',
  };
}

export function normalizePerson(raw, index = 0) {
  const name = raw.name ?? raw.title ?? 'FUTA Student';
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  const initials = (
    words.length > 1 ? words[0][0] + words[1][0] : (words[0] || 'U').slice(0, 2)
  ).toUpperCase();

  return {
    id: raw.id ?? raw._id ?? `person-${index}`,
    name,
    role: raw.role ?? raw.department ?? raw.subtitle ?? 'FUTA Campus',
    bio: raw.bio ?? raw.description ?? '',
    initials: raw.initials ?? initials,
    image: extractImage(raw),
    featured: Boolean(raw.featured ?? raw.is_featured ?? index < 2),
    promoted: Boolean(raw.promoted ?? raw.is_promoted),
  };
}

function unwrapPayload(json) {
  if (Array.isArray(json)) {
    return { rawPlaces: json, rawChannels: [], rawEvents: [], rawPeople: [] };
  }

  const root = json?.data && !Array.isArray(json.data) ? json.data : json;
  const rawPlaces = Array.isArray(json?.data)
    ? json.data
    : Array.isArray(root?.places)
      ? root.places
      : Array.isArray(root?.items)
        ? root.items
        : Array.isArray(root?.results)
          ? root.results
          : [];

  return {
    rawPlaces,
    rawChannels: Array.isArray(root?.channels) ? root.channels : [],
    rawEvents: Array.isArray(root?.events) ? root.events : [],
    rawPeople: Array.isArray(root?.people) ? root.people : [],
  };
}

/**
 * Fetches JSON payload from VITE_EXPLORE_API_URL when configured.
 */
export async function fetchExplorePayload({ signal } = {}) {
  if (!EXPLORE_API_URL) {
    return {
      configured: false,
      places: [],
      channels: [],
      events: [],
      people: [],
    };
  }

  const headers = { Accept: 'application/json' };
  if (EXPLORE_API_KEY) {
    headers['x-api-key'] = EXPLORE_API_KEY;
  }

  const response = await fetch(EXPLORE_API_URL, {
    method: 'GET',
    headers,
    signal,
  });

  if (!response.ok) {
    throw new Error(`Explore API error (${response.status})`);
  }

  const json = await response.json();
  const { rawPlaces, rawChannels, rawEvents, rawPeople } = unwrapPayload(json);

  return {
    configured: true,
    places: rawPlaces.map(normalizePlace),
    channels: rawChannels.map(normalizeChannel),
    events: rawEvents.map(normalizeEvent),
    people: rawPeople.map(normalizePerson),
  };
}
