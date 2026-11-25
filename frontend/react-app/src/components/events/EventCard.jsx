import { useEffect, useState } from 'react';
import {
  Calendar,
  CalendarPlus,
  Check,
  ExternalLink,
  MapPin,
  Navigation,
  Share,
  Ticket,
  Video,
  X,
} from 'lucide-react';
import styles from './EventCard.module.css';

function downloadCalendarFile(event) {
  const title = (event.title || 'FUTA Campus Event').replace(/[\r\n]/g, ' ');
  const venue = (event.venue || 'FUTA Campus').replace(/[\r\n]/g, ' ');
  const desc = (event.about || event.description || '').replace(/[\r\n]/g, ' ');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MapsByFUTA//Campus Events//EN',
    'BEGIN:VEVENT',
    `SUMMARY:${title}`,
    `LOCATION:${venue}`,
    `DESCRIPTION:${desc}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Event Detail Card:
 * - Desktop (>=768px): floating card on the left beside the Navbar rail.
 * - Mobile (<768px): bottom sheet with top grab handle.
 */
export default function EventCard({
  event,
  onClose,
  onNavigateToVenue,
}) {
  const [posterFailed, setPosterFailed] = useState(false);
  const [savedCal, setSavedCal] = useState(false);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!event) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [event, onClose]);

  if (!event) return null;

  const showPoster = Boolean(event.poster) && !posterFailed;
  const organizer = event.organizer || 'FUTA Campus Organisers';
  const dateHeading = event.fullDate || `${event.month || 'TBA'} ${event.day || ''}`.trim();
  const timeSub = event.timeRange || event.time || 'TBA';
  const venueSub =
    event.venueHint || (event.isOnline ? 'Online session' : 'FUTA Campus');
  const ticketSub =
    event.ticketNote || (event.isFree ? 'No ticket needed' : 'Ticket required');
  const aboutCopy =
    event.about ||
    event.description ||
    'Campus event on FUTA. Check with the organiser for latest updates.';

  function handleSaveCalendar() {
    downloadCalendarFile(event);
    setSavedCal(true);
    setTimeout(() => setSavedCal(false), 2000);
  }

  async function handleShare() {
    const shareText = `${event.title} · ${dateHeading} (${timeSub}) at ${event.venue}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.title,
          text: shareText,
          url: event.url || window.location.href,
        });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareText);
      }
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {
      // User dismissed share sheet
    }
  }

  return (
    <>
      <button
        type="button"
        className={styles.scrim}
        aria-label="Close event details"
        onClick={() => onClose?.()}
      />

      <aside className={styles.card} aria-label={event.title}>
        <div className={styles.handleRow}>
          <span className={styles.handleBar} />
        </div>

        <div className={styles.scrollBody}>
          {/* Hero Poster */}
          <div className={styles.posterWrap}>
            {showPoster ? (
              <img
                src={event.poster}
                alt={event.title}
                className={styles.posterImg}
                onError={() => setPosterFailed(true)}
              />
            ) : (
              <div className={styles.posterFallback}>
                <span>[Event poster]</span>
              </div>
            )}

            <span className={styles.dateBadge} aria-hidden="true">
              <span className={styles.dateMonth}>{event.month}</span>
              <span className={`${styles.dateDay} tabular-nums`}>
                {event.day}
              </span>
            </span>
          </div>

          {/* Title & Organiser */}
          <div className={styles.titleRow}>
            <div className={styles.titleGroup}>
              <h2 className={styles.title}>{event.title}</h2>
              <p className={styles.organizer}>By {organizer}</p>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="Close"
              onClick={() => onClose?.()}
            >
              <X size={17} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>

          {/* Meta Rows */}
          <div className={styles.infoList}>
            <div className={styles.infoRow}>
              <span className={styles.infoIcon} aria-hidden="true">
                <Calendar size={16} strokeWidth={2} />
              </span>
              <div className={styles.infoText}>
                <div className={styles.infoPrimary}>{dateHeading}</div>
                <div className={styles.infoSecondary}>{timeSub}</div>
              </div>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoIcon} aria-hidden="true">
                {event.isOnline ? (
                  <Video size={16} strokeWidth={2} />
                ) : (
                  <MapPin size={16} strokeWidth={2} />
                )}
              </span>
              <div className={styles.infoText}>
                <div className={styles.infoPrimary}>{event.venue}</div>
                <div className={styles.infoSecondary}>{venueSub}</div>
              </div>
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoIcon} aria-hidden="true">
                <Ticket size={16} strokeWidth={2} />
              </span>
              <div className={styles.infoText}>
                <div className={styles.infoPrimary}>{event.priceLabel}</div>
                <div className={styles.infoSecondary}>{ticketSub}</div>
              </div>
            </div>
          </div>

          {/* About */}
          <div className={styles.aboutSection}>
            <h3 className={styles.aboutHeading}>About</h3>
            <p className={styles.aboutCopy}>{aboutCopy}</p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className={styles.footer}>
          {event.isOnline ? (
            <a
              href={event.url || '#'}
              target={event.url ? '_blank' : undefined}
              rel={event.url ? 'noopener noreferrer' : undefined}
              className={styles.primaryBtn}
              onClick={(e) => {
                if (!event.url) e.preventDefault();
              }}
            >
              <ExternalLink size={16} strokeWidth={2.2} aria-hidden="true" />
              <span>{event.url ? 'Join online' : 'Online event'}</span>
            </a>
          ) : (
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => onNavigateToVenue?.(event)}
            >
              <Navigation size={16} strokeWidth={2.2} aria-hidden="true" />
              <span>Navigate to venue</span>
            </button>
          )}

          <button
            type="button"
            className={`${styles.iconActionBtn} ${
              savedCal ? styles.iconActionSuccess : ''
            }`}
            aria-label="Add to calendar"
            title="Add to calendar"
            onClick={handleSaveCalendar}
          >
            {savedCal ? (
              <Check size={17} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <CalendarPlus size={17} strokeWidth={2} aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            className={`${styles.iconActionBtn} ${
              shared ? styles.iconActionSuccess : ''
            }`}
            aria-label="Share event"
            title="Share event"
            onClick={handleShare}
          >
            {shared ? (
              <Check size={17} strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <Share size={17} strokeWidth={2} aria-hidden="true" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
