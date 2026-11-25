import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  GraduationCap,
  HeartPulse,
  Home,
  Image as ImageIcon,
  Landmark,
  MapPin,
  Navigation,
  Printer,
  Star,
  Store,
  Utensils,
  X,
} from 'lucide-react';
import { formatWaypointType, isRateablePlace } from '../../data/waypointColors';
import { fetchPlaceImages } from '../../services/exploreApi';
import styles from './PlaceCard.module.css';

const CATEGORY_ICONS = {
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

function PlaceTypeIcon({ type }) {
  const Icon = CATEGORY_ICONS[(type || '').toLowerCase()] || MapPin;
  return <Icon size={42} strokeWidth={1.6} />;
}

/**
 * Responsive Waypoint Detail Card:
 * - Peek (default): photo, title, category/area, rating summary (if any), and "Navigate here".
 * - Full (for rated/rateable places): expands to reveal the Reviews section below.
 * Mount with `key={place.id}` so switching places resets carousel/expanded state cleanly.
 */
export default function PlaceCard({
  place,
  onClose,
  onNavigate,
  onWriteReview,
}) {
  const [fetchedPhotos, setFetchedPhotos] = useState([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [failedUrls, setFailedUrls] = useState({});
  const [expanded, setExpanded] = useState(false);
  const [dragY, setDragY] = useState(0);

  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const placeId = place?.id;
  const placeImageCount = place?.imageCount || 0;
  const placeInitialImage = place?.image || null;
  const placeInlineImages = place?.images;

  useEffect(() => {
    if (!placeId || place?.isUserSuggested) return undefined;
    if (placeImageCount <= 0 && !placeInitialImage) return undefined;
    if (placeImageCount <= 1 && placeInitialImage) return undefined;

    const controller = new AbortController();
    fetchPlaceImages(placeId, { signal: controller.signal }).then((urls) => {
      if (urls.length > 0) {
        setFetchedPhotos(urls);
      }
    });

    return () => controller.abort();
  }, [placeId, place?.isUserSuggested, placeImageCount, placeInitialImage]);

  const photos = useMemo(() => {
    const merged = [];
    if (placeInitialImage) merged.push(placeInitialImage);
    if (Array.isArray(placeInlineImages)) {
      for (const url of placeInlineImages) {
        if (url && !merged.includes(url)) merged.push(url);
      }
    }
    for (const url of fetchedPhotos) {
      if (url && !merged.includes(url)) merged.push(url);
    }
    return merged;
  }, [placeInitialImage, placeInlineImages, fetchedPhotos]);

  if (!place) return null;

  const hasRatingsView = isRateablePlace(place);
  const ratingValue =
    typeof place.rating === 'number' && !Number.isNaN(place.rating)
      ? place.rating
      : 0;
  const reviewCount = Number(place.reviewCount) || 0;
  const hasRatingScore = ratingValue > 0;

  const safeIdx = Math.min(photoIdx, Math.max(photos.length - 1, 0));
  const activePhotoUrl = photos[safeIdx] || null;
  const activePhotoFailed = Boolean(activePhotoUrl && failedUrls[activePhotoUrl]);
  const showHeroImage = Boolean(activePhotoUrl && !activePhotoFailed);

  const typeLabel = formatWaypointType(place.type || place.category);
  const areaLabel = place.subtitle?.trim() || '';

  function markUrlFailed(url) {
    setFailedUrls((prev) => {
      if (prev[url]) return prev;
      const next = { ...prev, [url]: true };
      // If another photo URL exists that hasn't failed yet, advance to it automatically
      const nextValidIdx = photos.findIndex((candidate) => !next[candidate]);
      if (nextValidIdx >= 0 && nextValidIdx !== safeIdx) {
        setPhotoIdx(nextValidIdx);
      }
      return next;
    });
  }

  function handleTouchStart(event) {
    isDragging.current = true;
    touchStartY.current = event.touches[0].clientY;
  }

  function handleTouchMove(event) {
    if (!isDragging.current) return;
    const dy = event.touches[0].clientY - touchStartY.current;
    if (dy > 0) setDragY(dy);
  }

  function handleTouchEnd(event) {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dy = event.changedTouches[0].clientY - touchStartY.current;
    setDragY(0);

    if (hasRatingsView && dy < -40) {
      setExpanded(true);
    } else if (dy > 75) {
      if (hasRatingsView && expanded) {
        setExpanded(false);
      } else {
        onClose?.();
      }
    }
  }

  const isFull = hasRatingsView && expanded;

  return (
    <>
      <button
        type="button"
        className={styles.scrim}
        aria-label="Close place details"
        onClick={() => onClose?.()}
      />

      <aside
        className={`${styles.card} ${isFull ? styles.cardFull : styles.cardPeek}`}
        style={
          dragY > 0
            ? { transform: `translateY(${dragY}px)`, transition: 'none' }
            : undefined
        }
        aria-label={place.name}
      >
        {/* Top grab handle (mobile swipe/tap to toggle Peek <-> Full) */}
        <div className={styles.handleRow}>
          <button
            type="button"
            className={styles.handleBtn}
            aria-label={
              hasRatingsView
                ? isFull
                  ? 'Collapse reviews'
                  : 'Expand reviews'
                : 'Close place card'
            }
            aria-expanded={hasRatingsView ? isFull : undefined}
            onClick={() => {
              if (hasRatingsView) setExpanded((v) => !v);
              else onClose?.();
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <span
              className={`${styles.handleBar} ${
                hasRatingsView && !isFull ? styles.handleHint : ''
              }`}
            />
          </button>
        </div>

        {/* Hero Photo / Category Fallback */}
        <div
          className={`${styles.hero} ${!showHeroImage ? styles.heroEmpty : ''}`}
        >
          <div className={styles.heroFallback} aria-hidden="true">
            <PlaceTypeIcon type={place.type || place.category} />
          </div>

          {showHeroImage && (
            <img
              src={activePhotoUrl}
              alt={place.name}
              className={styles.heroImg}
              decoding="async"
              onError={() => markUrlFailed(activePhotoUrl)}
            />
          )}

          {photos.length > 1 && showHeroImage && (
            <>
              <button
                type="button"
                className={`${styles.photoNav} ${styles.photoPrev}`}
                aria-label="Previous photo"
                disabled={safeIdx === 0}
                onClick={() => setPhotoIdx((i) => Math.max(0, i - 1))}
              >
                <ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${styles.photoNav} ${styles.photoNext}`}
                aria-label="Next photo"
                disabled={safeIdx === photos.length - 1}
                onClick={() =>
                  setPhotoIdx((i) => Math.min(photos.length - 1, i + 1))
                }
              >
                <ChevronRight size={22} strokeWidth={2.2} aria-hidden="true" />
              </button>
              <div className={`${styles.photoBadge} tabular-nums`}>
                <ImageIcon size={12} strokeWidth={2} aria-hidden="true" />
                <span>
                  {safeIdx + 1} / {photos.length}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Card Body */}
        <div className={styles.body}>
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{place.name}</h2>
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="Close"
              onClick={() => onClose?.()}
            >
              <X size={17} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          <div className={styles.metaRow}>
            {hasRatingScore && (
              <span className={styles.ratingMeta}>
                <Star
                  size={14}
                  strokeWidth={2}
                  className={styles.starFilled}
                  aria-hidden="true"
                />
                <span className={`${styles.ratingScore} tabular-nums`}>
                  {ratingValue.toFixed(1)}
                </span>
                {reviewCount > 0 && (
                  <span className={`${styles.ratingCount} tabular-nums`}>
                    ({reviewCount})
                  </span>
                )}
              </span>
            )}
            <span>{typeLabel}</span>
            {areaLabel && <span>{areaLabel}</span>}
          </div>

          {place.description && (
            <p className={`${styles.desc} ${!isFull ? styles.descClamp : ''}`}>
              {place.description}
            </p>
          )}

          {place.lat != null && place.lng != null && (
            <button
              type="button"
              className={styles.navigateBtn}
              onClick={() => onNavigate?.(place)}
            >
              <Navigation size={17} strokeWidth={2.2} aria-hidden="true" />
              <span>Navigate here</span>
            </button>
          )}

          {/* Peek -> Full toggle for rated / rateable waypoints */}
          {hasRatingsView && (
            <button
              type="button"
              className={styles.reviewsToggle}
              aria-expanded={isFull}
              onClick={() => setExpanded((v) => !v)}
            >
              <span>
                {isFull
                  ? 'Hide reviews'
                  : hasRatingScore
                    ? `Reviews (${ratingValue.toFixed(1)} ★)`
                    : 'Reviews'}
              </span>
              {isFull ? (
                <ChevronUp size={16} strokeWidth={2} aria-hidden="true" />
              ) : (
                <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
              )}
            </button>
          )}

          {/* Full view: Reviews section */}
          {isFull && (
            <section className={styles.reviewsSection} aria-label="Reviews">
              <div className={styles.reviewsHead}>
                <h3 className={styles.reviewsHeading}>Reviews</h3>
                {hasRatingScore && (
                  <span className={`${styles.reviewsSummaryPill} tabular-nums`}>
                    <Star
                      size={13}
                      strokeWidth={2}
                      className={styles.starFilled}
                      aria-hidden="true"
                    />
                    <span>{ratingValue.toFixed(1)}</span>
                    {reviewCount > 0 && (
                      <span className={styles.reviewsSummaryCount}>
                        · {reviewCount} review{reviewCount === 1 ? '' : 's'}
                      </span>
                    )}
                  </span>
                )}
              </div>

              {reviewCount === 0 && !hasRatingScore ? (
                <div className={styles.reviewsEmptyCard}>
                  <span className={styles.reviewsEmptyIcon} aria-hidden="true">
                    <Star size={20} strokeWidth={2} />
                  </span>
                  <div className={styles.reviewsEmptyTitle}>No reviews yet</div>
                  <p className={styles.reviewsEmptyCopy}>
                    Been here? Help other students know what to expect.
                  </p>
                  <button
                    type="button"
                    className={styles.writeReviewBtn}
                    onClick={() => onWriteReview?.(place)}
                  >
                    Write the first review
                  </button>
                </div>
              ) : (
                <div className={styles.reviewsEmptyCard}>
                  <div className={styles.reviewsStarsRow} aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((starIndex) => (
                      <Star
                        key={starIndex}
                        size={18}
                        strokeWidth={2}
                        className={
                          starIndex <= Math.round(ratingValue)
                            ? styles.starFilled
                            : styles.starOutline
                        }
                      />
                    ))}
                  </div>
                  <div className={`${styles.reviewsEmptyTitle} tabular-nums`}>
                    Rated {ratingValue.toFixed(1)} out of 5
                  </div>
                  <p className={styles.reviewsEmptyCopy}>
                    {reviewCount > 0
                      ? `Based on ${reviewCount} student review${reviewCount === 1 ? '' : 's'}.`
                      : 'Student rating summary from campus feedback.'}
                  </p>
                  <button
                    type="button"
                    className={styles.writeReviewBtn}
                    onClick={() => onWriteReview?.(place)}
                  >
                    Write a review
                  </button>
                </div>
              )}
            </section>
          )}
        </div>
      </aside>
    </>
  );
}
