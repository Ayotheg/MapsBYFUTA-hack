import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  MapPin,
  Megaphone,
  Phone,
  Sparkles,
  Store,
  Tag,
  X,
} from 'lucide-react';
import styles from './PromotePanel.module.css';

const PROMO_PLANS = [
  {
    id: 'starter',
    name: 'Starter Spot',
    price: 2500,
    period: '7 days',
    perks: ['Featured badge on map', 'Listed in Explore tab'],
  },
  {
    id: 'spotlight',
    name: 'Campus Spotlight',
    price: 6000,
    period: '14 days',
    popular: true,
    perks: ['Top Explore card slot', 'Priority search ranking', 'Highlighted pin'],
  },
  {
    id: 'partner',
    name: 'Semester Partner',
    price: 18000,
    period: '30 days',
    perks: ['Hero placement all month', 'Place + Event boost', 'Analytics summary'],
  },
];

const PLACE_CATEGORIES = [
  'Food & Drinks',
  'Hostel / Lodge',
  'Print & Cybercafe',
  'Shop / Supermarket',
  'Services & Repairs',
  'Health & Pharmacy',
];

const EVENT_CATEGORIES = [
  'Tech & Hackathon',
  'Campus Concert / Social',
  'Seminar / Workshop',
  'Sports & Games',
  'Fellowship / Community',
];

const STORAGE_KEY = 'unimaps_promotions_v1';

function loadSavedPromotions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function PromotePanel({
  open = false,
  initialKind = 'place',
  onClose,
}) {
  const [view, setView] = useState('form'); // 'form' | 'checkout' | 'success' | 'list'
  const [payMethod, setPayMethod] = useState('transfer'); // 'transfer' | 'card'
  const [kind, setKind] = useState(initialKind);
  const [planId, setPlanId] = useState('spotlight');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(PLACE_CATEGORIES[0]);
  const [locationText, setLocationText] = useState('');
  const [tagline, setTagline] = useState('');
  const [contact, setContact] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [ticketPrice, setTicketPrice] = useState('Free');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastBooking, setLastBooking] = useState(null);
  const [myPromotions, setMyPromotions] = useState(loadSavedPromotions);

  useEffect(() => {
    setKind(initialKind || 'place');
    setCategory(
      initialKind === 'event' ? EVENT_CATEGORIES[0] : PLACE_CATEGORIES[0]
    );
  }, [initialKind]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const selectedPlan =
    PROMO_PLANS.find((p) => p.id === planId) || PROMO_PLANS[1];
  const categoryOptions =
    kind === 'event' ? EVENT_CATEGORIES : PLACE_CATEGORIES;

  function handleKindChange(nextKind) {
    setKind(nextKind);
    setCategory(
      nextKind === 'event' ? EVENT_CATEGORIES[0] : PLACE_CATEGORIES[0]
    );
    setError('');
  }

  function handleProceedToPayment(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError(
        kind === 'event'
          ? 'Enter your event title.'
          : 'Enter your business or place name.'
      );
      return;
    }
    if (!contact.trim()) {
      setError('Enter a WhatsApp or phone number so we can confirm.');
      return;
    }
    setError('');
    setView('checkout');
  }

  async function handleSimulatePayment() {
    setError('');
    setSubmitting(true);

    // Simulate payment gateway verification delay
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const paymentRef = `PAY-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const payload = {
      kind,
      plan_id: selectedPlan.id,
      plan_name: selectedPlan.name,
      amount_ngn: selectedPlan.price,
      title: title.trim(),
      category,
      location: locationText.trim() || 'Campus Area',
      tagline: tagline.trim(),
      contact: contact.trim(),
      event_date: kind === 'event' ? eventDate.trim() : null,
      payment_method: payMethod,
      payment_ref: paymentRef,
      status: 'paid',
    };

    let savedRecord = {
      ...payload,
      id: `PRM-${Date.now().toString(36).toUpperCase().slice(-6)}`,
      status: 'paid',
      created_at: new Date().toISOString(),
    };

    try {
      const apiBase =
        (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
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
      // Fall back cleanly to local persistence if offline
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
    setView('success');
  }

  function resetForm() {
    setTitle('');
    setLocationText('');
    setTagline('');
    setContact('');
    setEventDate('');
    setError('');
    setView('form');
  }

  return (
    <aside
      className={styles.panel}
      aria-label="Promote on campus map"
      role="dialog"
    >
      <div className={styles.grabHandle} aria-hidden="true" />

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {view !== 'form' ? (
            <button
              type="button"
              className={styles.backBtn}
              onClick={() => setView('form')}
              aria-label="Back to form"
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <span className={styles.headerIcon}>
              <Megaphone size={18} />
            </span>
          )}
          <div>
            <h2 className={styles.title}>
              {view === 'list'
                ? 'My Promotions'
                : view === 'checkout'
                  ? 'Complete Payment'
                  : view === 'success'
                    ? 'Payment Confirmed'
                    : 'Promote on Campus'}
            </h2>
            <p className={styles.subtitle}>
              Reach thousands of students searching daily
            </p>
          </div>
        </div>

        <div className={styles.headerActions}>
          {myPromotions.length > 0 && view === 'form' && (
            <button
              type="button"
              className={styles.listBtn}
              onClick={() => setView('list')}
            >
              Mine ({myPromotions.length})
            </button>
          )}
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close promote panel"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      <div className={styles.body}>
        {view === 'checkout' ? (
          <div className={styles.checkoutBox}>
            <div className={styles.simBanner}>
              <Lock size={13} />
              <span>Simulated Checkout · Demo Payment Gateway</span>
            </div>

            <div className={styles.orderSummary}>
              <div className={styles.summaryRow}>
                <span>Campaign</span>
                <strong>{title.trim()}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Plan</span>
                <strong>
                  {selectedPlan.name} ({selectedPlan.period})
                </strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Gateway Fee</span>
                <strong>₦0</strong>
              </div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>Total Due</span>
                <strong className="tabular-nums">
                  ₦{selectedPlan.price.toLocaleString()}
                </strong>
              </div>
            </div>

            <div className={styles.sectionLabel}>Select payment method</div>
            <div className={styles.kindSwitch}>
              <button
                type="button"
                className={`${styles.kindBtn} ${payMethod === 'transfer' ? styles.kindBtnActive : ''}`}
                onClick={() => setPayMethod('transfer')}
              >
                <Building2 size={15} /> Bank Transfer
              </button>
              <button
                type="button"
                className={`${styles.kindBtn} ${payMethod === 'card' ? styles.kindBtnActive : ''}`}
                onClick={() => setPayMethod('card')}
              >
                <CreditCard size={15} /> Debit Card
              </button>
            </div>

            {payMethod === 'transfer' ? (
              <div className={styles.bankBox}>
                <div className={styles.bankLine}>
                  <span>Bank Name</span>
                  <strong>Wema Bank (Virtual)</strong>
                </div>
                <div className={styles.bankLine}>
                  <span>Account Number</span>
                  <strong className={styles.monoText}>9045 8120 33</strong>
                </div>
                <div className={styles.bankLine}>
                  <span>Account Name</span>
                  <strong>UNIMAPS PROMO ESCROW</strong>
                </div>
              </div>
            ) : (
              <div className={styles.bankBox}>
                <div className={styles.bankLine}>
                  <span>Test Card</span>
                  <strong className={styles.monoText}>5061 •••• •••• 4242</strong>
                </div>
                <div className={styles.bankLine}>
                  <span>Expiry / CVV</span>
                  <strong className={styles.monoText}>12/28 · 408</strong>
                </div>
              </div>
            )}

            <button
              type="button"
              className={styles.primaryBtn}
              disabled={submitting}
              onClick={handleSimulatePayment}
            >
              {submitting ? (
                <span className={styles.btnInline}>
                  <Loader2 size={16} className={styles.spin} /> Verifying payment...
                </span>
              ) : payMethod === 'transfer' ? (
                `I’ve Sent ₦${selectedPlan.price.toLocaleString()} (Simulate)`
              ) : (
                `Pay ₦${selectedPlan.price.toLocaleString()} Now (Simulate)`
              )}
            </button>

            <button
              type="button"
              className={styles.secondaryBtn}
              disabled={submitting}
              onClick={() => setView('form')}
            >
              Back to details
            </button>
          </div>
        ) : view === 'success' && lastBooking ? (
          <div className={styles.successBox}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={36} />
            </div>
            <h3 className={styles.successTitle}>Payment Verified!</h3>
            <p className={styles.successText}>
              <strong>{lastBooking.title}</strong> is now queued for{' '}
              <strong>{lastBooking.plan_name}</strong> (₦
              {Number(lastBooking.amount_ngn).toLocaleString()} paid).
            </p>
            <div className={styles.refPill}>
              Receipt: <span>{lastBooking.payment_ref || lastBooking.id}</span>
            </div>
            <p className={styles.successHint}>
              Confirmation sent to <strong>{lastBooking.contact}</strong>. Your
              featured pin & Explore card will go live shortly.
            </p>
            <div className={styles.successActions}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={resetForm}
              >
                Promote another
              </button>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setView('list')}
              >
                View my campaigns
              </button>
            </div>
          </div>
        ) : view === 'list' ? (
          <div className={styles.listWrap}>
            {myPromotions.length === 0 ? (
              <p className={styles.emptyText}>No promotion requests yet.</p>
            ) : (
              myPromotions.map((item) => (
                <div key={item.id} className={styles.promoListItem}>
                  <div className={styles.promoListTop}>
                    <span className={styles.promoKindBadge}>
                      {item.kind === 'event' ? 'Event' : 'Place'}
                    </span>
                    <span className={styles.promoStatus}>
                      {item.status === 'paid' ? 'Paid · Active' : 'Pending review'}
                    </span>
                  </div>
                  <div className={styles.promoListTitle}>{item.title}</div>
                  <div className={styles.promoListMeta}>
                    {item.plan_name} · ₦
                    {Number(item.amount_ngn || 0).toLocaleString()} · Ref{' '}
                    {item.id}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <form onSubmit={handleProceedToPayment} className={styles.form}>
            {/* Kind toggle */}
            <div className={styles.kindSwitch} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={kind === 'place'}
                className={`${styles.kindBtn} ${kind === 'place' ? styles.kindBtnActive : ''}`}
                onClick={() => handleKindChange('place')}
              >
                <Store size={15} />
                Business / Place
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={kind === 'event'}
                className={`${styles.kindBtn} ${kind === 'event' ? styles.kindBtnActive : ''}`}
                onClick={() => handleKindChange('event')}
              >
                <Calendar size={15} />
                Campus Event
              </button>
            </div>

            {/* Plans */}
            <div className={styles.sectionLabel}>Choose a boost plan</div>
            <div className={styles.plansGrid}>
              {PROMO_PLANS.map((plan) => {
                const active = plan.id === planId;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    className={`${styles.planCard} ${active ? styles.planCardActive : ''}`}
                    onClick={() => setPlanId(plan.id)}
                  >
                    <div className={styles.planHead}>
                      <span className={styles.planName}>{plan.name}</span>
                      {plan.popular && (
                        <span className={styles.popularBadge}>Popular</span>
                      )}
                    </div>
                    <div className={`${styles.planPrice} tabular-nums`}>
                      ₦{plan.price.toLocaleString()}
                      <span> / {plan.period}</span>
                    </div>
                    <ul className={styles.planPerks}>
                      {plan.perks.map((perk) => (
                        <li key={perk}>
                          <Check size={12} /> {perk}
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {/* Details */}
            <div className={styles.sectionLabel}>Campaign details</div>
            <div className={styles.field}>
              <label htmlFor="promo-title">
                {kind === 'event' ? 'Event Title *' : 'Business / Place Name *'}
              </label>
              <input
                id="promo-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  kind === 'event'
                    ? 'e.g. Campus Tech Fest 2026'
                    : 'e.g. Mama Put Express & Print Hub'
                }
                required
              />
            </div>

            <div className={styles.twoCol}>
              <div className={styles.field}>
                <label htmlFor="promo-cat">
                  <Tag size={12} /> Category
                </label>
                <select
                  id="promo-cat"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {categoryOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="promo-loc">
                  <MapPin size={12} /> Area / Venue
                </label>
                <input
                  id="promo-loc"
                  type="text"
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  placeholder="e.g. South Gate / SUB"
                />
              </div>
            </div>

            {kind === 'event' && (
              <div className={styles.twoCol}>
                <div className={styles.field}>
                  <label htmlFor="promo-date">
                    <Calendar size={12} /> Date & Time
                  </label>
                  <input
                    id="promo-date"
                    type="text"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder="Fri, Nov 27 · 2 PM"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="promo-ticket">
                    <Tag size={12} /> Ticket Entry
                  </label>
                  <input
                    id="promo-ticket"
                    type="text"
                    value={ticketPrice}
                    onChange={(e) => setTicketPrice(e.target.value)}
                    placeholder="Free or ₦1,500"
                  />
                </div>
              </div>
            )}

            <div className={styles.field}>
              <label htmlFor="promo-tagline">Short Promo Offer / Pitch</label>
              <textarea
                id="promo-tagline"
                rows={2}
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="10% student discount, fast delivery, or free entry..."
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="promo-contact">
                <Phone size={12} /> WhatsApp / Phone *
              </label>
              <input
                id="promo-contact"
                type="tel"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="0801 234 5678"
                required
              />
            </div>

            {/* Live card preview */}
            <div className={styles.previewCard}>
              <div className={styles.previewBadge}>
                <Sparkles size={11} /> Featured Preview
              </div>
              <div className={styles.previewTitle}>
                {title.trim() ||
                  (kind === 'event'
                    ? 'Your Campus Event'
                    : 'Your Campus Business')}
              </div>
              <div className={styles.previewMeta}>
                {category} · {locationText.trim() || 'Campus Area'}
                {kind === 'event' && eventDate.trim() ? ` · ${eventDate.trim()}` : ''}
                {kind === 'event' && ticketPrice.trim() ? ` · ${ticketPrice.trim()}` : ''}
              </div>
              {tagline.trim() && (
                <div className={styles.previewDesc}>{tagline.trim()}</div>
              )}
            </div>

            {error && <div className={styles.errorBox}>{error}</div>}

            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={submitting}
            >
              {`Continue to Payment · ₦${selectedPlan.price.toLocaleString()}`}
            </button>
          </form>
        )}
      </div>
    </aside>
  );
}
