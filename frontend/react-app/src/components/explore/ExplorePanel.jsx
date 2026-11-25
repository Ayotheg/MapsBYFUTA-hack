import { useMemo, useState } from 'react';
import {
  BookOpen,
  Building2,
  ChevronDown,
  ChevronRight,
  CirclePlus,
  Clock,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  MapPin,
  PartyPopper,
  Printer,
  Sparkles,
  Star,
  Store,
  User,
  Utensils,
  Video,
  X,
} from 'lucide-react';
import { EVENT_FILTER_TABS } from '../../data/exploreEvents';
import styles from './ExplorePanel.module.css';

const TABS = [
  { key: 'places', label: 'Places' },
  { key: 'people', label: 'People' },
  { key: 'channels', label: 'Channels' },
  { key: 'events', label: 'Events' },
];

const SORT_MODES = [
  { key: 'featured', label: 'Featured' },
  { key: 'az', label: 'A–Z' },
  { key: 'rating', label: 'Top Rated' },
];

const PLACE_CATEGORY_ICONS = {
  admin: Landmark,
  library: BookOpen,
  lecture_hall: Building2,
  faculty: GraduationCap,
  academic: GraduationCap,
  food: Utensils,
  restaurant: Utensils,
  cafe: Utensils,
  printing: Printer,
  printing_shop: Printer,
  bank: Landmark,
  hostel: Home,
  shop: Store,
  clinic: HeartPulse,
};

function getPlaceIcon(type) {
  return PLACE_CATEGORY_ICONS[(type || '').toLowerCase()] || MapPin;
}

function formatTypeLabel(value) {
  const clean = String(value || 'Campus spot').replace(/_/g, ' ').trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1) : 'Campus spot';
}

function ImageSlot({ src, alt = '', className, fallback }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = Boolean(src) && failedSrc === src;

  if (!src || failed) {
    return <span className={className}>{fallback}</span>;
  }

  return (
    <span className={className}>
      <img
        src={src}
        alt={alt}
        className={styles.coverImg}
        onError={() => setFailedSrc(src)}
      />
    </span>
  );
}

/**
 * Responsive Explore screen:
 * - Desktop (>=768px): left side panel next to the Navbar rail.
 * - Mobile (<768px): compact half bottom sheet (Featured rail) that expands
 *   into the full 4-tab Explore sheet (Places / People / Channels / Events).
 */
export default function ExplorePanel({
  open = false,
  mobileExpanded = false,
  onExpandMobile,
  onClose,
  featuredPlaces = [],
  popularPlaces = [],
  allPlaces = [],
  channels = [],
  events = [],
  people = [],
  loading = false,
  error = null,
  onSelectPlace,
  onSuggestClick,
}) {
  const [activeTab, setActiveTab] = useState('places');
  const [placeFilter, setPlaceFilter] = useState('all');
  const [showAllPopular, setShowAllPopular] = useState(false);
  const [sortMode, setSortMode] = useState('featured');
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [eventFilter, setEventFilter] = useState('All');

  const categoryChips = useMemo(() => {
    const seen = new Map();
    for (const place of allPlaces) {
      const key = (place.category || 'other').toLowerCase();
      if (!seen.has(key)) {
        seen.set(key, formatTypeLabel(key));
      }
    }
    return Array.from(seen.entries())
      .slice(0, 6)
      .map(([key, label]) => ({ key, label }));
  }, [allPlaces]);

  const filteredPopular = useMemo(() => {
    const base =
      placeFilter === 'all'
        ? popularPlaces
        : allPlaces.filter((p) => (p.category || '').toLowerCase() === placeFilter);

    const list = [...base];
    if (sortMode === 'az') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === 'rating') {
      list.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    }
    return list;
  }, [popularPlaces, allPlaces, placeFilter, sortMode]);

  const visiblePopular =
    placeFilter === 'all' && !showAllPopular
      ? filteredPopular.slice(0, 6)
      : filteredPopular;

  const filteredEvents = useMemo(() => {
    if (eventFilter === 'All') return events;
    if (eventFilter === 'Free') return events.filter((e) => e.isFree);
    if (eventFilter === 'Paid') return events.filter((e) => !e.isFree);
    if (eventFilter === 'Today') {
      return events.filter((e) => e.timeframe === 'today');
    }
    if (eventFilter === 'This week') {
      return events.filter(
        (e) => e.timeframe === 'today' || e.timeframe === 'this-week'
      );
    }
    return events;
  }, [events, eventFilter]);

  if (!open) return null;

  const featuredChannels = channels.filter((c) => c.featured);
  const moreChannels = channels.filter((c) => !c.featured);
  const featuredEvents = filteredEvents.filter((e) => e.featured);
  const upcomingEvents = filteredEvents.filter((e) => !e.featured);
  const featuredPeople = people.filter((p) => p.featured);
  const morePeople = people.filter((p) => !p.featured);

  const currentSortLabel =
    SORT_MODES.find((item) => item.key === sortMode)?.label || 'Featured';

  return (
    <>
      {mobileExpanded && (
        <button
          type="button"
          className={styles.mobileScrim}
          aria-label="Collapse Explore panel"
          onClick={onClose}
        />
      )}

      <section
        className={`${styles.panel} ${
          mobileExpanded ? styles.panelMobileFull : styles.panelMobileCompact
        }`}
        aria-label="Explore campus"
      >
        <div className={styles.handleRow}>
          <button
            type="button"
            className={styles.handleBtn}
            aria-label={mobileExpanded ? 'Close Explore' : 'Expand Explore'}
            onClick={() => (mobileExpanded ? onClose?.() : onExpandMobile?.())}
          >
            <span className={styles.handlePill} />
          </button>
        </div>

        <header className={styles.header}>
          <div className={styles.headerRow}>
            <div>
              <h2 className={styles.title}>Explore</h2>
              <p className={styles.subtitle}>
                Campus spots, people and updates.
              </p>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="Close Explore panel"
              onClick={onClose}
            >
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <div
            className={`${styles.segmentWrap} ${
              !mobileExpanded ? styles.desktopOnlyBlock : ''
            }`}
            role="tablist"
            aria-label="Explore categories"
          >
            {TABS.map((tab) => {
              const selected = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={`${styles.segmentBtn} ${
                    selected ? styles.segmentBtnActive : ''
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </header>

        <div className={styles.scrollBody}>
          {error && (
            <div className={styles.noticeBanner}>
              Using fallback campus spots ({error}).
            </div>
          )}

          {loading && !allPlaces.length ? (
            <div className={styles.emptyState}>Loading campus spots…</div>
          ) : null}

          {/* PLACES TAB (also shown in mobile compact preview) */}
          {(activeTab === 'places' || !mobileExpanded) && (
            <>
              <div className={styles.desktopFilterArea}>
                <div className={styles.chipRow}>
                  <button
                    type="button"
                    className={`${styles.filterChip} ${
                      placeFilter === 'all' ? styles.filterChipActive : ''
                    }`}
                    onClick={() => setPlaceFilter('all')}
                  >
                    All spots
                  </button>
                  {categoryChips.map((chip) => (
                    <button
                      key={chip.key}
                      type="button"
                      className={`${styles.filterChip} ${
                        placeFilter === chip.key ? styles.filterChipActive : ''
                      }`}
                      onClick={() =>
                        setPlaceFilter((curr) =>
                          curr === chip.key ? 'all' : chip.key
                        )
                      }
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>

                <div className={styles.controlsRow}>
                  <span className={`${styles.countText} tabular-nums`}>
                    {filteredPopular.length + featuredPlaces.length} places
                  </span>

                  <div className={styles.sortWrap}>
                    <button
                      type="button"
                      className={styles.sortBtn}
                      onClick={() => setSortMenuOpen((v) => !v)}
                    >
                      Sort: {currentSortLabel}
                      <ChevronDown size={14} strokeWidth={2} aria-hidden="true" />
                    </button>

                    {sortMenuOpen && (
                      <div className={styles.sortMenu} role="menu">
                        {SORT_MODES.map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            role="menuitem"
                            className={`${styles.sortMenuItem} ${
                              sortMode === opt.key ? styles.sortMenuItemActive : ''
                            }`}
                            onClick={() => {
                              setSortMode(opt.key);
                              setSortMenuOpen(false);
                            }}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>Featured</h3>
                  <button
                    type="button"
                    className={styles.seeAllBtn}
                    onClick={() => {
                      if (!mobileExpanded) onExpandMobile?.();
                      else setShowAllPopular(true);
                    }}
                  >
                    See all
                    <ChevronRight size={14} strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>

                <div className={styles.rail}>
                  {featuredPlaces.map((place, index) => {
                    const PlaceIcon = getPlaceIcon(place.type);
                    return (
                      <button
                        key={place.id}
                        type="button"
                        className={styles.featuredPlaceCard}
                        onClick={() => onSelectPlace?.(place)}
                      >
                        <ImageSlot
                          src={place.image}
                          alt={place.name}
                          className={styles.featuredPlaceMedia}
                          fallback={
                            <span className={styles.photoPlaceholder}>
                              <PlaceIcon
                                size={28}
                                strokeWidth={1.8}
                                aria-hidden="true"
                              />
                            </span>
                          }
                        />
                        <span className={styles.cardScrim} aria-hidden="true" />

                        {(place.promoted || index < 2) && (
                          <span className={styles.promotedPill}>
                            <Sparkles
                              size={11}
                              strokeWidth={2}
                              className={styles.promotedStar}
                              aria-hidden="true"
                            />
                            <span>Promoted</span>
                          </span>
                        )}

                        <span className={styles.featuredPlaceText}>
                          <span className={styles.featuredPlaceName}>
                            {place.name}
                          </span>
                          <span className={styles.featuredPlaceMeta}>
                            {formatTypeLabel(place.type)}
                            {place.walkMinutes ? ` · ${place.walkMinutes} min walk` : ''}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section
                className={`${styles.section} ${
                  !mobileExpanded ? styles.desktopOnlyBlock : ''
                }`}
              >
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>Popular on campus</h3>
                  {placeFilter === 'all' && filteredPopular.length > 6 && (
                    <button
                      type="button"
                      className={styles.seeAllBtn}
                      onClick={() => setShowAllPopular((prev) => !prev)}
                    >
                      {showAllPopular ? 'Show less' : 'See all'}
                    </button>
                  )}
                </div>

                <div className={styles.placeList}>
                  {visiblePopular.map((place) => {
                    const PlaceIcon = getPlaceIcon(place.type);
                    const hasRating =
                      typeof place.rating === 'number' &&
                      !Number.isNaN(place.rating) &&
                      place.rating > 0;

                    return (
                      <button
                        key={place.id}
                        type="button"
                        className={styles.placeRow}
                        onClick={() => onSelectPlace?.(place)}
                      >
                        <ImageSlot
                          src={place.image}
                          alt={place.name}
                          className={styles.placeThumb}
                          fallback={
                            <span className={styles.thumbPlaceholder}>
                              <PlaceIcon
                                size={20}
                                strokeWidth={1.9}
                                aria-hidden="true"
                              />
                            </span>
                          }
                        />
                        <span className={styles.placeRowBody}>
                          <span className={styles.placeRowName}>{place.name}</span>
                          <span className={styles.placeRowMeta}>
                            <span>{formatTypeLabel(place.type)}</span>
                            {place.subtitle ? <span> · {place.subtitle}</span> : null}
                            {hasRating ? (
                              <span className={styles.ratingInline}>
                                {' · '}
                                <Star
                                  size={11}
                                  strokeWidth={2}
                                  className={styles.ratingStar}
                                  aria-hidden="true"
                                />
                                <span className="tabular-nums">
                                  {place.rating.toFixed(1)}
                                </span>
                              </span>
                            ) : null}
                          </span>
                        </span>
                        <ChevronRight
                          size={17}
                          strokeWidth={2}
                          className={styles.rowChevron}
                          aria-hidden="true"
                        />
                      </button>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {/* PEOPLE TAB */}
          {mobileExpanded && activeTab === 'people' && (
            <>
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>Featured people</h3>
                </div>
                <div className={styles.rail}>
                  {featuredPeople.map((person) => (
                    <div key={person.id} className={styles.personCard}>
                      <div className={styles.personHeader}>
                        <ImageSlot
                          src={person.image}
                          alt={person.name}
                          className={styles.personMedia}
                          fallback={
                            <span className={styles.personInitials}>
                              {person.initials}
                            </span>
                          }
                        />
                        <span className={styles.cardScrim} aria-hidden="true" />
                        <span className={styles.featuredPlaceText}>
                          <span className={styles.featuredPlaceName}>
                            {person.name}
                          </span>
                          <span className={styles.featuredPlaceMeta}>
                            {person.role}
                          </span>
                        </span>
                      </div>
                      {person.bio && <p className={styles.personBio}>{person.bio}</p>}
                    </div>
                  ))}
                </div>
              </section>

              {morePeople.length > 0 && (
                <section className={styles.section}>
                  <div className={styles.sectionHead}>
                    <h3 className={styles.sectionTitle}>More people</h3>
                  </div>
                  <div className={styles.borderedList}>
                    {morePeople.map((person) => (
                      <div key={person.id} className={styles.borderedRow}>
                        <ImageSlot
                          src={person.image}
                          alt={person.name}
                          className={styles.squareAvatar}
                          fallback={<User size={18} aria-hidden="true" />}
                        />
                        <div className={styles.placeRowBody}>
                          <div className={styles.placeRowName}>{person.name}</div>
                          <div className={styles.placeRowMeta}>{person.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {/* CHANNELS TAB */}
          {mobileExpanded && activeTab === 'channels' && (
            <>
              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>Featured channels</h3>
                  <span className={styles.seeAllStatic}>See all</span>
                </div>

                <div className={styles.rail}>
                  {featuredChannels.map((channel) => (
                    <div key={channel.id} className={styles.channelCard}>
                      <div className={styles.channelTop}>
                        {channel.promoted && (
                          <span className={styles.promotedPill}>
                            <Sparkles
                              size={11}
                              strokeWidth={2}
                              className={styles.promotedStar}
                              aria-hidden="true"
                            />
                            <span>Promoted</span>
                          </span>
                        )}
                        <ImageSlot
                          src={channel.image}
                          alt={channel.name}
                          className={styles.channelLogoBox}
                          fallback={
                            <span className={styles.channelInitials}>
                              {channel.initials}
                            </span>
                          }
                        />
                      </div>

                      <div className={styles.channelBody}>
                        <div className={styles.channelName}>{channel.name}</div>
                        <div className={styles.channelPlatform}>
                          {channel.platform}
                        </div>
                        <a
                          href={channel.url || '#channels'}
                          target={channel.url ? '_blank' : undefined}
                          rel={channel.url ? 'noopener noreferrer' : undefined}
                          className={styles.joinChannelBtn}
                          onClick={(event) => {
                            if (!channel.url) event.preventDefault();
                          }}
                        >
                          Join channel
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>More channels</h3>
                  <span className={styles.seeAllStatic}>See all</span>
                </div>

                <div className={styles.borderedList}>
                  {moreChannels.map((channel) => (
                    <div key={channel.id} className={styles.borderedRow}>
                      <ImageSlot
                        src={channel.image}
                        alt={channel.name}
                        className={styles.channelSmallAvatar}
                        fallback={<span>{channel.initials.charAt(0)}</span>}
                      />
                      <div className={styles.placeRowBody}>
                        <div className={styles.placeRowName}>{channel.name}</div>
                        <div className={styles.placeRowMeta}>
                          {channel.platform}
                        </div>
                      </div>
                      <a
                        href={channel.url || '#channels'}
                        target={channel.url ? '_blank' : undefined}
                        rel={channel.url ? 'noopener noreferrer' : undefined}
                        className={styles.joinSmallPill}
                        onClick={(event) => {
                          if (!channel.url) event.preventDefault();
                        }}
                      >
                        Join
                      </a>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* EVENTS TAB */}
          {mobileExpanded && activeTab === 'events' && (
            <>
              <div className={styles.chipRow}>
                {EVENT_FILTER_TABS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={`${styles.filterChip} ${
                      eventFilter === label ? styles.filterChipActive : ''
                    }`}
                    onClick={() => setEventFilter(label)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>Featured events</h3>
                  <span className={styles.seeAllStatic}>See all</span>
                </div>

                {featuredEvents.length === 0 ? (
                  <div className={styles.emptyState}>
                    No events match "{eventFilter}".
                  </div>
                ) : (
                  <div className={styles.rail}>
                    {featuredEvents.map((event) => (
                      <div key={event.id} className={styles.eventCard}>
                        <div className={styles.eventPosterWrap}>
                          <ImageSlot
                            src={event.poster}
                            alt={event.title}
                            className={styles.eventPosterMedia}
                            fallback={
                              <span className={styles.photoPlaceholder}>
                                <PartyPopper
                                  size={20}
                                  strokeWidth={1.8}
                                  aria-hidden="true"
                                />
                                <span>[Event poster]</span>
                              </span>
                            }
                          />

                          <span className={styles.dateBadge}>
                            <span className={styles.dateMonth}>{event.month}</span>
                            <span className={`${styles.dateDay} tabular-nums`}>
                              {event.day}
                            </span>
                          </span>

                          <span
                            className={`${styles.pricePill} ${
                              event.isFree ? styles.pricePillFree : ''
                            }`}
                          >
                            {event.priceLabel}
                          </span>
                        </div>

                        <div className={styles.eventCardBody}>
                          <div className={styles.eventTitle}>{event.title}</div>
                          <div className={styles.eventMetaLine}>
                            <Clock size={13} strokeWidth={2} aria-hidden="true" />
                            <span>{event.time}</span>
                          </div>
                          <div className={styles.eventMetaLine}>
                            {event.isOnline ? (
                              <Video size={13} strokeWidth={2} aria-hidden="true" />
                            ) : (
                              <MapPin size={13} strokeWidth={2} aria-hidden="true" />
                            )}
                            <span>{event.venue}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className={styles.section}>
                <div className={styles.sectionHead}>
                  <h3 className={styles.sectionTitle}>Upcoming</h3>
                  <span className={styles.seeAllStatic}>See all</span>
                </div>

                <div className={styles.upcomingList}>
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className={styles.upcomingRow}>
                      <span className={styles.upcomingDateBox}>
                        <span className={styles.dateMonth}>{event.month}</span>
                        <span className={`${styles.dateDay} tabular-nums`}>
                          {event.day}
                        </span>
                      </span>

                      <div className={styles.placeRowBody}>
                        <div className={styles.placeRowName}>{event.title}</div>
                        <div className={styles.placeRowMeta}>{event.time}</div>
                        <div className={styles.upcomingVenue}>
                          {event.isOnline ? (
                            <Video size={12} strokeWidth={2} aria-hidden="true" />
                          ) : (
                            <MapPin size={12} strokeWidth={2} aria-hidden="true" />
                          )}
                          <span>{event.venue}</span>
                        </div>
                      </div>

                      <span className={styles.upcomingPrice}>
                        {event.priceLabel}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        <footer className={styles.desktopFooter}>
          <CirclePlus size={16} strokeWidth={2} aria-hidden="true" />
          <span>Missing a place?</span>
          <button
            type="button"
            className={styles.suggestAction}
            onClick={() => onSuggestClick?.()}
          >
            Suggest it
          </button>
        </footer>
      </section>
    </>
  );
}
