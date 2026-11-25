import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { getWaypointColor } from '../../data/waypointColors';
import './waypointPins.css';

const MARKER_GAP = 8;
const OFFSET_CANDIDATES = [
  [0, 0],
  [0, 24],
  [0, -24],
  [28, 0],
  [-28, 0],
  [0, 48],
  [0, -48],
  [52, 0],
  [-52, 0],
];

function boxesOverlap(a, b) {
  return (
    a.left < b.right + MARKER_GAP &&
    a.right + MARKER_GAP > b.left &&
    a.top < b.bottom + MARKER_GAP &&
    a.bottom + MARKER_GAP > b.top
  );
}

function layoutVisibleMarkers(map, entries) {
  const placed = [];
  const visibleEntries = entries
    .filter(
      ({ marker }) =>
        marker._rendered && map.hasLayer(marker) && marker.getElement()
    )
    .sort((a, b) => a.marker.getLatLng().lat - b.marker.getLatLng().lat);

  for (const { marker } of visibleEntries) {
    const el = marker.getElement();
    el.style.marginLeft = '0px';
    el.style.marginTop = '0px';
  }

  for (const { marker } of visibleEntries) {
    const el = marker.getElement();
    const point = map.latLngToLayerPoint(marker.getLatLng());
    const label = el.querySelector('.mbf-pin-label');
    const labelVisible =
      label &&
      getComputedStyle(label).display !== 'none' &&
      getComputedStyle(label).opacity !== '0';

    const width = labelVisible ? el.offsetWidth : 14;
    const height = labelVisible ? el.offsetHeight : 14;
    let chosen = OFFSET_CANDIDATES[OFFSET_CANDIDATES.length - 1];

    for (const candidate of OFFSET_CANDIDATES) {
      const left = point.x - 7 + candidate[0];
      const top = point.y - 7 + candidate[1];
      const box = { left, top, right: left + width, bottom: top + height };
      if (!placed.some((other) => boxesOverlap(box, other))) {
        chosen = candidate;
        placed.push(box);
        break;
      }
    }

    el.style.marginLeft = `${chosen[0]}px`;
    el.style.marginTop = `${chosen[1]}px`;
  }
}

function createWaypointMarker(place) {
  const color = getWaypointColor(place.type || place.category);
  const icon = L.divIcon({
    className: '',
    html: `<div class="mbf-pin-wrap" style="--pin-color:${color}"><div class="mbf-pin-dot"></div><span class="mbf-pin-label"></span></div>`,
    iconSize: null,
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
  });

  const marker = L.marker([place.lat, place.lng], {
    icon,
    zIndexOffset: 100,
    title: place.name,
  });

  marker.on('add', () => {
    const el = marker.getElement();
    const labelEl = el?.querySelector('.mbf-pin-label');
    if (labelEl) {
      labelEl.textContent = place.name || '';
    }
  });

  return marker;
}

function isTypeAllowed(place, visibleTypes) {
  if (!visibleTypes) return true;
  const typeKey = (place.type || place.category || '').toLowerCase();
  if (typeof visibleTypes === 'function') return visibleTypes(typeKey);
  if (visibleTypes instanceof Set) return visibleTypes.has(typeKey);
  return true;
}

/**
 * Renders all API/local waypoints onto the Leaflet BaseMap using
 * viewport-lazy loading and zoom-tier label styling.
 */
export default function WaypointMarkers({
  map,
  places = [],
  selectedPlaceId = null,
  visibleTypes = null,
  onSelectPlace,
}) {
  const entriesRef = useRef([]);
  const onSelectRef = useRef(onSelectPlace);

  useEffect(() => {
    onSelectRef.current = onSelectPlace;
  }, [onSelectPlace]);

  useEffect(() => {
    if (!map) return undefined;

    const validPlaces = places.filter(
      (place) => Number.isFinite(place.lat) && Number.isFinite(place.lng)
    );
    if (validPlaces.length === 0) {
      entriesRef.current = [];
      return undefined;
    }

    const entries = validPlaces.map((place) => {
      const marker = createWaypointMarker(place);
      marker._rendered = false;
      marker.on('click', (event) => {
        L.DomEvent.stopPropagation(event);
        onSelectRef.current?.(place);
      });
      return { marker, place };
    });
    entriesRef.current = entries;

    const initialBounds = map.getBounds().pad(0.25);
    for (const { marker, place } of entries) {
      if (initialBounds.contains(marker.getLatLng())) {
        marker._rendered = true;
        if (isTypeAllowed(place, visibleTypes)) {
          marker.addTo(map);
        }
      }
    }

    function renderViewportMarkers() {
      const bounds = map.getBounds().pad(0.35);
      for (const { marker, place } of entriesRef.current) {
        if (marker._rendered) continue;
        if (bounds.contains(marker.getLatLng())) {
          marker._rendered = true;
          if (isTypeAllowed(place, visibleTypes)) {
            marker.addTo(map);
          }
        }
      }
      requestAnimationFrame(() => layoutVisibleMarkers(map, entriesRef.current));
    }

    const handleViewChange = () => {
      renderViewportMarkers();
    };

    map.on('moveend zoomend', handleViewChange);
    const rafId = requestAnimationFrame(() =>
      layoutVisibleMarkers(map, entriesRef.current)
    );

    return () => {
      cancelAnimationFrame(rafId);
      map.off('moveend zoomend', handleViewChange);
      for (const { marker } of entries) {
        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      }
      entriesRef.current = [];
    };
  }, [map, places, visibleTypes]);

  useEffect(() => {
    if (!map) return;

    for (const { marker, place } of entriesRef.current) {
      const isSelected =
        selectedPlaceId != null && String(place.id) === String(selectedPlaceId);

      marker.setZIndexOffset(isSelected ? 600 : 100);
      const wrap = marker.getElement()?.querySelector('.mbf-pin-wrap');
      if (wrap) {
        wrap.classList.toggle('mbf-pin-selected', isSelected);
      }
    }
  }, [map, selectedPlaceId, places]);

  return null;
}
