import { haversineMeters } from '../utils/geo';

const GEOCODE_REUSE_M = 150;
const GEOCODE_REUSE_MS = 3 * 60 * 1000;
let geocodeCache = null;
let announceSeq = 0;

export function unlockSpeech() {
  if (
    typeof window === 'undefined' ||
    !window.speechSynthesis ||
    typeof window.SpeechSynthesisUtterance !== 'function'
  ) {
    return;
  }
  try {
    const primer = new window.SpeechSynthesisUtterance(' ');
    primer.volume = 0;
    window.speechSynthesis.speak(primer);
  } catch {
    // Speech synthesis is optional
  }
}

export function speak(text) {
  if (
    !text ||
    typeof window === 'undefined' ||
    !window.speechSynthesis ||
    typeof window.SpeechSynthesisUtterance !== 'function'
  ) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.rate = 0.96;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore browser speech errors
  }
}

async function reverseGeocode(lat, lng) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lng)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      address: data?.address || {},
      displayName: data?.display_name || '',
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Announces the user's located position using the browser Web Speech API,
 * reverse-geocoding via Nominatim and falling back to the nearest FUTA spot.
 */
export async function announceCurrentLocation(
  lat,
  lng,
  { approximate = false, nearestPlaceName = null } = {}
) {
  if (lat == null || lng == null) return;
  const seq = ++announceSeq;

  let result = null;
  const cached = geocodeCache;
  if (
    cached &&
    Date.now() - cached.at <= GEOCODE_REUSE_MS &&
    haversineMeters(cached.lat, cached.lng, lat, lng) <= GEOCODE_REUSE_M
  ) {
    result = cached.result;
  } else {
    result = await reverseGeocode(lat, lng);
    if (seq !== announceSeq) return;
    if (result) {
      geocodeCache = { lat, lng, at: Date.now(), result };
    }
  }

  const prefix = approximate
    ? 'Your approximate location is '
    : 'Your current location is ';

  if (!result) {
    if (nearestPlaceName) {
      speak(`${prefix}near ${nearestPlaceName}.`);
    } else {
      speak('Location found on the map.');
    }
    return;
  }

  const { address, displayName } = result;
  const specific =
    address.road || address.pedestrian || address.footway || address.residential;
  const axis =
    address.suburb ||
    address.neighbourhood ||
    address.city_district ||
    address.town ||
    address.village ||
    address.city ||
    address.county;
  const state = address.state;

  let phrase = prefix;
  if (specific && axis && specific !== axis) {
    phrase += `${specific}, within ${axis} axis`;
  } else if (specific) {
    phrase += specific;
  } else if (axis) {
    phrase += `within ${axis} axis`;
  } else if (nearestPlaceName) {
    phrase += `near ${nearestPlaceName}`;
  } else {
    phrase += (displayName.split(',')[0] || 'FUTA campus').trim();
  }

  if (state) phrase += `, ${state}`;
  phrase += '.';

  speak(phrase);
}
