import { useEffect, useState } from 'react';
import styles from './ZoomHintOverlay.module.css';

const STORAGE_KEY = 'mapsbyfuta_zoom_hint_dismissed_v1';

function isAlreadyDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function persistDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {
    // Ignore storage errors
  }
}

/**
 * First-visit map overlay prompting the user to pinch/zoom in
 * so campus buildings and place labels appear.
 * Dismisses on "Got it", Escape, or automatically when the user zooms in.
 */
export default function ZoomHintOverlay({ map, hidden = false }) {
  const [dismissed, setDismissed] = useState(isAlreadyDismissed);

  function dismiss() {
    persistDismissed();
    setDismissed(true);
  }

  useEffect(() => {
    if (dismissed || !map) return undefined;

    const handleZoom = () => {
      if (map.getZoom() >= 17) {
        persistDismissed();
        setDismissed(true);
      }
    };

    map.on('zoomend', handleZoom);
    return () => {
      map.off('zoomend', handleZoom);
    };
  }, [map, dismissed]);

  useEffect(() => {
    if (dismissed || hidden) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        persistDismissed();
        setDismissed(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dismissed, hidden]);

  if (dismissed || hidden) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-label="Zoom in to see places"
      onClick={dismiss}
    >
      <div
        className={styles.content}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.pinchRing} aria-hidden="true">
          <span className={styles.dotTopRight} />
          <span className={styles.dotBottomLeft} />
        </div>

        <h2 className={styles.heading}>Zoom in to see places</h2>
        <p className={styles.copy}>
          Spread two fingers apart on the map — buildings and place names appear
          as you get closer.
        </p>

        <button
          type="button"
          className={styles.gotItBtn}
          onClick={dismiss}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
