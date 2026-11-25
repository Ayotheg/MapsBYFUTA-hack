import { useMemo, useState } from 'react';
import {
  Bike,
  Car,
  Footprints,
  Info,
  MapPin,
  Navigation,
  Search,
  X,
} from 'lucide-react';
import { formatWaypointType, getWaypointColor } from '../../data/waypointColors';
import { formatDistance, haversineMeters } from '../../utils/geo';
import styles from './NavDestPanel.module.css';

const TRAVEL_MODES = [
  { key: 'walk', label: 'Walk', Icon: Footprints },
  { key: 'bike', label: 'Bike', Icon: Bike },
  { key: 'ride', label: 'Ride', Icon: Car },
];

/**
 * Navigation Destination Picker:
 * - Desktop (>=768px): floating card on the left beside the Navbar rail.
 * - Mobile (<768px): bottom sheet with "Where to?", popular places, Walk/Bike/Ride, and Start Navigation.
 */
export default function NavDestPanel({
  open = false,
  places = [],
  popularPlaces = [],
  selectedDestination = null,
  onSelectDestination,
  travelMode = 'walk',
  onTravelModeChange,
  userCoords = null,
  loading = false,
  error = '',
  onStart,
  onClose,
}) {
  const [query, setQuery] = useState(selectedDestination?.name || '');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return places
      .filter((place) => {
        if (!Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return false;
        const hay = `${place.name} ${place.subtitle || ''} ${place.type || ''}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, 6);
  }, [places, query]);

  const topPopular = useMemo(
    () =>
      popularPlaces
        .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
        .slice(0, 2),
    [popularPlaces]
  );

  if (!open) return null;

  function pickPlace(place) {
    setQuery(place.name);
    setDropdownOpen(false);
    onSelectDestination?.(place);
  }

  return (
    <aside className={styles.panel} aria-label="Directions destination picker">
      <div className={styles.handleRow}>
        <span className={styles.handlePill} />
      </div>

      <div className={styles.headerRow}>
        <h2 className={styles.title}>Directions</h2>
        <button
          type="button"
          className={styles.closeBtn}
          aria-label="Close directions"
          onClick={() => onClose?.()}
        >
          <X size={16} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>

      <div className={styles.searchWrap}>
        <Search size={16} strokeWidth={2} className={styles.searchIcon} aria-hidden="true" />
        <input
          type="text"
          className={styles.input}
          placeholder="Where to?"
          aria-label="Destination"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setDropdownOpen(true);
            if (!e.target.value.trim()) onSelectDestination?.(null);
          }}
          onFocus={() => {
            if (query.trim()) setDropdownOpen(true);
          }}
        />
        <button
          type="button"
          className={styles.clearBtn}
          aria-label={query ? 'Clear destination' : 'Close directions'}
          onClick={() => {
            if (query) {
              setQuery('');
              setDropdownOpen(false);
              onSelectDestination?.(null);
            } else {
              onClose?.();
            }
          }}
        >
          <X size={15} strokeWidth={2.2} aria-hidden="true" />
        </button>

        {dropdownOpen && suggestions.length > 0 && (
          <div className={styles.dropdown}>
            {suggestions.map((place) => (
              <button
                key={place.id}
                type="button"
                className={styles.ddItem}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickPlace(place);
                }}
              >
                <span className={styles.ddIcon}>
                  <MapPin size={14} strokeWidth={2} aria-hidden="true" />
                </span>
                <span className={styles.ddBody}>
                  <span className={styles.ddName}>{place.name}</span>
                  <span className={styles.ddSub}>
                    {formatWaypointType(place.type)}
                    {place.subtitle ? ` · ${place.subtitle}` : ''}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className={styles.errorCard}>
          <Info size={14} strokeWidth={2} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {topPopular.length > 0 && (
        <div className={styles.popularSection}>
          <div className={styles.popularLabel}>POPULAR PLACES ON CAMPUS</div>
          <div className={styles.popularGrid}>
            {topPopular.map((place) => {
              const dist =
                userCoords && Number.isFinite(place.lat) && Number.isFinite(place.lng)
                  ? `${formatDistance(
                      haversineMeters(
                        userCoords.lat,
                        userCoords.lng,
                        place.lat,
                        place.lng
                      )
                    )} away`
                  : formatWaypointType(place.type);
              const active = selectedDestination?.id === place.id;

              return (
                <button
                  key={place.id}
                  type="button"
                  className={`${styles.popularCard} ${
                    active ? styles.popularCardActive : ''
                  }`}
                  onClick={() => pickPlace(place)}
                >
                  <span
                    className={styles.popularBadge}
                    style={{ backgroundColor: getWaypointColor(place.type) }}
                    aria-hidden="true"
                  >
                    <MapPin size={13} strokeWidth={2.2} />
                  </span>
                  <span className={styles.popularName}>{place.name}</span>
                  <span className={`${styles.popularMeta} tabular-nums`}>
                    {dist}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.modeSegment} role="tablist" aria-label="Travel mode">
        {TRAVEL_MODES.map(({ key, label, Icon }) => {
          const active = travelMode === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              className={`${styles.modeBtn} ${active ? styles.modeBtnActive : ''}`}
              onClick={() => onTravelModeChange?.(key)}
            >
              <Icon size={15} strokeWidth={2} aria-hidden="true" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className={styles.startBtn}
        disabled={!selectedDestination || loading}
        onClick={() => onStart?.(selectedDestination, travelMode)}
      >
        <Navigation size={16} strokeWidth={2.2} aria-hidden="true" />
        <span>
          {loading
            ? 'Finding route…'
            : selectedDestination
              ? 'Start Navigation'
              : 'Pick a destination'}
        </span>
      </button>
    </aside>
  );
}
