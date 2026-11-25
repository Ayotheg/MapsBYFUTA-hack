import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { FUTA_CENTER } from '../data/basemaps';
import { subscribeGps } from '../services/gpsWatch';
import { fetchRoute } from '../services/routingService';
import { speak, unlockSpeech } from '../services/speech';
import {
  cumulativeDistances,
  distanceToPolyline,
  formatDistance,
  haversineMeters,
  headingAhead,
  placesAlong,
} from '../utils/geo';

const ARRIVAL_RADIUS_M = 20;
const ARRIVING_RADIUS_M = 50;
const OFF_ROUTE_M = 45;
const NAV_START_ZOOM = 18;

/**
 * Full turn-by-turn Leaflet navigation controller:
 * - OSRM routing (Walk / Bike / Ride)
 * - Leaflet polyline + destination pin + pulsing user dot
 * - leaflet-rotate Route-Up vs North-Up map bearing
 * - Nearby places along the route ahead
 * - Browser voice guidance + arrival detection
 */
export function useNavigation({ map, places = [], gps }) {
  const [destPanelOpen, setDestPanelOpen] = useState(false);
  const [destination, setDestination] = useState(null);
  const [travelMode, setTravelMode] = useState('walk');
  const [navActive, setNavActive] = useState(false);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [routeError, setRouteError] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [routeUp, setRouteUp] = useState(true);
  const [mapBearing, setMapBearing] = useState(0);
  const [nearbyItems, setNearbyItems] = useState([]);
  const [arrivedDest, setArrivedDest] = useState(null);
  const [hudState, setHudState] = useState({
    status: 'active',
    turnIcon: 'straight',
    instruction: 'Follow the route',
    stepDistance: '',
    nextInstruction: '',
    distanceRemaining: '—',
  });

  const routeLayersRef = useRef([]);
  const userMarkerRef = useRef(null);
  const routeDataRef = useRef(null); // { coords, cum, steps, totalDist, dest }
  const lastSpokenStepRef = useRef(-1);
  const lastHeadingRef = useRef(0);
  const routeUpRef = useRef(true);
  const voiceRef = useRef(true);
  const reroutingRef = useRef(false);
  const placesRef = useRef(places);

  useEffect(() => {
    placesRef.current = places;
  }, [places]);

  useEffect(() => {
    routeUpRef.current = routeUp;
  }, [routeUp]);

  useEffect(() => {
    voiceRef.current = voiceEnabled;
  }, [voiceEnabled]);

  const clearMapLayers = useCallback(() => {
    if (map) {
      for (const layer of routeLayersRef.current) {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      }
      if (userMarkerRef.current && map.hasLayer(userMarkerRef.current)) {
        map.removeLayer(userMarkerRef.current);
      }
      if (typeof map.setBearing === 'function') {
        map.setBearing(0);
      }
    }
    routeLayersRef.current = [];
    userMarkerRef.current = null;
    setMapBearing(0);
  }, [map]);

  const applyBearing = useCallback(
    (routeHeadingDeg) => {
      lastHeadingRef.current = routeHeadingDeg;
      if (!map || typeof map.setBearing !== 'function') return;
      const targetBearing = routeUpRef.current
        ? (360 - routeHeadingDeg) % 360
        : 0;
      map.setBearing(targetBearing);
      setMapBearing(targetBearing);
    },
    [map]
  );

  const drawRouteOnMap = useCallback(
    (coords, startCoords, destPlace) => {
      if (!map) return;
      for (const layer of routeLayersRef.current) {
        if (map.hasLayer(layer)) map.removeLayer(layer);
      }
      routeLayersRef.current = [];

      const casing = L.polyline(coords, {
        color: '#ffffff',
        weight: 9,
        opacity: 0.92,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      const activeLine = L.polyline(coords, {
        color: '#0d9488',
        weight: 5,
        opacity: 0.95,
        dashArray: '10 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      const destIcon = L.divIcon({
        className: '',
        html: '<div class="mbf-nav-dest-pin"><div class="mbf-nav-dest-dot"></div></div>',
        iconSize: [34, 34],
        iconAnchor: [17, 34],
      });
      const destMarker = L.marker([destPlace.lat, destPlace.lng], {
        icon: destIcon,
        zIndexOffset: 950,
      }).addTo(map);

      routeLayersRef.current = [casing, activeLine, destMarker];

      if (!userMarkerRef.current) {
        const userIcon = L.divIcon({
          className: '',
          html: '<div class="mbf-gps-dot" style="--dot-color:#0d9488"><div class="mbf-gps-pulse"></div><div class="mbf-gps-core"></div></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        });
        userMarkerRef.current = L.marker(startCoords, {
          icon: userIcon,
          zIndexOffset: 1000,
          interactive: false,
        }).addTo(map);
      } else {
        userMarkerRef.current.setLatLng(startCoords);
      }
    },
    [map]
  );

  const updateProgressFromCoords = useCallback(
    (lat, lng) => {
      const current = routeDataRef.current;
      if (!current || !map) return;

      const { coords, cum, steps, totalDist, dest } = current;
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([lat, lng]);
      }

      const distToDest = haversineMeters(lat, lng, dest.lat, dest.lng);
      if (distToDest <= ARRIVAL_RADIUS_M) {
        clearMapLayers();
        routeDataRef.current = null;
        setNavActive(false);
        setNearbyItems([]);
        setArrivedDest(dest);
        if (voiceRef.current) {
          speak(`You have arrived at ${dest.name}.`);
        }
        return;
      }

      const { offsetMeters, alongMeters } = distanceToPolyline(
        lat,
        lng,
        coords,
        cum
      );
      const remaining = Math.max(0, totalDist - alongMeters);

      // Find next maneuver step ahead
      let stepIdx = 0;
      let acc = 0;
      for (let i = 0; i < steps.length; i += 1) {
        acc += steps[i].distance || 0;
        if (acc >= alongMeters - 10) {
          stepIdx = i;
          break;
        }
        stepIdx = i;
      }

      const activeStep = steps[stepIdx] || steps[0];
      const nextStep = steps[stepIdx + 1] || null;
      const distToTurn = Math.max(0, acc - alongMeters);

      const status =
        distToDest <= ARRIVING_RADIUS_M ? 'arriving' : 'active';

      setHudState({
        status,
        turnIcon: activeStep?.turnIcon || 'straight',
        instruction: activeStep?.instruction || 'Continue straight',
        stepDistance: `${formatDistance(distToTurn)} remaining`,
        nextInstruction: nextStep?.instruction || '',
        distanceRemaining: formatDistance(remaining),
      });

      if (voiceRef.current && stepIdx !== lastSpokenStepRef.current && activeStep) {
        lastSpokenStepRef.current = stepIdx;
        speak(activeStep.instruction);
      }

      const heading = headingAhead(coords, cum, alongMeters, 30);
      applyBearing(heading);
      map.panTo([lat, lng], { animate: true, duration: 0.35 });

      const nearby = placesAlong(
        coords,
        cum,
        alongMeters,
        Math.min(totalDist, alongMeters + 400),
        placesRef.current.filter((p) => String(p.id) !== String(dest.id)),
        { maxOffset: 45, limit: 10 }
      );
      setNearbyItems(nearby);

      // Re-route if off route
      if (offsetMeters > OFF_ROUTE_M && !reroutingRef.current) {
        reroutingRef.current = true;
        fetchRoute(lat, lng, dest.lat, dest.lng, travelMode)
          .then((newRoute) => {
            if (!routeDataRef.current) return;
            const newCum = cumulativeDistances(newRoute.coords);
            routeDataRef.current = {
              coords: newRoute.coords,
              cum: newCum,
              steps: newRoute.steps,
              totalDist: newRoute.distance,
              dest,
            };
            lastSpokenStepRef.current = -1;
            drawRouteOnMap(newRoute.coords, [lat, lng], dest);
          })
          .catch(() => {})
          .finally(() => {
            reroutingRef.current = false;
          });
      }
    },
    [map, travelMode, applyBearing, clearMapLayers, drawRouteOnMap]
  );

  const openNavPicker = useCallback((prefillPlace = null) => {
    setRouteError('');
    if (prefillPlace) {
      setDestination(prefillPlace);
    }
    setDestPanelOpen(true);
  }, []);

  const closeNavPicker = useCallback(() => {
    setDestPanelOpen(false);
    setRouteError('');
  }, []);

  const startNavigation = useCallback(
    async (targetPlace = destination, mode = travelMode) => {
      if (!targetPlace || !Number.isFinite(targetPlace.lat) || !Number.isFinite(targetPlace.lng)) {
        setRouteError('Pick a valid destination first.');
        return;
      }

      unlockSpeech();
      setLoadingRoute(true);
      setRouteError('');

      const originLat = gps?.lastCoords?.lat ?? FUTA_CENTER[0];
      const originLng = gps?.lastCoords?.lng ?? FUTA_CENTER[1];

      try {
        const route = await fetchRoute(
          originLat,
          originLng,
          targetPlace.lat,
          targetPlace.lng,
          mode
        );

        const cum = cumulativeDistances(route.coords);
        routeDataRef.current = {
          coords: route.coords,
          cum,
          steps: route.steps,
          totalDist: route.distance,
          dest: targetPlace,
        };
        lastSpokenStepRef.current = 0;

        drawRouteOnMap(route.coords, [originLat, originLng], targetPlace);

        const initialHeading = headingAhead(route.coords, cum, 0, 30);
        if (map) {
          map.setView([originLat, originLng], NAV_START_ZOOM, { animate: true });
        }
        applyBearing(initialHeading);

        const firstStep = route.steps[0];
        const secondStep = route.steps[1];

        setHudState({
          status: 'active',
          turnIcon: firstStep?.turnIcon || 'straight',
          instruction: firstStep?.instruction || 'Follow the route',
          stepDistance: `${formatDistance(firstStep?.distance ?? route.distance)} remaining`,
          nextInstruction: secondStep?.instruction || '',
          distanceRemaining: formatDistance(route.distance),
        });

        const initialNearby = placesAlong(
          route.coords,
          cum,
          0,
          Math.min(route.distance, 400),
          placesRef.current.filter((p) => String(p.id) !== String(targetPlace.id)),
          { maxOffset: 45, limit: 10 }
        );
        setNearbyItems(initialNearby);

        setDestination(targetPlace);
        setTravelMode(mode);
        setDestPanelOpen(false);
        setArrivedDest(null);
        setNavActive(true);

        if (voiceRef.current && firstStep?.instruction) {
          speak(
            `Starting navigation to ${targetPlace.name}. ${firstStep.instruction}.`
          );
        }
      } catch (err) {
        setRouteError(err.message || 'Could not calculate a route right now.');
      } finally {
        setLoadingRoute(false);
      }
    },
    [destination, travelMode, gps?.lastCoords, map, drawRouteOnMap, applyBearing]
  );

  const endNavigation = useCallback(() => {
    clearMapLayers();
    routeDataRef.current = null;
    lastSpokenStepRef.current = -1;
    setNavActive(false);
    setNearbyItems([]);
  }, [clearMapLayers]);

  const toggleRouteUp = useCallback(() => {
    setRouteUp((prev) => {
      const next = !prev;
      routeUpRef.current = next;
      if (map && typeof map.setBearing === 'function') {
        const nextBearing = next ? (360 - lastHeadingRef.current) % 360 : 0;
        map.setBearing(nextBearing);
        setMapBearing(nextBearing);
      }
      return next;
    });
  }, [map]);

  const toggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => !prev);
  }, []);

  const dismissArrival = useCallback(() => {
    setArrivedDest(null);
  }, []);

  useEffect(() => {
    if (!navActive) return undefined;
    const unsubscribe = subscribeGps((pos) => {
      updateProgressFromCoords(pos.coords.latitude, pos.coords.longitude);
    });
    return () => unsubscribe();
  }, [navActive, updateProgressFromCoords]);

  useEffect(() => () => clearMapLayers(), [clearMapLayers]);

  return {
    destPanelOpen,
    destination,
    setDestination,
    travelMode,
    setTravelMode,
    navActive,
    loadingRoute,
    routeError,
    voiceEnabled,
    routeUp,
    mapBearing,
    hudState,
    nearbyItems,
    arrivedDest,
    openNavPicker,
    closeNavPicker,
    startNavigation,
    endNavigation,
    toggleRouteUp,
    toggleVoice,
    dismissArrival,
  };
}
