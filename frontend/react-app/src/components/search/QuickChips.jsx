import {
  Building2,
  Home,
  Landmark,
  LayoutGrid,
  MapPin,
  Printer,
  Utensils,
} from 'lucide-react';
import styles from './QuickChips.module.css';

const CHIP_ICONS = {
  Building2,
  Utensils,
  Printer,
  Landmark,
  Home,
  LayoutGrid,
};

/**
 * Horizontally scrollable quick-category pills directly below the search bar.
 */
export default function QuickChips({
  chips,
  activeChipId,
  onChipClick,
  onAllPlacesClick,
}) {
  return (
    <div className={styles.scroll} role="region" aria-label="Quick place filters">
      {chips.map((chip) => {
        const Icon = CHIP_ICONS[chip.iconName] || MapPin;
        const active = activeChipId === chip.id;

        return (
          <button
            key={chip.id}
            type="button"
            className={`${styles.chip} ${active ? styles.chipActive : ''}`}
            aria-pressed={active}
            onClick={() => onChipClick?.(chip)}
          >
            <Icon size={14} strokeWidth={2} aria-hidden="true" />
            <span>{chip.label}</span>
          </button>
        );
      })}

      <button
        type="button"
        className={`${styles.chip} ${styles.allPlacesChip} ${
          activeChipId === 'all' ? styles.chipActive : ''
        }`}
        aria-pressed={activeChipId === 'all'}
        onClick={() => onAllPlacesClick?.()}
      >
        <LayoutGrid size={14} strokeWidth={2} aria-hidden="true" />
        <span>All places</span>
      </button>
    </div>
  );
}
