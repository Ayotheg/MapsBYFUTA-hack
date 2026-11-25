import {
  ArrowUp,
  CornerUpLeft,
  CornerUpRight,
  Flag,
  LocateFixed,
  MoreHorizontal,
  Undo2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import styles from './NavHud.module.css';

const TURN_ICONS = {
  straight: ArrowUp,
  left: CornerUpLeft,
  right: CornerUpRight,
  uturn: Undo2,
  arrive: Flag,
};

/**
 * Turn-by-turn navigation HUD screen (presentational).
 * Renders the floating top turn instruction card, optional right-side
 * map utility buttons, and bottom distance remaining card.
 */
export default function NavHud({
  status = 'active',
  turnIcon = 'uturn',
  instruction = 'Turn around',
  stepDistance = '11.5 km remaining',
  nextInstruction = 'Continue straight',
  distanceRemaining = '11.5 km',
  destinationName = 'Senate Building',
  voiceEnabled = true,
  hideDistance = false,
  showMapActions = true,
  onToggleVoice,
  onEnd,
  onRecenter,
  onMoreOptions,
}) {
  const TurnIcon = TURN_ICONS[turnIcon] || Undo2;
  const statusClass =
    status === 'arrived'
      ? styles.topCardArrived
      : status === 'arriving'
        ? styles.topCardArriving
        : '';

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
          <button
            type="button"
            className={styles.mapActionBtn}
            aria-label="Recenter map on current location"
            onClick={() => onRecenter?.()}
          >
            <LocateFixed size={18} strokeWidth={2} aria-hidden="true" />
          </button>

          <button
            type="button"
            className={styles.mapActionBtn}
            aria-label="Navigation options"
            onClick={() => onMoreOptions?.()}
          >
            <MoreHorizontal size={18} strokeWidth={2} aria-hidden="true" />
          </button>
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
