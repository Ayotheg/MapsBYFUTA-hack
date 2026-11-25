import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Loader2,
  Plus,
  ShieldCheck,
  X,
} from 'lucide-react';
import styles from './PromotePanel.module.css';

const STORAGE_KEY = 'unimaps_promotions_v1';
const DAILY_RATE = { place: 200, event: 300 };
const MAX_PHOTOS = 5;

function loadSavedPromotions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
}

export default function PromotePanel({
  open = false,
  initialKind = 'place',
  onClose,
}) {
  const [step, setStep] = useState(1); // 1 = details, 2 = simulated checkout, 3 = success
  const [kind, setKind] = useState(initialKind === 'event' ? 'event' : 'place');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [storeType, setStoreType] = useState('Physical shop');
  const [eventVenue, setEventVenue] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [contact, setContact] = useState('');
  const [photos, setPhotos] = useState([]);
  const [days, setDays] = useState(7);
  const [promoCode, setPromoCode] = useState('');
  const [discountPct, setDiscountPct] = useState(0);
  const [promoMsg, setPromoMsg] = useState('');
  const [payMethod, setPayMethod] = useState('transfer');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastBooking, setLastBooking] = useState(null);
  const [myPromotions, setMyPromotions] = useState(loadSavedPromotions);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setKind(initialKind === 'event' ? 'event' : 'place');
    setStoreType(initialKind === 'event' ? 'On-campus' : 'Physical shop');
    setStep(1);
    setError('');
  }, [initialKind, open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const rate = DAILY_RATE[kind] || 200;
  const subtotal = days * rate;
  const discount = Math.round((subtotal * discountPct) / 100);
  const total = Math.max(0, subtotal - discount);

  function handleKindChange(nextKind) {
    setKind(nextKind);
    setStoreType(nextKind === 'event' ? 'On-campus' : 'Physical shop');
    setError('');
  }

  async function handlePhotoUpload(e) {
    const files = Array.from(e.target.files || []).slice(0, MAX_PHOTOS - photos.length);
    if (!files.length) return;
    const urls = await Promise.all(files.map(readFileAsDataUrl));
    setPhotos((prev) => [...prev, ...urls].slice(0, MAX_PHOTOS));
    e.target.value = '';
  }

  function removePhoto(idx) {
    setPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleApplyPromo() {
    const code = promoCode.trim().toUpperCase();
    if (!code) return;
    if (['ODS2026', 'FUTA10', 'UNIMAPS', 'CAMPUS20'].includes(code)) {
      setDiscountPct(20);
      setPromoMsg('20% campus discount applied!');
    } else {
      setDiscountPct(0);
      setPromoMsg('Try ODS2026 or FUTA10 for 20% off');
    }
  }

  function handleGoToCheckout(e) {
    e?.preventDefault();
    if (!title.trim()) {
      setError(
        kind === 'event'
          ? 'Please enter your event title.'
          : 'Please enter your business name.'
      );
      return;
    }
    setError('');
    setStep(2);
  }

  async function handleSimulatePayment() {
    setSubmitting(true);
    setError('');
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const paymentRef = `PAY-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const payload = {
      kind,
      plan_id: `${days}d`,
      plan_name: `${days}-day ${kind === 'event' ? 'Event' : 'Business'} Boost`,
      amount_ngn: total,
      title: title.trim(),
      category: storeType,
      location: eventVenue.trim() || storeType,
      tagline: description.trim(),
      contact: contact.trim() || 'WhatsApp Verified',
      event_date: kind === 'event' ? eventDate.trim() : null,
      payment_ref: paymentRef,
      status: 'paid',
    };

    let savedRecord = {
      ...payload,
      id: `PRM-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      created_at: new Date().toISOString(),
    };

    try {
      const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
      const res = await fetch(`${apiBase}/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.id) savedRecord = { ...savedRecord, ...json, payment_ref: paymentRef, status: 'paid' };
      }
    } catch {
      // Fall back gracefully to local storage
    }

    const updated = [savedRecord, ...myPromotions];
    setMyPromotions(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage errors
    }

    setLastBooking(savedRecord);
    setSubmitting(false);
    setStep(3);
  }

  function resetAll() {
    setTitle('');
    setDescription('');
    setEventVenue('');
    setEventDate('');
    setContact('');
    setPhotos([]);
    setDays(7);
    setPromoCode('');
    setDiscountPct(0);
    setPromoMsg('');
    setStep(1);
  }

  const slotPlaceholders = Math.max(0, 3 - photos.length);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Promote">
      {/* Top Bar */}
      <header className={styles.topBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => (step === 2 ? setStep(1) : onClose?.())}
        >
          <span className={styles.backCircle}>
            <ArrowLeft size={16} />
          </span>
          <span>Back</span>
        </button>

        <div className={styles.centerToggle} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={kind === 'place'}
            className={`${styles.toggleTab} ${kind === 'place' ? styles.toggleTabActive : ''}`}
            onClick={() => handleKindChange('place')}
          >
            Business
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={kind === 'event'}
            className={`${styles.toggleTab} ${kind === 'event' ? styles.toggleTabActive : ''}`}
            onClick={() => handleKindChange('event')}
          >
            Event
          </button>
        </div>

        <div className={styles.stepLabel}>
          {step === 3 ? 'CONFIRMED' : `STEP ${step} OF 2`}
        </div>
      </header>

      {/* Main Content */}
      <main className={styles.main}>
        {step === 3 && lastBooking ? (
          <div className={styles.successCard}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={40} />
            </div>
            <h2 className={styles.successHeading}>Payment Confirmed!</h2>
            <p className={styles.successSub}>
              <strong>{lastBooking.title}</strong> is booked for{' '}
              <strong>{days} days</strong> (₦{Number(lastBooking.amount_ngn).toLocaleString()} paid).
            </p>
            <div className={styles.receiptPill}>
              Receipt: <span>{lastBooking.payment_ref || lastBooking.id}</span>
            </div>
            <div className={styles.successBtns}>
              <button type="button" className={styles.ctaBtn} onClick={resetAll}>
                Promote another {kind === 'event' ? 'event' : 'business'}
              </button>
              <button type="button" className={styles.cancelLink} onClick={onClose}>
                Return to map
              </button>
            </div>
          </div>
        ) : step === 2 ? (
          <div className={styles.checkoutWrap}>
            <div className={styles.checkoutCard}>
              <div className={styles.simTag}>
                <ShieldCheck size={14} /> Simulated Checkout · Instant Demo Verification
              </div>

              <h2 className={styles.checkoutTitle}>Complete your payment</h2>

              <div className={styles.summaryRows}>
                <div className={styles.summaryRow}>
                  <span>{kind === 'event' ? 'Event' : 'Business'}</span>
                  <strong>{title.trim()}</strong>
                </div>
                <div className={styles.summaryRow}>
                  <span>Campaign length</span>
                  <strong>{days} days</strong>
                </div>
                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span>Total</span>
                  <strong className={`${styles.totalAmount} tabular-nums`}>
                    ₦{total.toLocaleString()}
                  </strong>
                </div>
              </div>

              <div className={styles.payTabs}>
                <button
                  type="button"
                  className={`${styles.payTab} ${payMethod === 'transfer' ? styles.payTabActive : ''}`}
                  onClick={() => setPayMethod('transfer')}
                >
                  <Building2 size={15} /> Bank Transfer
                </button>
                <button
                  type="button"
                  className={`${styles.payTab} ${payMethod === 'card' ? styles.payTabActive : ''}`}
                  onClick={() => setPayMethod('card')}
                >
                  <CreditCard size={15} /> Debit Card
                </button>
              </div>

              {payMethod === 'transfer' ? (
                <div className={styles.payDetails}>
                  <div>
                    <span>Bank</span>
                    <strong>Wema Bank (Virtual Escrow)</strong>
                  </div>
                  <div>
                    <span>Account Number</span>
                    <strong className={styles.mono}>9045 8120 33</strong>
                  </div>
                  <div>
                    <span>Account Name</span>
                    <strong>UNIMAPS PROMO ESCROW</strong>
                  </div>
                </div>
              ) : (
                <div className={styles.payDetails}>
                  <div>
                    <span>Demo Card</span>
                    <strong className={styles.mono}>5061 •••• •••• 4242</strong>
                  </div>
                  <div>
                    <span>Expiry / CVV</span>
                    <strong className={styles.mono}>12/28 · 408</strong>
                  </div>
                </div>
              )}

              <button
                type="button"
                className={styles.ctaBtn}
                disabled={submitting}
                onClick={handleSimulatePayment}
              >
                {submitting ? (
                  <>
                    <Loader2 size={17} className={styles.spin} /> Verifying payment...
                  </>
                ) : (
                  <>
                    Pay ₦{total.toLocaleString()} (Simulate) <ArrowRight size={17} />
                  </>
                )}
              </button>

              <button
                type="button"
                className={styles.cancelLink}
                disabled={submitting}
                onClick={() => setStep(1)}
              >
                Back to campaign details
              </button>
            </div>
          </div>
        ) : (
          <form className={styles.grid} onSubmit={handleGoToCheckout}>
            {/* Left Column: Form */}
            <div className={styles.leftCol}>
              <div className={styles.eyebrow}>PROMOTE</div>
              <h1 className={styles.heroTitle}>
                {kind === 'event'
                  ? 'Put your event in front of FUTA.'
                  : 'Put your business in front of FUTA.'}
              </h1>
              <p className={styles.heroSub}>
                Thousands of students and campus explorers, every day.
              </p>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="promo-name">
                  {kind === 'event' ? 'EVENT NAME' : 'BUSINESS NAME'}
                </label>
                <input
                  id="promo-name"
                  type="text"
                  className={styles.lineInput}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    kind === 'event'
                      ? 'e.g. FUTA Tech & Innovation Summit'
                      : "e.g. Debby's Fragrances"
                  }
                  required
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel} htmlFor="promo-desc">
                  DESCRIPTION <span className={styles.optionalTag}>· optional</span>
                </label>
                <textarea
                  id="promo-desc"
                  rows={2}
                  className={styles.lineTextarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    kind === 'event'
                      ? 'A line or two about what attendees can expect'
                      : 'A line or two about what you offer'
                  }
                />
              </div>

              {kind === 'event' && (
                <div className={styles.twoCol}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="promo-venue">
                      VENUE / AREA
                    </label>
                    <input
                      id="promo-venue"
                      type="text"
                      className={styles.lineInput}
                      value={eventVenue}
                      onChange={(e) => setEventVenue(e.target.value)}
                      placeholder="e.g. 2500-Seater Auditorium"
                    />
                  </div>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="promo-date">
                      DATE & TIME
                    </label>
                    <input
                      id="promo-date"
                      type="text"
                      className={styles.lineInput}
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      placeholder="e.g. Fri, Nov 27 · 2 PM"
                    />
                  </div>
                </div>
              )}

              <div className={styles.fieldGroup}>
                <div className={styles.fieldLabel}>TYPE</div>
                <div className={styles.typePillSwitch}>
                  {(kind === 'event'
                    ? ['On-campus', 'Online']
                    : ['Physical shop', 'Online store']
                  ).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      className={`${styles.typePill} ${storeType === opt ? styles.typePillActive : ''}`}
                      onClick={() => setStoreType(opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.photosHeader}>
                  <span className={styles.fieldLabel}>PHOTOS</span>
                  <span className={styles.photosHint}>JPG or PNG · up to 5</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={handlePhotoUpload}
                />
                <div className={styles.photosRow}>
                  {photos.length < MAX_PHOTOS && (
                    <button
                      type="button"
                      className={styles.addPhotoBox}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Plus size={20} />
                      <span>Add photo</span>
                    </button>
                  )}

                  {photos.map((src, idx) => (
                    <div key={idx} className={styles.photoThumb}>
                      <img src={src} alt={`Upload ${idx + 1}`} />
                      <button
                        type="button"
                        className={styles.removePhotoBtn}
                        onClick={() => removePhoto(idx)}
                        aria-label="Remove photo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {Array.from({ length: slotPlaceholders }).map((_, idx) => (
                    <div key={`slot-${idx}`} className={styles.emptyPhotoSlot} />
                  ))}
                </div>
              </div>

              <div className={styles.fieldGroup}>
                <div className={styles.sliderHeader}>
                  <span className={styles.fieldLabel}>CAMPAIGN LENGTH</span>
                  <div className={styles.daysReadout}>
                    <strong className="tabular-nums">{days}</strong>
                    <span>{days === 1 ? 'day' : 'days'}</span>
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className={styles.slider}
                />
                <div className={styles.sliderTicks}>
                  <span>1 day</span>
                  <span>15</span>
                  <span>30 days</span>
                </div>
              </div>

              {error && <div className={styles.errorBox}>{error}</div>}
            </div>

            {/* Right Column: Summary Card */}
            <aside className={styles.rightCol}>
              <div className={styles.summaryCard}>
                <div className={styles.summaryTop}>
                  <span className={styles.fieldLabel}>SUMMARY</span>
                  <span className={styles.reachBadge}>Daily student reach</span>
                </div>

                <div className={styles.summaryRows}>
                  <div className={styles.summaryRow}>
                    <span>Campaign length</span>
                    <strong className="tabular-nums">
                      {days} {days === 1 ? 'day' : 'days'}
                    </strong>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Rate</span>
                    <strong className="tabular-nums">
                      ₦{rate.toLocaleString()} / day
                    </strong>
                  </div>
                  {discount > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Discount ({discountPct}%)</span>
                      <strong className={styles.discountVal}>
                        -₦{discount.toLocaleString()}
                      </strong>
                    </div>
                  )}
                </div>

                <div className={styles.promoRow}>
                  <input
                    type="text"
                    placeholder="Promo code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className={styles.promoInput}
                  />
                  <button
                    type="button"
                    className={styles.applyBtn}
                    onClick={handleApplyPromo}
                  >
                    Apply
                  </button>
                </div>
                {promoMsg && <div className={styles.promoMsg}>{promoMsg}</div>}

                <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                  <span>Total</span>
                  <strong className={`${styles.totalAmount} tabular-nums`}>
                    ₦{total.toLocaleString()}
                  </strong>
                </div>

                <button type="submit" className={styles.ctaBtn}>
                  Continue to checkout <ArrowRight size={17} />
                </button>

                <div className={styles.securedNote}>
                  <ShieldCheck size={14} />
                  <span>
                    Secured by <strong>Unimaps Demo Pay</strong>
                  </span>
                </div>

                <button
                  type="button"
                  className={styles.cancelLink}
                  onClick={onClose}
                >
                  Cancel and go back
                </button>
              </div>
            </aside>
          </form>
        )}
      </main>
    </div>
  );
}
