import { useEffect } from 'react';
import { Check, Heart, PartyPopper } from 'lucide-react';
import styles from './ArrivalModal.module.css';

/**
 * Destination arrival confirmation card (presentational).
 * Displays celebratory badge, destination subtitle, support link, and Done CTA.
 */
export default function ArrivalModal({
  open = true,
  destinationName = 'Destination Reached',
  supportUrl = '',
  onSupportClick,
  onDone,
  autoDismissMs = null,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onDone?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    let timer = null;
    if (typeof autoDismissMs === 'number' && autoDismissMs > 0) {
      timer = setTimeout(() => {
        onDone?.();
      }, autoDismissMs);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timer) clearTimeout(timer);
    };
  }, [open, autoDismissMs, onDone]);

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="arrival-heading"
    >
      <div className={styles.card}>
        <div className={styles.iconRing} aria-hidden="true">
          <PartyPopper size={28} strokeWidth={2} />
        </div>

        <h2 id="arrival-heading" className={styles.heading}>
          You&apos;ve Arrived!
        </h2>
        <p className={styles.subtitle}>{destinationName}</p>

        <div className={styles.supportSection}>
          <div className={styles.divider} aria-hidden="true" />
          {supportUrl ? (
            <a
              className={styles.supportLink}
              href={supportUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onSupportClick?.()}
            >
              <Heart size={14} strokeWidth={2} aria-hidden="true" />
              <span>Support FUTA Maps</span>
            </a>
          ) : (
            <button
              type="button"
              className={styles.supportLink}
              onClick={() => onSupportClick?.()}
            >
              <Heart size={14} strokeWidth={2} aria-hidden="true" />
              <span>Support FUTA Maps</span>
            </button>
          )}
        </div>

        <button
          type="button"
          className={styles.doneBtn}
          onClick={() => onDone?.()}
        >
          <span>Done</span>
          <Check size={18} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
