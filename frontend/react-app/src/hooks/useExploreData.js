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
  const featured = pickRandomItems(SAMPLE_PLACES, 5);
  const featuredIds = new Set(featured.map((item) => item.id));
  const popular = SAMPLE_PLACES.filter((item) => !featuredIds.has(item.id));

  return {
    places: SAMPLE_PLACES,
    featuredPlaces: featured,
    popularPlaces: popular.length > 0 ? popular : SAMPLE_PLACES,
    channels: PLACEHOLDER_CHANNELS,
    events: PLACEHOLDER_EVENTS,
    people: PLACEHOLDER_PEOPLE,
    source: 'placeholder',
  };
}

/**
 * Fetches Explore data from VITE_EXPLORE_API_URL when configured,
 * picks 3–5 random places for the Explore Featured cards, ranks Popular on campus,
 * and falls back gracefully to editable local .js placeholders when API sections are absent.
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
        const nextFeatured =
          payload.featuredPlaces?.length > 0
            ? payload.featuredPlaces
            : pickRandomItems(nextPlaces, featuredCount);
        const featuredIds = new Set(nextFeatured.map((item) => item.id));
        const nextPopular =
          payload.popularPlaces?.length > 0
            ? payload.popularPlaces
            : nextPlaces.filter((item) => !featuredIds.has(item.id));

        setData({
          places: nextPlaces,
          featuredPlaces: nextFeatured,
          popularPlaces: nextPopular.length > 0 ? nextPopular : nextPlaces,
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

  return {
    places: data.places,
    featuredPlaces: data.featuredPlaces,
    popularPlaces: data.popularPlaces,
    channels: data.channels,
    events: data.events,
    people: data.people,
    source: data.source,
    loading,
    error,
    reload,
  };
}
