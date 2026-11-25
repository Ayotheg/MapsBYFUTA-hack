import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Crosshair,
  Map as MapIcon,
  MapPin,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { formatWaypointType, getWaypointColor } from '../../data/waypointColors';
import styles from './SuggestPanel.module.css';

const TYPE_OPTIONS = [
  { value: 'landmark', label: 'Landmark' },
  { value: 'lecture_hall', label: 'Lecture Hall' },
  { value: 'faculty', label: 'Faculty Building' },
  { value: 'laboratory', label: 'Laboratory' },
  { value: 'workshop', label: 'Workshop / Studio' },
  { value: 'library', label: 'Library' },
  { value: 'admin', label: 'Admin / Registry' },
  { value: 'hostel', label: 'Student Hostel' },
  { value: 'food', label: 'Food & Drinks' },
  { value: 'shop', label: 'Shop / Services' },
  { value: 'printing_shop', label: 'Print Shop' },
  { value: 'bank', label: 'Bank / ATM' },
  { value: 'clinic', label: 'Clinic / Health Centre' },
  { value: 'sports', label: 'Sports Facility' },
  { value: 'hall', label: 'Multipurpose Hall' },
  { value: 'mosque', label: 'Mosque' },
  { value: 'chapel', label: 'Chapel / Church' },
  { value: 'gate', label: 'Gate / Entrance' },
  { value: 'bus_stop', label: 'Bus Stop' },
  { value: 'garage', label: 'Garage / Motor Park' },
  { value: 'toilet', label: 'Toilet' },
  { value: 'fuel', label: 'Fuel Station' },
  { value: 'staff_quarters', label: 'Staff Quarters' },
  { value: 'infrastructure', label: 'Infrastructure' },
];

const MAX_PHOTOS = 5;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

/**
 * Suggest a Place panel:
 * - Desktop (>=768px): floating card on the left beside the Navbar rail.
 * - Mobile (<768px): bottom sheet with grab handle and sticky footer.
 * - Supports Use my location, Pick on map, up to 5 photos, instant auto-add to map,
 *   Success confirmation state, and My submissions list.
 */
export default function SuggestPanel({
  open = false,
  pickingOnMap = false,
  pickedCoords = null,
  userCoords = null,
  submissions = [],
  onStartPickOnMap,
  onCancelPickOnMap,
  onClearPickedCoords,
  onSubmitPlace,
  onSelectSubmission,
  onDeleteSubmission,
  onClose,
}) {
  const [view, setView] = useState('form'); // 'form' | 'success' | 'submissions'
  const [name, setName] = useState('');
  const [type, setType] = useState('landmark');
  const [area, setArea] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState([]);
  const [localCoords, setLocalCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [lastCreated, setLastCreated] = useState(null);
  const fileInputRef = useRef(null);

  const activeCoords = pickedCoords || localCoords;

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (pickingOnMap) {
          onCancelPickOnMap?.();
        } else {
          onClose?.();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, pickingOnMap, onCancelPickOnMap, onClose]);

  if (!open) return null;

  // Map-picking floating banner while user taps a point on the map
  if (pickingOnMap) {
    return (
      <div className={styles.pickBanner} role="status" aria-live="polite">
        <span className={styles.pickIcon} aria-hidden="true">
          <MapPin size={16} strokeWidth={2.2} />
        </span>
        <span className={styles.pickText}>
          Tap anywhere on the map to place the pin
        </span>
        <button
          type="button"
          className={styles.pickCancelBtn}
          onClick={() => onCancelPickOnMap?.()}
        >
          Cancel
        </button>
      </div>
    );
  }

  function resetForm() {
    setName('');
    setType('landmark');
    setArea('');
    setDescription('');
    setPhotos([]);
    setLocalCoords(null);
    setError('');
    onClearPickedCoords?.();
  }

  function handleUseMyLocation() {
    setError('');
    onClearPickedCoords?.();

    if (userCoords && Number.isFinite(userCoords.lat) && Number.isFinite(userCoords.lng)) {
      setLocalCoords({ lat: userCoords.lat, lng: userCoords.lng });
      return;
    }

    if (!navigator.geolocation) {
      setError('Location is not supported by this browser. Try "Pick on map".');
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        setLocalCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setLocating(false);
        setError('Could not get your GPS location. Tap "Pick on map" instead.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 15000 }
    );
  }

  async function handlePhotoChange(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    const remaining = MAX_PHOTOS - photos.length;
    const toRead = files.slice(0, Math.max(0, remaining));
    if (!toRead.length) return;

    try {
      const dataUrls = await Promise.all(toRead.map(readFileAsDataUrl));
      setPhotos((prev) => [...prev, ...dataUrls].slice(0, MAX_PHOTOS));
    } catch {
      setError('Could not read one of the selected images.');
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter a place name.');
      return;
    }
    if (!activeCoords || !Number.isFinite(activeCoords.lat) || !Number.isFinite(activeCoords.lng)) {
      setError('Please set a location using GPS or "Pick on map".');
      return;
    }

    const created = onSubmitPlace?.({
      name: trimmedName,
      type,
      area,
      description,
      lat: activeCoords.lat,
      lng: activeCoords.lng,
      photos,
    });

    setLastCreated(created || null);
    resetForm();
    setView('success');
  }

  function handleDone() {
    const created = lastCreated;
    setLastCreated(null);
    setView('form');
    onClose?.();
    if (created) {
      onSelectSubmission?.(created);
    }
  }

  return (
    <section className={styles.panel} aria-label="Suggest a place">
      <div className={styles.grabRow}>
        <span className={styles.grabPill} />
      </div>

      <header className={styles.header}>
        <div className={styles.headerText}>
          <h2 className={styles.title}>
            {view === 'submissions' ? 'My submissions' : 'Suggest a place'}
          </h2>
          <p className={styles.subtitle}>
            {view === 'submissions'
              ? 'Places you added appear on the campus map right away.'
              : "Missing from the map? Add it and we'll review it."}
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

      {view === 'success' && (
        <div className={styles.successBody}>
          <div className={styles.successCircle} aria-hidden="true">
            <Check size={28} strokeWidth={2.4} />
          </div>
          <h3 className={styles.successTitle}>Thanks for the suggestion</h3>
          <p className={styles.successCopy}>
            Added to the map automatically. You can view it now or check your
            submissions anytime.
          </p>
          <button
            type="button"
            className={styles.doneBtn}
            onClick={handleDone}
          >
            Done
          </button>
          <button
            type="button"
            className={styles.linkBtn}
            onClick={() => setView('submissions')}
          >
            View my submissions
          </button>
        </div>
      )}

      {view === 'submissions' && (
        <div className={styles.submissionsBody}>
          {submissions.length === 0 ? (
            <div className={styles.emptyBox}>
              <p className={styles.emptyText}>No places submitted yet.</p>
            </div>
          ) : (
            <ul className={styles.subList}>
              {submissions.map((item) => (
                <li key={item.id} className={styles.subItem}>
                  <button
                    type="button"
                    className={styles.subMainBtn}
                    onClick={() => {
                      onClose?.();
                      onSelectSubmission?.(item);
                    }}
                  >
                    <span
                      className={styles.subDot}
                      style={{ backgroundColor: getWaypointColor(item.type) }}
                      aria-hidden="true"
                    />
                    <span className={styles.subMeta}>
                      <span className={styles.subName}>{item.name}</span>
                      <span className={styles.subDesc}>
                        {formatWaypointType(item.type)}
                        {item.area ? ` · ${item.area}` : ''}
                      </span>
                    </span>
                    <span className={styles.liveBadge}>Live</span>
                  </button>
                  <button
                    type="button"
                    className={styles.deleteBtn}
                    aria-label={`Remove ${item.name}`}
                    onClick={() => onDeleteSubmission?.(item.id)}
                  >
                    <Trash2 size={14} strokeWidth={2} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => setView('form')}
            >
              <ArrowLeft size={15} strokeWidth={2} aria-hidden="true" />
              <span>Suggest another</span>
            </button>
          </div>
        </div>
      )}

      {view === 'form' && (
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.formScroll}>
            <div className={styles.twoCol}>
              <label className={styles.field}>
                <span className={styles.label}>Place name</span>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="e.g. New Engineering Block"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                />
              </label>

              <label className={styles.field}>
                <span className={styles.label}>Type</span>
                <select
                  className={styles.select}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className={styles.field}>
              <span className={styles.labelRow}>
                <span className={styles.label}>Area</span>
                <span className={styles.optional}>Optional</span>
              </span>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. South Gate, West Gate, SUB"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </label>

            <div className={styles.field}>
              <span className={styles.label}>Location</span>
              <div className={styles.locRow}>
                <button
                  type="button"
                  className={`${styles.locBtn} ${
                    localCoords && !pickedCoords ? styles.locBtnActive : ''
                  }`}
                  onClick={handleUseMyLocation}
                  disabled={locating}
                >
                  <Crosshair
                    size={15}
                    strokeWidth={2}
                    className={styles.locIcon}
                    aria-hidden="true"
                  />
                  <span>{locating ? 'Locating…' : 'Use my location'}</span>
                </button>

                <button
                  type="button"
                  className={`${styles.locBtn} ${
                    pickedCoords ? styles.locBtnActive : ''
                  }`}
                  onClick={() => {
                    setError('');
                    onStartPickOnMap?.();
                  }}
                >
                  <MapIcon
                    size={15}
                    strokeWidth={2}
                    className={styles.locIcon}
                    aria-hidden="true"
                  />
                  <span>Pick on map</span>
                </button>
              </div>

              {activeCoords && (
                <div className={styles.coordChip}>
                  <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                  <span className="tabular-nums">
                    {activeCoords.lat.toFixed(5)}, {activeCoords.lng.toFixed(5)}
                  </span>
                  <button
                    type="button"
                    className={styles.coordClear}
                    aria-label="Clear coordinates"
                    onClick={() => {
                      setLocalCoords(null);
                      onClearPickedCoords?.();
                    }}
                  >
                    <X size={12} strokeWidth={2.4} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            <div className={styles.field}>
              <span className={styles.labelRow}>
                <span className={styles.label}>Photos</span>
                <span className={styles.optional}>Optional · up to 5</span>
              </span>

              <div className={styles.photoGrid}>
                {photos.map((src, index) => (
                  <div key={`${index}-${src.slice(0, 24)}`} className={styles.photoThumb}>
                    <img src={src} alt={`Upload ${index + 1}`} />
                    <button
                      type="button"
                      className={styles.photoRemove}
                      aria-label={`Remove photo ${index + 1}`}
                      onClick={() =>
                        setPhotos((prev) => prev.filter((_, idx) => idx !== index))
                      }
                    >
                      <X size={11} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                  </div>
                ))}

                {photos.length < MAX_PHOTOS && (
                  <button
                    type="button"
                    className={styles.photoAddBtn}
                    aria-label="Add photo"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus size={18} strokeWidth={2} aria-hidden="true" />
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className={styles.hiddenFile}
                onChange={handlePhotoChange}
              />
            </div>

            <label className={styles.field}>
              <span className={styles.labelRow}>
                <span className={styles.label}>Description</span>
                <span className={styles.optional}>Optional</span>
              </span>
              <textarea
                rows={3}
                className={styles.textarea}
                placeholder="Anything that helps people find it"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            {error && <div className={styles.errorText}>{error}</div>}
          </div>

          <div className={styles.footer}>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => setView('submissions')}
            >
              My submissions
              {submissions.length > 0 ? ` (${submissions.length})` : ''}
            </button>

            <button type="submit" className={styles.submitBtn}>
              Submit for review
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
