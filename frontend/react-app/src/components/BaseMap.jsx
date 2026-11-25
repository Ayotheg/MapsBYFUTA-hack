import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  DEFAULT_BASEMAP_ID,
  FUTA_BOUNDS,
  FUTA_CENTER,
  FUTA_DEFAULT_ZOOM,
  getBasemap,
} from '../data/basemaps';
import styles from './BaseMap.module.css';

/**
 * Full-bleed Leaflet base map centered on FUTA campus.
 * Manages the imperative Leaflet instance cleanly across StrictMode mounts.
 */
export default function BaseMap({
  basemapId = DEFAULT_BASEMAP_ID,
  selectedPlace = null,
  onMapReady,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const selectionMarkerRef = useRef(null);
  const onMapReadyRef = useRef(onMapReady);

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return undefined;

    const map = L.map(container, {
      center: FUTA_CENTER,
      zoom: FUTA_DEFAULT_ZOOM,
      minZoom: 5,
      maxZoom: 19,
      preferCanvas: true,
      zoomControl: false,
    });
    mapRef.current = map;

    if (window.innerWidth >= 768) {
      L.control.zoom({ position: 'bottomright' }).addTo(map);
    }

    const initialStyle = getBasemap(DEFAULT_BASEMAP_ID);
    const tileOptions = {
      attribution: initialStyle.attribution,
      maxZoom: initialStyle.maxZoom,
      maxNativeZoom: initialStyle.maxNativeZoom,
    };
    if (initialStyle.subdomains) {
      tileOptions.subdomains = initialStyle.subdomains;
    }
    tileLayerRef.current = L.tileLayer(initialStyle.url, tileOptions).addTo(map);

    const campusBoundsRect = L.rectangle(FUTA_BOUNDS, {
      color: '#0d9488',
      weight: 2,
      dashArray: '6 4',
      fillOpacity: 0.04,
      interactive: false,
    }).addTo(map);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    resizeObserver.observe(container);

    onMapReadyRef.current?.(map);

    return () => {
      resizeObserver.disconnect();
      if (selectionMarkerRef.current) {
        selectionMarkerRef.current.remove();
        selectionMarkerRef.current = null;
      }
      map.removeLayer(campusBoundsRect);
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current);
        tileLayerRef.current = null;
      }
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const style = getBasemap(basemapId);
    const nextOptions = {
      attribution: style.attribution,
      maxZoom: style.maxZoom,
      maxNativeZoom: style.maxNativeZoom,
    };
    if (style.subdomains) {
      nextOptions.subdomains = style.subdomains;
    }

    const previousLayer = tileLayerRef.current;
    const nextLayer = L.tileLayer(style.url, nextOptions).addTo(map);
    tileLayerRef.current = nextLayer;

    if (previousLayer) {
      map.removeLayer(previousLayer);
    }
  }, [basemapId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectionMarkerRef.current) {
      selectionMarkerRef.current.remove();
      selectionMarkerRef.current = null;
    }

    if (!selectedPlace || selectedPlace.lat == null || selectedPlace.lng == null) {
      return;
    }

    const coords = [selectedPlace.lat, selectedPlace.lng];
    const marker = L.circleMarker(coords, {
      radius: 9,
      color: '#ffffff',
      weight: 3,
      fillColor: '#7c3aed',
      fillOpacity: 1,
    }).addTo(map);

    const popupEl = document.createElement('div');
    const titleEl = document.createElement('strong');
    titleEl.textContent = selectedPlace.name;
    popupEl.appendChild(titleEl);
    if (selectedPlace.subtitle) {
      const subEl = document.createElement('div');
      subEl.style.fontSize = '12px';
      subEl.style.color = '#6b6478';
      subEl.textContent = selectedPlace.subtitle;
      popupEl.appendChild(subEl);
    }

    marker.bindPopup(popupEl, { closeButton: false, offset: [0, -6] }).openPopup();
    selectionMarkerRef.current = marker;

    map.flyTo(coords, Math.max(map.getZoom(), 17), { duration: 0.7 });
  }, [selectedPlace]);

  return (
    <div
      ref={containerRef}
      className={styles.mapWrap}
      aria-label="Interactive FUTA campus map"
    />
  );
}
