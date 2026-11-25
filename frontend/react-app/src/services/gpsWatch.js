const WATCH_OPTIONS = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 15000,
};
const MAX_FIX_AGE_MS = 30000;

const subscribers = new Set();
let watchId = null;
let lastStaleTimestamp = null;
let lastFix = null;

function isStale(pos) {
  if (Date.now() - pos.timestamp <= MAX_FIX_AGE_MS) return false;
  const advancing =
    lastStaleTimestamp !== null && pos.timestamp > lastStaleTimestamp;
  lastStaleTimestamp = pos.timestamp;
  return !advancing;
}

function startWatch() {
  if (watchId !== null || subscribers.size === 0) return;
  if (typeof navigator === 'undefined' || !navigator.geolocation) return;

  lastStaleTimestamp = null;
  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      if (isStale(pos)) return;
      lastFix = pos;
      subscribers.forEach((sub) => sub.onFix(pos));
    },
    (err) => {
      subscribers.forEach((sub) => sub.onError?.(err));
    },
    WATCH_OPTIONS
  );
}

function stopWatch() {
  if (watchId === null) return;
  navigator.geolocation.clearWatch(watchId);
  watchId = null;
}

export function subscribeGps(onFix, onError) {
  const sub = { onFix, onError };
  subscribers.add(sub);
  startWatch();
  return () => {
    subscribers.delete(sub);
    if (subscribers.size === 0) stopWatch();
  };
}

export function getLastFix(maxAgeMs = MAX_FIX_AGE_MS) {
  if (!lastFix || Date.now() - lastFix.timestamp > maxAgeMs) return null;
  return lastFix;
}

export function restartGpsWatch() {
  stopWatch();
  startWatch();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && subscribers.size > 0) {
      restartGpsWatch();
    }
  });
}

export function gpsErrorText(err) {
  if (err?.code === 1) {
    return 'Location is blocked. Allow Location permission in your browser, then retry.';
  }
  if (err?.code === 2) {
    return 'Location unavailable. Turn on Location services and step outside.';
  }
  return 'Timed out waiting for a GPS fix. Tap retry.';
}
