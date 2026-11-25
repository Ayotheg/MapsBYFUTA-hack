import { useCallback, useState } from 'react';
import { formatWaypointType } from '../data/waypointColors';

const STORAGE_KEY = 'mapsbyfuta_user_waypoints_v1';

function readStoredPlaces() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredPlaces(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore storage quota errors (e.g., large photos)
  }
}

/**
 * Manages user-suggested waypoints persisted in localStorage.
 * New suggestions are immediately added to the live map waypoints list.
 */
export function useSuggestedPlaces() {
  const [suggestedPlaces, setSuggestedPlaces] = useState(readStoredPlaces);

  const addSuggestedPlace = useCallback((draft) => {
    const type = (draft.type || 'landmark').toString().trim().toLowerCase();
    const category = formatWaypointType(type);
    const area = (draft.area || '').trim();
    const description = (draft.description || '').trim();
    const photos = Array.isArray(draft.photos) ? draft.photos.filter(Boolean) : [];

    const place = {
      id: `suggested-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: (draft.name || '').trim(),
      type,
      category,
      subtitle: area || description || category,
      area,
      description,
      lat: Number(draft.lat),
      lng: Number(draft.lng),
      image: photos[0] || '',
      images: photos,
      isUserSuggested: true,
      createdAt: new Date().toISOString(),
    };

    setSuggestedPlaces((prev) => {
      const next = [place, ...prev];
      writeStoredPlaces(next);
      return next;
    });

    return place;
  }, []);

  const removeSuggestedPlace = useCallback((id) => {
    setSuggestedPlaces((prev) => {
      const next = prev.filter((item) => item.id !== id);
      writeStoredPlaces(next);
      return next;
    });
  }, []);

  return {
    suggestedPlaces,
    addSuggestedPlace,
    removeSuggestedPlace,
  };
}
