const DEFAULT_API_URL = 'https://mapsbyfuta.xyz/api/v1';
const RAW_API_URL = import.meta.env.VITE_EXPLORE_API_URL?.trim() || '';
const EXPLORE_API_URL = RAW_API_URL || DEFAULT_API_URL;
const EXPLORE_API_KEY = import.meta.env.VITE_EXPLORE_API_KEY?.trim() || '';

const CACHE_KEY = 'mapsbyfuta_explore_api_v6';
const IMAGE_CACHE_KEY = 'mapsbyfuta_place_images_v1';
const CACHE_TTL_MS = 30 * 60 * 1000;
const MAX_PAGES = 10;
const MIN_RATE_LIMIT_RESERVE_FOR_IMAGES = 8;
const placeImagesCache = new Map();
let inFlightPayloadPromise = null;

function loadPersistentImageCache() {
  try {
    const raw = localStorage.getItem(IMAGE_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      for (const [key, urls] of Object.entries(parsed)) {
        if (Array.isArray(urls) && urls.length > 0 && !placeImagesCache.has(key)) {
          placeImagesCache.set(key, urls);
        }
      }
    }
  } catch {
    // Ignore storage errors
  }
}

function savePersistentImageCache() {
  try {
    const obj = {};
    for (const [key, urls] of placeImagesCache.entries()) {
      if (Array.isArray(urls) && urls.length > 0) {
        obj[key] = urls;
      }
    }
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(obj));
  } catch {
    // Ignore storage quota errors
  }
}

loadPersistentImageCache();

function buildEndpoints(baseOrFullUrl) {
  const clean = baseOrFullUrl.replace(/\/+$/, '');
  const isV1Base = /\/v1$/i.test(clean);
  const placesUrl = isV1Base ? `${clean}/places?limit=50` : baseOrFullUrl;

  const noQuery = baseOrFullUrl.split('?')[0].replace(/\/+$/, '');
  const imagesBaseUrl = noQuery.replace(/\/places$/i, '');

  return { placesUrl, imagesBaseUrl };
}

function buildOffsetUrl(baseUrl, offset) {
  try {
    const parsed = new URL(baseUrl);
    parsed.searchParams.set('limit', parsed.searchParams.get('limit') || '50');
    parsed.searchParams.set('offset', String(offset));
    return parsed.toString();
  } catch {
    const sep = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${sep}offset=${offset}`;
  }
}

export function isExploreApiConfigured() {
  if (EXPLORE_API_URL.includes('mapsbyfuta.xyz/api/v1')) {
    return Boolean(EXPLORE_API_KEY);
  }
  return Boolean(RAW_API_URL);
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

/**
 * Picks 3–5 random Featured places, preferring places with photos.
 */
export function pickFeaturedPlaces(places, count = 5) {
  if (!Array.isArray(places) || places.length === 0) return [];
  const target = Math.min(places.length, count);
  const withMedia = places.filter(
    (place) => Boolean(place.image) || place.imageCount > 0
  );
  const withoutMedia = places.filter(
    (place) => !place.image && place.imageCount <= 0
  );

  const pickedWithMedia = pickRandomItems(withMedia, target);
  if (pickedWithMedia.length >= target) {
    return pickedWithMedia;
  }

  const remaining = target - pickedWithMedia.length;
  return [...pickedWithMedia, ...pickRandomItems(withoutMedia, remaining)];
}

function popularityScore(place) {
  const ratingScore = (place.rating || 0) * Math.log((place.reviewCount || 0) + 2);
  const mediaBoost = place.image || place.imageCount > 0 ? 1.5 : 0;
  return ratingScore + mediaBoost;
}

function rankPopularPlaces(places, featuredIds) {
  const remaining = places.filter((place) => !featuredIds.has(place.id));
  const pool = remaining.length > 0 ? remaining : [...places];

  return [...pool].sort((a, b) => {
    const scoreDiff = popularityScore(b) - popularityScore(a);
    if (Math.abs(scoreDiff) > 0.001) return scoreDiff;
    return a.name.localeCompare(b.name);
  });
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
    imageCount: Number(raw.image_count ?? raw.imageCount ?? 0),
    reviewCount: Number(raw.review_count ?? raw.reviewCount ?? 0),
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

function createAuthHeaders() {
  const headers = { Accept: 'application/json' };
  if (EXPLORE_API_KEY) {
    headers['x-api-key'] = EXPLORE_API_KEY;
  }
  return headers;
}

/**
 * Fetches all paginated place pages from the API up to MAX_PAGES,
 * gracefully returning already-collected pages if a later page hits rate limits.
 */
async function fetchAllPlacesPages(firstPageUrl, { signal } = {}) {
  const allRawPlaces = [];
  let rawChannels = [];
  let rawEvents = [];
  let rawPeople = [];
  let nextUrl = firstPageUrl;

  for (let page = 0; page < MAX_PAGES && nextUrl; page += 1) {
    let response;
    try {
      response = await fetch(nextUrl, {
        method: 'GET',
        headers: createAuthHeaders(),
        signal,
      });
    } catch (err) {
      if (page === 0) throw err;
      break;
    }

    if (!response.ok) {
      if (page === 0) {
        throw new Error(`Explore API error (${response.status})`);
      }
      break;
    }

    const json = await response.json();
    const unwrapped = unwrapPayload(json);
    allRawPlaces.push(...unwrapped.rawPlaces);

    if (page === 0) {
      rawChannels = unwrapped.rawChannels;
      rawEvents = unwrapped.rawEvents;
      rawPeople = unwrapped.rawPeople;
    }

    const nextOffset = json?.meta?.pagination?.next_offset;
    const rateRemaining = json?.meta?.rate_limit_remaining;
    if (
      nextOffset == null ||
      (typeof rateRemaining === 'number' &&
        rateRemaining <= MIN_RATE_LIMIT_RESERVE_FOR_IMAGES)
    ) {
      nextUrl = null;
    } else {
      nextUrl = buildOffsetUrl(firstPageUrl, nextOffset);
    }
  }

  return { rawPlaces: allRawPlaces, rawChannels, rawEvents, rawPeople };
}

/**
 * Fetches all photo URLs for a single place from `/places/:id/images`, cached in memory.
 */
export async function fetchPlaceImages(placeId, { signal } = {}) {
  if (!placeId) return [];
  const cacheKey = String(placeId);
  if (placeImagesCache.has(cacheKey)) {
    return placeImagesCache.get(cacheKey);
  }
  if (!isExploreApiConfigured()) return [];

  const { imagesBaseUrl } = buildEndpoints(EXPLORE_API_URL);

  try {
    const response = await fetch(
      `${imagesBaseUrl}/places/${encodeURIComponent(placeId)}/images`,
      {
        method: 'GET',
        headers: createAuthHeaders(),
        signal,
      }
    );
    if (!response.ok) return [];
    const json = await response.json();
    const urls = Array.isArray(json?.data)
      ? json.data
          .map((item) => item?.url || item?.full_url)
          .filter((url) => typeof url === 'string' && url.trim())
      : [];
    if (urls.length > 0) {
      placeImagesCache.set(cacheKey, urls);
      savePersistentImageCache();
    }
    return urls;
  } catch {
    return [];
  }
}

/**
 * Fetches the first photo URL for a single place from `/places/:id/images`.
 */
export async function fetchPlaceImageUrl(placeId, { signal } = {}) {
  const urls = await fetchPlaceImages(placeId, { signal });
  return urls[0] || null;
}

/**
 * Fetches all paginated places from the configured API (defaulting to Maps By FUTA v1),
 * picks 3–5 random Featured places + ranked Popular on campus list,
 * hydrates photos for up to 4 Featured and top 4 Popular places (max 8 calls),
 * and caches in localStorage (30 min TTL) so dev reloads don't burn credits.
 */
export async function fetchExplorePayload({ bypassCache = false } = {}) {
  if (!isExploreApiConfigured()) {
    return {
      configured: false,
      places: [],
      featuredPlaces: [],
      popularPlaces: [],
      channels: [],
      events: [],
      people: [],
    };
  }

  if (!bypassCache && inFlightPayloadPromise) {
    return inFlightPayloadPromise;
  }

  const run = async () => {
    const { placesUrl } = buildEndpoints(EXPLORE_API_URL);

    const applyKnownImage = (place) => {
      if (place.image) return place;
      const cachedUrls = placeImagesCache.get(String(place.id));
      return cachedUrls?.[0] ? { ...place, image: cachedUrls[0] } : place;
    };

    if (!bypassCache) {
      try {
        const cachedRaw = localStorage.getItem(CACHE_KEY);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          const fresh =
            cached?.savedAt && Date.now() - cached.savedAt < CACHE_TTL_MS;
          if (fresh && cached?.placesUrl === placesUrl && Array.isArray(cached.places)) {
            let places = cached.places.map(applyKnownImage);
            let featuredPlaces = (cached.featuredPlaces || []).map(applyKnownImage);
            let popularPlaces = (cached.popularPlaces || []).map(applyKnownImage);

            // If cached featured/popular still lack images, hydrate up to 6 now
            const missingIds = Array.from(
              new Set(
                [...featuredPlaces.slice(0, 4), ...popularPlaces.slice(0, 4)]
                  .filter((p) => !p.image && p.imageCount > 0)
                  .map((p) => p.id)
              )
            ).slice(0, 6);

            if (missingIds.length > 0) {
              const recovered = new Map();
              for (const id of missingIds) {
                const url = await fetchPlaceImageUrl(id);
                if (url) recovered.set(id, url);
              }
              if (recovered.size > 0) {
                const patch = (p) =>
                  recovered.has(p.id) ? { ...p, image: recovered.get(p.id) } : p;
                places = places.map(patch);
                featuredPlaces = featuredPlaces.map(patch);
                popularPlaces = popularPlaces.map(patch);
                try {
                  localStorage.setItem(
                    CACHE_KEY,
                    JSON.stringify({
                      ...cached,
                      places,
                      featuredPlaces,
                      popularPlaces,
                    })
                  );
                } catch {
                  // Ignore storage errors
                }
              }
            }

            return {
              configured: true,
              places,
              featuredPlaces,
              popularPlaces,
              channels: cached.channels || [],
              events: cached.events || [],
              people: cached.people || [],
            };
          }
        }
      } catch {
        // Ignore storage read errors
      }
    }

    const { rawPlaces, rawChannels, rawEvents, rawPeople } =
      await fetchAllPlacesPages(placesUrl);

    const places = rawPlaces.map(normalizePlace).map(applyKnownImage);
    const channels = rawChannels.map(normalizeChannel);
    const events = rawEvents.map(normalizeEvent);
    const people = rawPeople.map(normalizePerson);

    const featuredCount = Math.min(5, Math.max(3, places.length));
    const initialFeatured = pickFeaturedPlaces(places, featuredCount);
    const featuredIds = new Set(initialFeatured.map((place) => place.id));
    const initialPopular = rankPopularPlaces(places, featuredIds);

    const candidatesForPhoto = [
      ...initialFeatured.slice(0, 4),
      ...initialPopular.slice(0, 4),
    ].filter((place) => !place.image && place.imageCount > 0);

    const uniquePhotoIds = Array.from(
      new Set(candidatesForPhoto.map((place) => place.id))
    ).slice(0, 6);

    const photoMap = new Map();
    for (const id of uniquePhotoIds) {
      const url = await fetchPlaceImageUrl(id);
      if (url) {
        photoMap.set(id, url);
      }
    }

    const applyPhoto = (place) =>
      photoMap.has(place.id) ? { ...place, image: photoMap.get(place.id) } : place;

    const hydratedPlaces = places.map(applyPhoto);
    const featuredPlaces = initialFeatured.map(applyPhoto);
    const popularPlaces = initialPopular.map(applyPhoto);

    try {
      localStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          savedAt: Date.now(),
          placesUrl,
          places: hydratedPlaces,
          featuredPlaces,
          popularPlaces,
          channels,
          events,
          people,
        })
      );
    } catch {
      // Ignore storage write errors
    }

    return {
      configured: true,
      places: hydratedPlaces,
      featuredPlaces,
      popularPlaces,
      channels,
      events,
      people,
    };
  };

  const promise = run().finally(() => {
    if (inFlightPayloadPromise === promise) {
      inFlightPayloadPromise = null;
    }
  });
  inFlightPayloadPromise = promise;
  return promise;
}
