import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LeafletTouchZoom } from './map/leafletSetup';
import 'leaflet-rotate';
import './map/navLayers.css';
import {
  DEFAULT_BASEMAP_ID,
  FUTA_BOUNDS,
  FUTA_CENTER,
  FUTA_DEFAULT_ZOOM,
  getBasemap,
} from '../data/basemaps';
import styles from './BaseMap.module.css';

function applyZoomTierClass(container, zoom) {
  if (!container) return;
  container.classList.remove(
    'map-zoom-far',
    'map-zoom-mid',
    'map-zoom-near',
    'map-zoom-close'
  );
  if (zoom <= 14) container.classList.add('map-zoom-far');
  else if (zoom === 15) container.classList.add('map-zoom-mid');
  else if (zoom <= 17) container.classList.add('map-zoom-near');
  else container.classList.add('map-zoom-close');
}

/**
 * Full-bleed Leaflet base map centered on FUTA campus with leaflet-rotate
 * support for turn-by-turn route-up / north-up rotation.
 */
export default function BaseMap({
  basemapId = DEFAULT_BASEMAP_ID,
  selectedPlace = null,
  pickingLocation = false,
  pickedCoords = null,
  onMapReady,
  onMapClick,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileLayerRef = useRef(null);
  const pickMarkerRef = useRef(null);
  const onMapReadyRef = useRef(onMapReady);
  const onMapClickRef = useRef(onMapClick);

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

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
      rotate: true,
      bearing: 0,
      rotateControl: false,
      touchRotate: false,
      shiftKeyRotate: false,
    });
    mapRef.current = map;

    if (Array.isArray(map._handlers)) {
      map._handlers.forEach((handler) => {
        if (handler instanceof LeafletTouchZoom && handler !== map.touchZoom) {
          handler.disable();
        }
      });
    }

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

    const handleZoomClass = () => {
      applyZoomTierClass(container, map.getZoom());
    };
    handleZoomClass();
    map.on('zoomend', handleZoomClass);

    const handleMapClick = (event) => {
      onMapClickRef.current?.(event?.latlng || null);
    };
    map.on('click', handleMapClick);

    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    resizeObserver.observe(container);

    onMapReadyRef.current?.(map);

    return () => {
      resizeObserver.disconnect();
      map.off('zoomend', handleZoomClass);
      map.off('click', handleMapClick);
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

    if (
      !selectedPlace ||
      !Number.isFinite(selectedPlace.lat) ||
      !Number.isFinite(selectedPlace.lng)
    ) {
      return;
    }

    map.flyTo([selectedPlace.lat, selectedPlace.lng], Math.max(map.getZoom(), 18), {
      duration: 0.7,
    });
  }, [selectedPlace]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    if (pickMarkerRef.current) {
      map.removeLayer(pickMarkerRef.current);
      pickMarkerRef.current = null;
    }

    if (
      pickedCoords &&
      Number.isFinite(pickedCoords.lat) &&
      Number.isFinite(pickedCoords.lng)
    ) {
      pickMarkerRef.current = L.marker([pickedCoords.lat, pickedCoords.lng], {
        icon: L.divIcon({
          className: '',
          html: '<div class="mbf-nav-dest-pin"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
        interactive: false,
      }).addTo(map);
    }

    return () => {
      if (pickMarkerRef.current && mapRef.current) {
        mapRef.current.removeLayer(pickMarkerRef.current);
        pickMarkerRef.current = null;
      }
    };
  }, [pickedCoords]);

  return (
    <div
      ref={containerRef}
      className={styles.mapWrap}
      style={pickingLocation ? { cursor: 'crosshair' } : undefined}
      aria-label="Interactive FUTA campus map"
    />
  );
}
