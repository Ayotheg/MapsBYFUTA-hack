import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Heart, Navigation, X } from 'lucide-react';
import { QUICK_CHIPS, SAMPLE_PLACES } from '../../data/samplePlaces';
import QuickChips from './QuickChips';
import SearchResultsList from './SearchResultsList';
import styles from './SearchBar.module.css';

/**
 * Floating campus search bar + quick category chips.
 * Renders identically styled pills on desktop and mobile:
 * - Desktop: inline input with floating results dropdown.
 * - Mobile: tapping the pill opens the full-screen search overlay.
 */
export default function SearchBar({
  places = SAMPLE_PLACES,
  chips = QUICK_CHIPS,
  panelOpen = false,
  onSelectPlace,
  onNavigateClick,
  onSupportClick,
}) {
  const [query, setQuery] = useState('');
  const [activeChipId, setActiveChipId] = useState(null);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef(null);
  const desktopInputRef = useRef(null);
  const mobileInputRef = useRef(null);

  const activeChip = useMemo(
    () => chips.find((chip) => chip.id === activeChipId) || null,
    [chips, activeChipId]
  );

  const filteredPlaces = useMemo(() => {
    const clean = query.trim().toLowerCase();

    return places.filter((place) => {
      if (activeChipId && activeChipId !== 'all' && place.category !== activeChipId) {
        return false;
      }
      if (!clean) {
        return Boolean(activeChipId);
      }
      const haystack = [place.name, place.subtitle, place.badge, place.category]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(clean);
    });
  }, [places, query, activeChipId]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setDesktopOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const timer = setTimeout(() => {
      mobileInputRef.current?.focus();
    }, 60);
    return () => clearTimeout(timer);
  }, [mobileOpen]);

  function handleSelect(place) {
    setQuery(place.name);
    setActiveChipId(null);
    setDesktopOpen(false);
    setMobileOpen(false);
    setActiveIndex(-1);
    onSelectPlace?.(place);
  }

  function handleClear() {
    setQuery('');
    setActiveChipId(null);
    setActiveIndex(-1);
    setDesktopOpen(false);
    onSelectPlace?.(null);
    desktopInputRef.current?.focus();
    mobileInputRef.current?.focus();
  }

  function handleChipClick(chip) {
    const nextId = activeChipId === chip.id ? null : chip.id;
    setActiveChipId(nextId);
    setQuery('');
    setActiveIndex(-1);
    setDesktopOpen(Boolean(nextId));
  }

  function handleAllPlacesClick() {
    const nextId = activeChipId === 'all' ? null : 'all';
    setActiveChipId(nextId);
    setQuery('');
    setActiveIndex(-1);
    setDesktopOpen(Boolean(nextId));
  }

  function handleDesktopKeyDown(event) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setDesktopOpen(true);
      setActiveIndex((prev) =>
        Math.min(prev + 1, Math.max(filteredPlaces.length - 1, 0))
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target =
        activeIndex >= 0 ? filteredPlaces[activeIndex] : filteredPlaces[0];
      if (target) handleSelect(target);
    } else if (event.key === 'Escape') {
      setDesktopOpen(false);
      desktopInputRef.current?.blur();
    }
  }

  const showDesktopDropdown =
    desktopOpen && (Boolean(query.trim()) || Boolean(activeChipId));

  const mobileDisplayLabel =
    query.trim() || (activeChipId === 'all' ? 'All places' : activeChip?.label) || '';

  return (
    <>
      <div
        ref={wrapperRef}
        className={`${styles.container} ${
          panelOpen ? styles.containerWithPanel : ''
        }`}
      >
        <div className={styles.pillWrap}>
          <div className={styles.pill}>
            <button
              type="button"
              className={styles.heartBtn}
              aria-label="Support Maps By FUTA"
              title="Support Maps By FUTA"
              onClick={() => onSupportClick?.()}
            >
              <Heart size={18} strokeWidth={2} aria-hidden="true" />
            </button>

            <input
              ref={desktopInputRef}
              type="text"
              className={styles.desktopInput}
              placeholder="Search FUTA campus..."
              aria-label="Search FUTA campus"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActiveChipId(null);
                setActiveIndex(-1);
                setDesktopOpen(Boolean(event.target.value.trim()));
              }}
              onFocus={() => {
                if (query.trim() || activeChipId) setDesktopOpen(true);
              }}
              onKeyDown={handleDesktopKeyDown}
            />

            <button
              type="button"
              className={styles.mobileTrigger}
              onClick={() => setMobileOpen(true)}
            >
              <span
                className={
                  mobileDisplayLabel
                    ? styles.mobileValue
                    : styles.mobilePlaceholder
                }
              >
                {mobileDisplayLabel || 'Search FUTA campus...'}
              </span>
            </button>

            {query && (
              <button
                type="button"
                className={styles.clearBtn}
                aria-label="Clear search"
                onClick={handleClear}
              >
                <X size={14} strokeWidth={2.2} aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              className={styles.navBtn}
              aria-label="Start navigation"
              title="Navigate"
              onClick={() => onNavigateClick?.()}
            >
              <Navigation size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          {showDesktopDropdown && (
            <div className={styles.desktopDropdown}>
              <SearchResultsList
                results={filteredPlaces}
                query={query}
                activeChipLabel={
                  activeChipId === 'all' ? 'All places' : activeChip?.label
                }
                activeIndex={activeIndex}
                showBadge
                onSelect={handleSelect}
              />
            </div>
          )}
        </div>

        <QuickChips
          chips={chips}
          activeChipId={activeChipId}
          onChipClick={handleChipClick}
          onAllPlacesClick={handleAllPlacesClick}
        />
      </div>

      {/* Mobile full-screen search overlay */}
      <div
        className={`${styles.mobileOverlay} ${
          mobileOpen ? styles.mobileOverlayOpen : ''
        }`}
        aria-hidden={!mobileOpen}
      >
        <div className={styles.overlayHeader}>
          <button
            type="button"
            className={styles.backBtn}
            aria-label="Back to map"
            onClick={() => setMobileOpen(false)}
          >
            <ArrowLeft size={20} strokeWidth={2} aria-hidden="true" />
          </button>

          <input
            ref={mobileInputRef}
            type="text"
            className={styles.overlayInput}
            placeholder="Search FUTA campus..."
            aria-label="Search FUTA campus"
            autoComplete="off"
            spellCheck="false"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveChipId(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setMobileOpen(false);
              } else if (event.key === 'Enter' && filteredPlaces[0]) {
                handleSelect(filteredPlaces[0]);
              }
            }}
          />

          {query && (
            <button
              type="button"
              className={styles.overlayClearBtn}
              aria-label="Clear search"
              onClick={handleClear}
            >
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className={styles.overlayBody}>
          <SearchResultsList
            results={filteredPlaces}
            query={query}
            activeChipLabel={
              activeChipId === 'all' ? 'All places' : activeChip?.label
            }
            showBadge={false}
            onSelect={handleSelect}
          />
        </div>
      </div>
    </>
  );
}
