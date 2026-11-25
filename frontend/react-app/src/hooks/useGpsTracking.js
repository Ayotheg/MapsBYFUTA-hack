import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  getLastFix,
  gpsErrorText,
  restartGpsWatch,
  subscribeGps,
} from '../services/gpsWatch';
import { announceCurrentLocation, unlockSpeech } from '../services/speech';
import { haversineMeters } from '../utils/geo';

const GPS_GOOD_M = 20;
const GPS_FAIR_M = 100;

function computeSignalMetrics(accuracy) {
  if (accuracy == null || !Number.isFinite(accuracy)) {
    return {
      activeBars: 0,
      tier: 'poor',
      badgeText: 'WAIT',
      warningText: '',
    };
  }

  let activeBars = 1;
  if (accuracy <= 10) activeBars = 5;
  else if (accuracy <= 20) activeBars = 4;
  else if (accuracy <= 50) activeBars = 3;
  else if (accuracy <= 100) activeBars = 2;

  const tier =
    accuracy <= GPS_GOOD_M
      ? 'good'
      : accuracy <= GPS_FAIR_M
        ? 'fair'
        : 'poor';

  const badgeText = tier === 'good' ? 'GOOD' : tier === 'fair' ? 'FAIR' : 'POOR';
  const warningText =
    tier === 'poor' ? 'Signal too weak. Step outside.' : '';

  return { activeBars, tier, badgeText, warningText };
}

function findNearestPlaceName(lat, lng, places) {
  if (!Array.isArray(places) || !places.length) return null;
  let bestName = null;
  let bestDist = Infinity;
  for (const place of places) {
    if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) continue;
    const d = haversineMeters(lat, lng, place.lat, place.lng);
    if (d < bestDist) {
      bestDist = d;
      bestName = place.name;
    }
  }
  return bestDist <= 1200 ? bestName : null;
}

/**
 * Live GPS signal & locate hook wired to Leaflet + browser Web Speech API.
 */
export function useGpsTracking({ map, places = [] }) {
  const [fix, setFix] = useState(() => {
    const cached = getLastFix();
    if (!cached) return null;
    return {
      lat: cached.coords.latitude,
      lng: cached.coords.longitude,
      accuracy: cached.coords.accuracy,
      speed: cached.coords.speed,
      heading: cached.coords.heading,
    };
  });
  const [error, setError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const markerRef = useRef(null);
  const circleRef = useRef(null);
  const trackingRef = useRef(false);
  const followingRef = useRef(false);
  const pendingAnnounceRef = useRef(false);
  const placesRef = useRef(places);

  useEffect(() => {
    placesRef.current = places;
  }, [places]);

  useEffect(() => {
    trackingRef.current = isTracking;
  }, [isTracking]);

  useEffect(() => {
    followingRef.current = isFollowing;
  }, [isFollowing]);

  const clearLayers = useCallback(() => {
    if (markerRef.current) {
      markerRef.current.remove();
      markerRef.current = null;
    }
    if (circleRef.current) {
      circleRef.current.remove();
      circleRef.current = null;
    }
  }, []);

  const renderFixOnMap = useCallback(
    (coords, shouldFly = false) => {
      if (!map || !coords) return;
      const latLng = [coords.lat, coords.lng];
      const { tier } = computeSignalMetrics(coords.accuracy);
      const color =
        tier === 'good' ? '#0d9488' : tier === 'fair' ? '#7c3aed' : '#ba1a1a';

      if (!markerRef.current) {
        const icon = L.divIcon({
          className: '',
          html: `<div class="mbf-gps-dot" style="--dot-color:${color}"><div class="mbf-gps-pulse"></div><div class="mbf-gps-core"></div></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        markerRef.current = L.marker(latLng, {
          icon,
          zIndexOffset: 900,
          interactive: false,
        }).addTo(map);
      } else {
        markerRef.current.setLatLng(latLng);
      }

      const radius = Math.min(Math.max(coords.accuracy || 15, 10), 250);
      if (!circleRef.current) {
        circleRef.current = L.circle(latLng, {
          radius,
          color,
          weight: 1.5,
          fillColor: color,
          fillOpacity: 0.1,
          interactive: false,
        }).addTo(map);
      } else {
        circleRef.current.setLatLng(latLng);
        circleRef.current.setRadius(radius);
        circleRef.current.setStyle({ color, fillColor: color });
      }

      if (shouldFly) {
        map.flyTo(latLng, Math.max(map.getZoom(), 17), { duration: 0.65 });
      } else if (followingRef.current) {
        map.panTo(latLng, { animate: true, duration: 0.35 });
      }
    },
    [map]
  );

  useEffect(() => {
    const unsubscribe = subscribeGps(
      (pos) => {
        const nextFix = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
          heading: pos.coords.heading,
        };
        setFix(nextFix);
        setError(null);

        if (trackingRef.current) {
          const flyNow = pendingAnnounceRef.current;
          renderFixOnMap(nextFix, flyNow);
          if (pendingAnnounceRef.current) {
            pendingAnnounceRef.current = false;
            const nearestPlaceName = findNearestPlaceName(
              nextFix.lat,
              nextFix.lng,
              placesRef.current
            );
            announceCurrentLocation(nextFix.lat, nextFix.lng, {
              approximate: nextFix.accuracy > GPS_FAIR_M,
              nearestPlaceName,
            });
          }
        }
      },
      (err) => {
        setError(gpsErrorText(err));
      }
    );

    return () => {
      unsubscribe();
      clearLayers();
    };
  }, [renderFixOnMap, clearLayers]);

  const toggleLocate = useCallback(() => {
    unlockSpeech();

    if (isTracking) {
      setIsTracking(false);
      setIsFollowing(false);
      trackingRef.current = false;
      followingRef.current = false;
      pendingAnnounceRef.current = false;
      clearLayers();
      return;
    }

    setError(null);
    setIsTracking(true);
    trackingRef.current = true;

    if (fix) {
      renderFixOnMap(fix, true);
      const nearestPlaceName = findNearestPlaceName(
        fix.lat,
        fix.lng,
        placesRef.current
      );
      announceCurrentLocation(fix.lat, fix.lng, {
        approximate: fix.accuracy > GPS_FAIR_M,
        nearestPlaceName,
      });
    } else {
      pendingAnnounceRef.current = true;
      restartGpsWatch();
    }
  }, [isTracking, fix, renderFixOnMap, clearLayers]);

  const toggleFollow = useCallback(() => {
    if (!isTracking) return;
    setIsFollowing((prev) => {
      const next = !prev;
      followingRef.current = next;
      if (next && fix && map) {
        map.panTo([fix.lat, fix.lng], { animate: true });
      }
      return next;
    });
  }, [isTracking, fix, map]);

  const metrics = computeSignalMetrics(fix?.accuracy);
  const accuracyText =
    fix?.accuracy != null ? `±${Math.round(fix.accuracy)}m` : '—';
  const speedText =
    fix?.speed != null && Number.isFinite(fix.speed) && fix.speed >= 0
      ? `${(fix.speed * 3.6).toFixed(1)} km/h`
      : '—';
  const headingText =
    fix?.heading != null && Number.isFinite(fix.heading)
      ? `${Math.round(fix.heading)}°`
      : '—°';

  const buttonLabel = error
    ? 'Retry'
    : metrics.tier === 'poor' && fix
      ? 'Locate anyway'
      : 'Find my location';

  return {
    lastCoords: fix,
    activeBars: metrics.activeBars,
    tier: metrics.tier,
    badgeText: metrics.badgeText,
    accuracyText,
    speedText,
    headingText,
    warningText: error || metrics.warningText,
    buttonLabel,
    isTracking,
    isFollowing,
    canFollow: isTracking && Boolean(fix),
    toggleLocate,
    toggleFollow,
  };
}
