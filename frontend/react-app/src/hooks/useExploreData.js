import { useCallback, useEffect, useState } from 'react';
import { PLACEHOLDER_CHANNELS } from '../data/exploreChannels';
import { PLACEHOLDER_EVENTS } from '../data/exploreEvents';
import { PLACEHOLDER_PEOPLE } from '../data/explorePeople';
import { SAMPLE_PLACES } from '../data/samplePlaces';
import {
  fetchExplorePayload,
  isExploreApiConfigured,
  pickRandomItems,
} from '../services/exploreApi';

function buildInitialState() {
  return {
    places: SAMPLE_PLACES,
    featuredPlaces: pickRandomItems(SAMPLE_PLACES, 5),
    channels: PLACEHOLDER_CHANNELS,
    events: PLACEHOLDER_EVENTS,
    people: PLACEHOLDER_PEOPLE,
    source: 'placeholder',
  };
}

/**
 * Fetches Explore data from VITE_EXPLORE_API_URL when configured,
 * picks 3–5 random places for the Explore Featured cards, and falls back
 * gracefully to editable local .js placeholders when API sections are absent.
 */
export function useExploreData() {
  const [data, setData] = useState(buildInitialState);
  const [loading, setLoading] = useState(() => isExploreApiConfigured());
  const [error, setError] = useState(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const reload = useCallback(() => {
    setError(null);
    if (isExploreApiConfigured()) {
      setLoading(true);
    }
    setRefreshTick((tick) => tick + 1);
  }, []);

  useEffect(() => {
    if (!isExploreApiConfigured()) return undefined;

    const controller = new AbortController();

    fetchExplorePayload({ signal: controller.signal })
      .then((payload) => {
        const nextPlaces =
          payload.places.length > 0 ? payload.places : SAMPLE_PLACES;
        const featuredCount = Math.min(5, Math.max(3, nextPlaces.length));

        setData({
          places: nextPlaces,
          featuredPlaces: pickRandomItems(nextPlaces, featuredCount),
          channels:
            payload.channels.length > 0
              ? payload.channels
              : PLACEHOLDER_CHANNELS,
          events:
            payload.events.length > 0 ? payload.events : PLACEHOLDER_EVENTS,
          people:
            payload.people.length > 0 ? payload.people : PLACEHOLDER_PEOPLE,
          source: payload.places.length > 0 ? 'api' : 'placeholder',
        });
        setError(null);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setError(err.message || 'Could not load Explore data');
        setLoading(false);
      });

    return () => controller.abort();
  }, [refreshTick]);

  const featuredIds = new Set(data.featuredPlaces.map((item) => item.id));
  const popularPlaces = data.places.filter((item) => !featuredIds.has(item.id));

  return {
    places: data.places,
    featuredPlaces: data.featuredPlaces,
    popularPlaces: popularPlaces.length > 0 ? popularPlaces : data.places,
    channels: data.channels,
    events: data.events,
    people: data.people,
    source: data.source,
    loading,
    error,
    reload,
  };
}
