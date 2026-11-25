import { useState } from 'react';
import {
  ChevronDown,
  CircleStop,
  Compass,
  Crosshair,
  Gauge,
  LocateFixed,
  X,
} from 'lucide-react';
import styles from './SignalPanel.module.css';

const BAR_HEIGHTS = ['20%', '40%', '60%', '80%', '100%'];

function SignalBars({ activeBars, tier, compact = false }) {
  const activeTierClass =
    tier === 'good'
      ? styles.barGood
      : tier === 'fair'
        ? styles.barFair
        : styles.barPoor;

  return (
    <div
      className={compact ? styles.miniBars : styles.bars}
      aria-hidden="true"
    >
      {BAR_HEIGHTS.map((height, idx) => {
        const active = idx + 1 <= activeBars;
        return (
          <span
            key={height}
            className={`${compact ? styles.miniBar : styles.bar} ${
              active ? activeTierClass : ''
            }`}
            style={{ height }}
          />
        );
      })}
    </div>
  );
}

/**
 * GPS Signal screen (presentational):
 * - Desktop (>=768px): floating card on the left beside the Navbar rail, always Full view.
 * - Mobile (<768px): bottom sheet above the mobile Navbar with Peek (default) and Full views.
 */
export default function SignalPanel({
  open = true,
  activeBars = 1,
  tier = 'poor',
  badgeText = 'POOR',
  signalLabel,
  accuracyText = '±105m',
  speedText = '—',
  headingText = '—°',
  warningText = 'Signal too weak. Step outside.',
  buttonLabel = 'Locate anyway',
  isTracking = false,
  isFollowing = false,
  canFollow = false,
  mobileExpanded: controlledMobileExpanded,
  onMobileExpandedChange,
  onLocateClick,
  onToggleFollow,
  onClose,
}) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const mobileExpanded =
    controlledMobileExpanded !== undefined
      ? controlledMobileExpanded
      : internalExpanded;

  function setMobileExpanded(next) {
    if (controlledMobileExpanded === undefined) {
      setInternalExpanded(next);
    }
    onMobileExpandedChange?.(next);
  }

  if (!open) return null;

  const resolvedSignalLabel =
    signalLabel ||
    (activeBars === 0
      ? 'Waiting for signal'
      : tier === 'good'
        ? 'Strong signal'
        : tier === 'fair'
          ? 'Fair signal'
          : 'Weak signal');

  const fullSubtitle = isTracking
    ? isFollowing
      ? 'Live tracking — following you'
      : 'Found you — shown on the map'
    : 'Check your signal, then find yourself';

  const peekSubtitle = isTracking
    ? 'Shown on the map'
    : 'Tap below to show where you are';

  const tierBadgeClass =
    tier === 'good'
      ? styles.badgeGood
      : tier === 'fair'
        ? styles.badgeFair
        : styles.badgePoor;

  const scoreTextClass =
    tier === 'good'
      ? styles.scoreGood
      : tier === 'fair'
        ? styles.scoreFair
        : styles.scorePoor;

  const liveSubtitle = !canFollow
    ? 'Find your location first'
    : isFollowing
      ? 'Following your movement'
      : 'Tap to follow your movement';

  const ctaButton = (
    <button
      type="button"
      className={`${styles.gpsBtn} ${isTracking ? styles.gpsBtnStop : ''}`}
      onClick={() => onLocateClick?.()}
    >
      {isTracking ? (
        <CircleStop size={18} strokeWidth={2} aria-hidden="true" />
      ) : (
        <LocateFixed size={18} strokeWidth={2} aria-hidden="true" />
      )}
      <span>{isTracking ? 'Stop tracking' : buttonLabel}</span>
    </button>
  );

  const warningBanner = warningText ? (
    <div
      className={`${styles.warning} ${
        tier === 'poor' ? styles.warningPoor : ''
      }`}
    >
      {warningText}
    </div>
  ) : null;

  return (
    <section className={styles.panel} aria-label="GPS Signal">
      {/* Mobile-only top grab handle */}
      <div className={styles.grabRow}>
        <button
          type="button"
          className={styles.grabBtn}
          aria-label={mobileExpanded ? 'Collapse GPS signal' : 'Expand GPS signal'}
          aria-expanded={mobileExpanded}
          onClick={() => setMobileExpanded(!mobileExpanded)}
        >
          <span className={styles.grabPill} />
        </button>
      </div>

      {/* Mobile Peek View (hidden on desktop and when mobileExpanded is true) */}
      {!mobileExpanded && (
        <div className={styles.mobilePeekView}>
          <header className={styles.header}>
            <div className={styles.headerText}>
              <h2 className={styles.title}>Your location</h2>
              <p className={styles.subtitle}>{peekSubtitle}</p>
            </div>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Close"
              onClick={() => onClose?.()}
            >
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </header>

          {ctaButton}

          <div className={styles.signalRow}>
            <SignalBars activeBars={activeBars} tier={tier} compact />
            <div className={styles.signalRowText}>
              <div className={styles.signalRowTitle}>
                <span>{resolvedSignalLabel}</span>
                <span className={`${styles.signalRowScore} tabular-nums`}>
                  {' '}
                  · {activeBars}/5
                </span>
              </div>
              <div className={`${styles.signalRowSub} tabular-nums`}>
                Accuracy {accuracyText}
              </div>
            </div>
            <button
              type="button"
              className={styles.detailsBtn}
              onClick={() => setMobileExpanded(true)}
            >
              <span>Details</span>
              <ChevronDown size={16} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          {warningBanner}
        </div>
      )}

      {/* Full View (always visible on desktop; visible on mobile when expanded) */}
      <div
        className={`${styles.fullView} ${
          !mobileExpanded ? styles.desktopOnlyFull : ''
        }`}
      >
        <header className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.title}>GPS signal</h2>
            <p className={styles.subtitle}>{fullSubtitle}</p>
          </div>

          <div className={styles.headerActions}>
            <span className={`${styles.statusBadge} ${tierBadgeClass}`}>
              <span className={styles.badgeDot} aria-hidden="true" />
              <span>{badgeText}</span>
            </span>

            <button
              type="button"
              className={`${styles.iconBtn} ${styles.collapseBtn}`}
              aria-label="Show less"
              onClick={() => setMobileExpanded(false)}
            >
              <ChevronDown size={18} strokeWidth={2} aria-hidden="true" />
            </button>

            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Close"
              onClick={() => onClose?.()}
            >
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className={styles.visCard}>
          <SignalBars activeBars={activeBars} tier={tier} />
          <div className={styles.visReadout}>
            <span className={`${styles.visScore} ${scoreTextClass} tabular-nums`}>
              {activeBars}/5
            </span>
            <span className={styles.visLabel}>{resolvedSignalLabel}</span>
          </div>
        </div>

        {ctaButton}

        {warningBanner}

        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statHead}>
              <Crosshair
                size={13}
                strokeWidth={2}
                className={styles.statIcon}
                aria-hidden="true"
              />
              <span className={styles.statLabel}>ACCURACY</span>
            </div>
            <div className={`${styles.statValue} tabular-nums`}>
              {accuracyText}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHead}>
              <Gauge
                size={13}
                strokeWidth={2}
                className={styles.statIcon}
                aria-hidden="true"
              />
              <span className={styles.statLabel}>SPEED</span>
            </div>
            <div className={`${styles.statValue} tabular-nums`}>
              {speedText}
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statHead}>
              <Compass
                size={13}
                strokeWidth={2}
                className={styles.statIcon}
                aria-hidden="true"
              />
              <span className={styles.statLabel}>HEADING</span>
            </div>
            <div className={`${styles.statValue} tabular-nums`}>
              {headingText}
            </div>
          </div>
        </div>

        <div className={styles.liveRow}>
          <div className={styles.liveText}>
            <div className={styles.liveTitle}>Live tracking</div>
            <div className={styles.liveSub}>{liveSubtitle}</div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={isFollowing}
            aria-label="Toggle live tracking"
            disabled={!canFollow}
            className={`${styles.switch} ${isFollowing ? styles.switchOn : ''}`}
            onClick={() => onToggleFollow?.()}
          >
            <span className={styles.switchThumb} />
          </button>
        </div>
      </div>
    </section>
  );
}
