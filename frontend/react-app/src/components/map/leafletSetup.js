import L from 'leaflet';

// leaflet-rotate patches window.L on import, so this module runs first.
window.L = L;

export const LeafletTouchZoom = L.Map.TouchZoom;
