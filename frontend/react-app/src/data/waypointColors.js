export const DEFAULT_WAYPOINT_COLOR = '#0d9488';

export const WAYPOINT_COLORS = {
  lecture_hall: '#378ADD',
  faculty: '#185FA5',
  laboratory: '#5DCAA5',
  workshop: '#1D9E75',
  library: '#9FE1CB',
  admin: '#7F77DD',
  hostel: '#EF9F27',
  staff_quarters: '#BA7517',
  food: '#F97316',
  shop: '#D85A30',
  printing_shop: '#6366F1',
  printing: '#6366F1',
  fuel: '#84CC16',
  bank: '#993C1D',
  sports: '#D4537E',
  hall: '#ED93B1',
  clinic: '#F4C0D1',
  toilet: '#38BDF8',
  garage: '#888780',
  bus_stop: '#5F5E5A',
  infrastructure: '#B4B2A9',
  mosque: '#FAC775',
  chapel: '#C084FC',
  gate: '#E24B4A',
  landmark: '#AFA9EC',
};

const WAYPOINT_LABELS = {
  lecture_hall: 'Lecture Hall',
  faculty: 'Faculty Building',
  laboratory: 'Laboratory',
  workshop: 'Workshop / Studio',
  library: 'Library',
  admin: 'Admin / Registry',
  hostel: 'Student Hostel',
  staff_quarters: 'Staff Quarters',
  food: 'Food & Drinks',
  shop: 'Shop / Services',
  printing_shop: 'Print Shop',
  printing: 'Printing',
  fuel: 'Fuel Station',
  bank: 'Bank / ATM',
  sports: 'Sports Facility',
  hall: 'Multipurpose Hall',
  clinic: 'Clinic / Health Centre',
  toilet: 'Toilet',
  garage: 'Garage / Motor Park',
  bus_stop: 'Bus Stop',
  infrastructure: 'Infrastructure',
  mosque: 'Mosque',
  chapel: 'Chapel / Church',
  gate: 'Gate / Entrance',
  landmark: 'Landmark',
};

export function getWaypointColor(type) {
  const key = (type || '').toString().trim().toLowerCase();
  return WAYPOINT_COLORS[key] || DEFAULT_WAYPOINT_COLOR;
}

export function formatWaypointType(type) {
  const key = (type || '').toString().trim().toLowerCase();
  if (WAYPOINT_LABELS[key]) return WAYPOINT_LABELS[key];
  const clean = key.replace(/_/g, ' ').trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'Campus Spot';
}

export const RATEABLE_TYPES = new Set([
  'food',
  'shop',
  'printing_shop',
  'printing',
  'fuel',
  'bank',
  'restaurant',
  'cafe',
]);

export function isRateablePlace(place) {
  if (!place) return false;
  const typeKey = (place.type || place.category || '').toString().trim().toLowerCase();
  return (
    RATEABLE_TYPES.has(typeKey) ||
    Number(place.rating) > 0 ||
    Number(place.reviewCount) > 0
  );
}
