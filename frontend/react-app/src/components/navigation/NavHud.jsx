import { useEffect, useState } from 'react';
import {
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  MapPin,
  MoreHorizontal,
  Undo2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { formatDistance } from '../../utils/geo';
import styles from './NavHud.module.css';

const TURN_ICONS = {
  straight: ArrowUp,
  left: CornerUpLeft,
  right: CornerUpRight,
  uturn: Undo2,
  arrive: Flag,
};

/**
 * Turn-by-turn navigation HUD:
 * - Floating top turn instruction card (NOW / UP NEXT / Voice / End)
 * - Right-side map ring buttons: rotating North (↑ N) toggle + Nearby Places (⋯) popover
 * - Bottom distance remaining card
 */
export default function NavHud({
  status = 'active',
  turnIcon = 'straight',
  instruction = 'Continue straight',
  stepDistance = '',
  nextInstruction = '',
  distanceRemaining = '—',
  destinationName = 'Destination',
  voiceEnabled = true,
  hideDistance = false,
  showMapActions = true,
  routeUp = true,
  mapBearing = 0,
  nearbyItems = [],
  onToggleVoice,
  onEnd,
  onToggleRouteUp,
  onSelectNearby,
}) {
  const [nearbyOpen, setNearbyOpen] = useState(false);

  const showNearbyPopover = nearbyOpen && !hideDistance;

  useEffect(() => {
    if (!showNearbyPopover) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNearbyOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showNearbyPopover]);

  const TurnIcon = TURN_ICONS[turnIcon] || ArrowUp;
  const statusClass =
    status === 'arrived'
      ? styles.topCardArrived
      : status === 'arriving'
        ? styles.topCardArriving
        : '';

  const nearbyCount = nearbyItems.length;

  return (
    <>
      <section
        className={`${styles.topCard} ${statusClass}`}
        aria-label="Turn-by-turn instruction"
      >
        <div className={styles.topRow}>
          <div className={styles.turnIconBox} aria-hidden="true">
            <TurnIcon size={22} strokeWidth={2} />
          </div>

          <div className={styles.turnInfo}>
            <div className={styles.nowLabel}>NOW</div>
            <div className={styles.instruction}>{instruction}</div>
            {stepDistance && (
              <div className={`${styles.stepDistance} tabular-nums`}>
                {stepDistance}
              </div>
            )}
          </div>

          <button
            type="button"
            className={styles.voiceBtn}
            aria-label={voiceEnabled ? 'Mute voice guidance' : 'Unmute voice guidance'}
            aria-pressed={voiceEnabled}
            onClick={() => onToggleVoice?.()}
          >
            {voiceEnabled ? (
              <Volume2 size={17} strokeWidth={2} aria-hidden="true" />
            ) : (
              <VolumeX size={17} strokeWidth={2} aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            className={styles.endBtn}
            onClick={() => onEnd?.()}
          >
            <X size={13} strokeWidth={2.2} aria-hidden="true" />
            <span>End</span>
          </button>
        </div>

        {nextInstruction && (
          <div className={styles.upNextStrip}>
            <span className={styles.upNextLabel}>UP NEXT</span>
            <span className={styles.upNextText}>{nextInstruction}</span>
          </div>
        )}

        {hideDistance && (
          <div className={`${styles.upNextStrip} ${styles.compactRemainStrip}`}>
            <span className={styles.compactRemainLabel}>LEFT</span>
            <span className={`${styles.compactRemainVal} tabular-nums`}>
              {distanceRemaining}
            </span>
            <span className={styles.upNextText}>{destinationName}</span>
          </div>
        )}
      </section>

      {showMapActions && !hideDistance && (
        <div className={styles.mapActions}>
          {/* North / Route-Up rotating compass ring */}
          <button
            type="button"
            className={`${styles.mapActionBtn} ${styles.northBtn} ${
              !routeUp ? styles.northBtnNorthUp : ''
            }`}
            aria-label={routeUp ? 'Switch to North up' : 'Switch to Route up'}
            aria-pressed={!routeUp}
            title={routeUp ? 'North up' : 'Route up'}
            onClick={() => onToggleRouteUp?.()}
          >
            <span
              className={styles.northInner}
              style={{ transform: `rotate(${Math.round(mapBearing)}deg)` }}
            >
              <ArrowUp size={13} strokeWidth={2.4} aria-hidden="true" />
              <span className={styles.northLetter}>N</span>
            </span>
          </button>

          {/* Nearby Places along route ring */}
          <div className={styles.nearbyWrap}>
            {showNearbyPopover && (
              <div
                role="dialog"
                aria-label="Nearby places along your route"
                className={styles.nearbyPopover}
              >
                <div className={styles.nearbyHeader}>
                  <span className={styles.nearbyTitle}>Nearby along route</span>
                  <button
                    type="button"
                    className={styles.nearbyClose}
                    aria-label="Close nearby places"
                    onClick={() => setNearbyOpen(false)}
                  >
                    <X size={14} strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </div>

                {nearbyCount === 0 ? (
                  <p className={styles.nearbyEmpty}>
                    No campus spots right ahead yet.
                  </p>
                ) : (
                  <ul className={styles.nearbyList}>
                    {nearbyItems.map(({ place, ahead, side }) => (
                      <li key={place.id}>
                        <button
                          type="button"
                          className={styles.nearbyItem}
                          onClick={() => {
                            setNearbyOpen(false);
                            onSelectNearby?.(place);
                          }}
                        >
                          <span className={styles.nearbyPin} aria-hidden="true">
                            <MapPin size={14} strokeWidth={2} />
                          </span>
                          <span className={styles.nearbyMeta}>
                            <span className={styles.nearbyName}>
                              {place.name}
                            </span>
                            <span className={`${styles.nearbySub} tabular-nums`}>
                              On your {side} ·{' '}
                              {ahead < 15
                                ? 'here'
                                : `in ${formatDistance(ahead)}`}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <button
              type="button"
              className={`${styles.mapActionBtn} ${styles.nearbyBtn} ${
                showNearbyPopover ? styles.nearbyBtnOpen : ''
              } ${!showNearbyPopover && nearbyCount > 0 ? styles.nearbyBtnPulse : ''}`}
              aria-label={
                nearbyCount > 0
                  ? `Nearby places (${nearbyCount})`
                  : 'Nearby places'
              }
              aria-expanded={showNearbyPopover}
              onClick={() => setNearbyOpen((prev) => !prev)}
            >
              <MoreHorizontal size={18} strokeWidth={2} aria-hidden="true" />
              {nearbyCount > 0 && (
                <span className={`${styles.nearbyBadge} tabular-nums`}>
                  {nearbyCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {!hideDistance && (
        <section
          className={styles.distCard}
          aria-label="Distance remaining"
        >
          <div className={styles.distLabel}>DISTANCE REMAINING</div>
          <div className={`${styles.distValue} tabular-nums`}>
            {distanceRemaining}
          </div>
          <div className={styles.destLine}>To {destinationName}</div>
        </section>
      )}
    </>
  );
}
