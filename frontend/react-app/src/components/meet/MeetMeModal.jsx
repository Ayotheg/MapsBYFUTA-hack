import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  KeyRound,
  Link2,
  MapPin,
  MessageCircle,
  Navigation,
  Search,
  Share2,
  Smartphone,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { formatMeetCode } from '../../hooks/useMeetMe';
import styles from './MeetMeModal.module.css';

function spacedCode(code) {
  if (!code) return '';
  return code.split('').join(' ');
}

/**
 * Meet-Me modal (Host lobby + Join with a code + Meeting Point picker)
 * plus compact floating pill when a Meet-Me session is minimized on the map.
 */
export default function MeetMeModal({
  open = false,
  mode = 'host',
  session = null,
  minutesLeft = 30,
  joinError = '',
  places = [],
  popularPlaces = [],
  onModeChange,
  onJoinCode,
  onClearJoinError,
  onSetMeetingPoint,
  onNavigateToMeetingPoint,
  onOpenModal,
  onClose,
  onLeave,
}) {
  const [joinInput, setJoinInput] = useState('');
  const [copiedType, setCopiedType] = useState(null); // 'code' | 'link' | 'share'
  const [pickingPlace, setPickingPlace] = useState(false);
  const [placeQuery, setPlaceQuery] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (pickingPlace) setPickingPlace(false);
        else onClose?.();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, pickingPlace, onClose]);

  const placeResults = useMemo(() => {
    const q = placeQuery.trim().toLowerCase();
    const pool = q
      ? places.filter((p) => {
          if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return false;
          return `${p.name} ${p.subtitle || ''} ${p.type || ''}`
            .toLowerCase()
            .includes(q);
        })
      : popularPlaces.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    return pool.slice(0, 6);
  }, [placeQuery, places, popularPlaces]);

  // Compact active Meet-Me bar when modal is minimized but a session is live
  if (!open) {
    if (!session) return null;
    const friendsCount = Math.max(0, session.participants.length - 1);
    return (
      <div className={styles.activeBar} role="region" aria-label="Active Meet me session">
        <button
          type="button"
          className={styles.activeBarMain}
          onClick={() => onOpenModal?.()}
        >
          <span className={styles.activeDot} aria-hidden="true" />
          <Users size={15} strokeWidth={2.2} aria-hidden="true" />
          <span className={styles.activeBarCode}>{session.code}</span>
          <span className={`${styles.activeBarMeta} tabular-nums`}>
            · {friendsCount === 0 ? 'Waiting' : `${session.participants.length}/8`} · {minutesLeft}m
          </span>
        </button>

        {session.meetingPoint && (
          <button
            type="button"
            className={styles.activeBarNavBtn}
            onClick={() => onNavigateToMeetingPoint?.(session.meetingPoint)}
          >
            <Navigation size={13} strokeWidth={2.2} aria-hidden="true" />
            <span>Go</span>
          </button>
        )}

        <button
          type="button"
          className={styles.activeBarLeaveBtn}
          aria-label="Leave Meet me"
          onClick={() => onLeave?.()}
        >
          <X size={14} strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
    );
  }

  const inviteCode = session?.code || '';
  const shareUrl =
    typeof window !== 'undefined' && inviteCode
      ? `${window.location.origin}${window.location.pathname}?meet=${encodeURIComponent(inviteCode)}`
      : '';
  const inviteText = `Meet me on FUTA campus! Join with code ${inviteCode}: ${shareUrl}`;

  function flashCopied(type) {
    setCopiedType(type);
    setTimeout(() => {
      setCopiedType((curr) => (curr === type ? null : curr));
    }, 1800);
  }

  async function copyText(text, type) {
    try {
      await navigator.clipboard?.writeText(text);
      flashCopied(type);
    } catch {
      // Clipboard unavailable
    }
  }

  async function handleShareInvite() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meet me on Maps By FUTA',
          text: `Join my Meet me on FUTA campus with code ${inviteCode}`,
          url: shareUrl,
        });
        flashCopied('share');
        return;
      } catch {
        // User cancelled share sheet
      }
    }
    copyText(inviteText, 'share');
  }

  function handleWhatsApp() {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(inviteText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  }

  function handleJoinSubmit(event) {
    event.preventDefault();
    const ok = onJoinCode?.(joinInput);
    if (ok) {
      setJoinInput('');
    }
  }

  const otherParticipants = (session?.participants || []).filter(
    (p) => !p.name.startsWith('You')
  );
  const displayCount = otherParticipants.length;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Meet me">
      <button
        type="button"
        className={styles.scrim}
        aria-label="Close Meet me"
        onClick={() => onClose?.()}
      />

      {mode === 'join' ? (
        <div className={styles.joinCard}>
          <div className={styles.joinHead}>
            <div>
              <div className={styles.joinEyebrow}>MEET ME</div>
              <h2 className={styles.title}>Join with a code</h2>
              <p className={styles.subtitle}>
                Type the 6-character code your friend shared.
              </p>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="Close"
              onClick={() => onClose?.()}
            >
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleJoinSubmit} className={styles.joinForm}>
            <label className={styles.codeLabel} htmlFor="meet-code-input">
              CODE
            </label>
            <input
              id="meet-code-input"
              type="text"
              inputMode="text"
              autoComplete="off"
              autoFocus
              maxLength={7}
              placeholder="K7Q-29F"
              className={`${styles.codeInput} tabular-nums`}
              value={joinInput}
              onChange={(e) => {
                setJoinInput(formatMeetCode(e.target.value));
                if (joinError) onClearJoinError?.();
              }}
            />

            {joinError && <div className={styles.errorText}>{joinError}</div>}

            <button
              type="submit"
              className={styles.joinBtn}
              disabled={joinInput.replace(/[^A-Z0-9]/g, '').length < 6}
            >
              <KeyRound size={16} strokeWidth={2.2} aria-hidden="true" />
              <span>Join</span>
            </button>
          </form>

          <button
            type="button"
            className={styles.switchLink}
            onClick={() => onModeChange?.('host')}
          >
            Back to my invite code
          </button>
        </div>
      ) : (
        <div className={styles.hostCard}>
          <header className={styles.hostHead}>
            <div>
              <h2 className={styles.title}>Meet me</h2>
              <p className={`${styles.subtitle} tabular-nums`}>
                2–8 people · Within 5 km · {minutesLeft} min left
              </p>
            </div>
            <button
              type="button"
              className={styles.closeBtn}
              aria-label="Close"
              onClick={() => onClose?.()}
            >
              <X size={18} strokeWidth={2} aria-hidden="true" />
            </button>
          </header>

          <div className={styles.columns}>
            {/* Left column: Invite Code & Share */}
            <div className={styles.inviteBox}>
              <div className={styles.inviteTop}>
                <div>
                  <div className={styles.boxLabel}>INVITE CODE</div>
                  <div className={`${styles.codeDisplay} tabular-nums`}>
                    {spacedCode(inviteCode)}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.copyPill}
                  onClick={() => copyText(inviteCode, 'code')}
                >
                  {copiedType === 'code' ? (
                    <Check size={14} strokeWidth={2.4} aria-hidden="true" />
                  ) : (
                    <Copy size={14} strokeWidth={2} aria-hidden="true" />
                  )}
                  <span>{copiedType === 'code' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <button
                type="button"
                className={styles.shareBtn}
                onClick={handleShareInvite}
              >
                <Share2 size={16} strokeWidth={2.2} aria-hidden="true" />
                <span>
                  {copiedType === 'share' ? 'Invite copied!' : 'Share invite'}
                </span>
              </button>

              <div className={styles.shareRow}>
                <button
                  type="button"
                  className={styles.waBtn}
                  onClick={handleWhatsApp}
                >
                  <MessageCircle size={15} strokeWidth={2} aria-hidden="true" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  className={styles.linkCopyBtn}
                  onClick={() => copyText(shareUrl, 'link')}
                >
                  {copiedType === 'link' ? (
                    <Check size={15} strokeWidth={2.2} aria-hidden="true" />
                  ) : (
                    <Link2 size={15} strokeWidth={2} aria-hidden="true" />
                  )}
                  <span>{copiedType === 'link' ? 'Copied' : 'Copy link'}</span>
                </button>
              </div>

              <div className={styles.keepOpenNote}>
                <Smartphone size={13} strokeWidth={2} aria-hidden="true" />
                <span>Keep this open until everyone joins.</span>
              </div>
            </div>

            {/* Right column: People + Meeting Point */}
            <div className={styles.infoBox}>
              <div className={styles.peopleHeader}>
                <span className={styles.boxLabel}>PEOPLE</span>
                <span className={`${styles.peopleCount} tabular-nums`}>
                  {displayCount} / 8
                </span>
              </div>

              {displayCount === 0 ? (
                <div className={styles.waitingRow}>
                  <span className={styles.waitingCircle} aria-hidden="true">
                    <UserPlus size={15} strokeWidth={2} />
                  </span>
                  <span className={styles.waitingText}>
                    Waiting for friends to join (2–8 people)...
                  </span>
                </div>
              ) : (
                <ul className={styles.peopleList}>
                  {session.participants.map((person) => (
                    <li key={person.id} className={styles.personRow}>
                      <span className={styles.personAvatar} aria-hidden="true">
                        {person.name.charAt(0).toUpperCase()}
                      </span>
                      <span className={styles.personName}>{person.name}</span>
                      <span className={styles.personStatus}>Connected</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className={styles.meetingRow}>
                <span className={styles.meetingPin} aria-hidden="true">
                  <MapPin size={16} strokeWidth={2} />
                </span>
                <div className={styles.meetingBody}>
                  <div className={styles.boxLabel}>MEETING POINT</div>
                  <div className={styles.meetingVal}>
                    {session?.meetingPoint?.name || 'Anywhere · find each other'}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.setPlaceBtn}
                  onClick={() => setPickingPlace((v) => !v)}
                >
                  {pickingPlace ? 'Cancel' : session?.meetingPoint ? 'Change' : 'Set place'}
                </button>
              </div>

              {pickingPlace && (
                <div className={styles.placePicker}>
                  <div className={styles.pickerSearch}>
                    <Search size={14} strokeWidth={2} aria-hidden="true" />
                    <input
                      type="text"
                      placeholder="Search campus place…"
                      value={placeQuery}
                      onChange={(e) => setPlaceQuery(e.target.value)}
                    />
                  </div>
                  <div className={styles.pickerList}>
                    {session?.meetingPoint && (
                      <button
                        type="button"
                        className={styles.pickerItem}
                        onClick={() => {
                          onSetMeetingPoint?.(null);
                          setPickingPlace(false);
                          setPlaceQuery('');
                        }}
                      >
                        Anywhere · find each other
                      </button>
                    )}
                    {placeResults.map((place) => (
                      <button
                        key={place.id}
                        type="button"
                        className={styles.pickerItem}
                        onClick={() => {
                          onSetMeetingPoint?.(place);
                          setPickingPlace(false);
                          setPlaceQuery('');
                        }}
                      >
                        {place.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {session?.meetingPoint && !pickingPlace && (
                <button
                  type="button"
                  className={styles.goMeetingBtn}
                  onClick={() => onNavigateToMeetingPoint?.(session.meetingPoint)}
                >
                  <Navigation size={14} strokeWidth={2.2} aria-hidden="true" />
                  <span>Navigate to meeting point</span>
                </button>
              )}
            </div>
          </div>

          <div className={styles.hostFooter}>
            <button
              type="button"
              className={styles.switchLink}
              onClick={() => onModeChange?.('join')}
            >
              <KeyRound size={14} strokeWidth={2} aria-hidden="true" />
              <span>Have a friend&apos;s code? Join theirs</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
