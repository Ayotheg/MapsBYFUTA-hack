export const FUTA_CENTER = [7.298, 5.138];
export const FUTA_DEFAULT_ZOOM = 16;
export const FUTA_BOUNDS = [
  [7.282, 5.108],
  [7.312, 5.168],
];

export const BASEMAPS = [
  {
    id: 'light',
    label: 'Light',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    maxZoom: 20,
    maxNativeZoom: 19,
  },
  {
    id: 'humanitarian',
    label: 'Humanitarian',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    subdomains: 'abc',
    maxZoom: 20,
    maxNativeZoom: 19,
  },
  {
    id: 'satellite',
    label: 'Satellite',
    attribution:
      'Tiles &copy; <a href="https://www.esri.com/">Esri</a> — Esri, Maxar, Earthstar Geographics',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    maxZoom: 19,
    maxNativeZoom: 15,
  },
  {
    id: 'terrain',
    label: 'Terrain',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors, SRTM &copy; <a href="https://opentopomap.org/">OpenTopoMap</a>',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    subdomains: 'abc',
    maxZoom: 19,
    maxNativeZoom: 17,
  },
];

export const DEFAULT_BASEMAP_ID = 'light';

export function getBasemap(id) {
  return BASEMAPS.find((item) => item.id === id) || BASEMAPS[0];
}
