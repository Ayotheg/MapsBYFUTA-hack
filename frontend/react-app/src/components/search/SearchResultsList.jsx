import {
  BookOpen,
  Building2,
  GraduationCap,
  Home,
  Landmark,
  MapPin,
  Printer,
  School,
  Store,
  Utensils,
} from 'lucide-react';
import styles from './SearchResultsList.module.css';

const CATEGORY_ICONS = {
  admin: Landmark,
  library: BookOpen,
  lecture_hall: Building2,
  food: Utensils,
  printing: Printer,
  bank: Landmark,
  hostel: Home,
  shop: Store,
  school: School,
  academic: GraduationCap,
};

function HighlightedText({ text, query }) {
  const cleanQuery = query.trim();
  if (!cleanQuery) return text;

  const lowerText = text.toLowerCase();
  const lowerQuery = cleanQuery.toLowerCase();
  const matchIdx = lowerText.indexOf(lowerQuery);
  if (matchIdx === -1) return text;

  const before = text.slice(0, matchIdx);
  const match = text.slice(matchIdx, matchIdx + cleanQuery.length);
  const after = text.slice(matchIdx + cleanQuery.length);

  return (
    <>
      {before}
      <mark className={styles.highlight}>{match}</mark>
      {after}
    </>
  );
}

/**
 * Shared search results list used by both DesktopSearchBar's dropdown
 * and MobileSearchOverlay.
 */
export default function SearchResultsList({
  results,
  query,
  activeChipLabel = null,
  activeIndex = -1,
  showBadge = true,
  onSelect,
}) {
  if (!results.length) {
    const emptyText =
      query.trim() || activeChipLabel
        ? `No results for "${query.trim() || activeChipLabel}"`
        : 'Type to search...';

    return <div className={styles.empty}>{emptyText}</div>;
  }

  return (
    <div className={styles.list}>
      <div className={styles.sectionLabel}>
        <MapPin size={14} strokeWidth={2} aria-hidden="true" />
        <span>On This Map</span>
      </div>

      {results.map((place, index) => {
        const Icon = CATEGORY_ICONS[place.category] || MapPin;
        const isActive = index === activeIndex;

        return (
          <button
            key={place.id}
            type="button"
            className={`${styles.item} ${isActive ? styles.itemActive : ''}`}
            onMouseDown={(event) => {
              event.preventDefault();
              onSelect?.(place);
            }}
          >
            <span className={styles.iconBox}>
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
            </span>

            <span className={styles.body}>
              <span className={styles.name}>
                <HighlightedText text={place.name} query={query} />
              </span>
              {place.subtitle && (
                <span className={styles.subtitle}>{place.subtitle}</span>
              )}
            </span>

            {showBadge && place.badge && (
              <span className={styles.badge}>{place.badge}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
