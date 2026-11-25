import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Camera,
  Check,
  Church,
  Compass,
  Globe,
  GraduationCap,
  Home,
  Landmark,
  Mail,
  MapPin,
  Menu,
  Moon,
  Navigation,
  Play,
  Plus,
  Printer,
  Route,
  Search,
  Smartphone,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import styles from './LandingPage.module.css';

const CAMPUSES = [
  {
    id: 'futa',
    short: 'FUTA',
    name: 'Federal University of Technology, Akure',
    state: 'Ondo State',
    live: true,
    meta: '475+ locations mapped',
  },
  {
    id: 'funaab',
    short: 'FUNAAB',
    name: 'Federal University of Agriculture, Abeokuta',
    state: 'Ogun State',
    live: false,
    meta: 'Campus mapping upcoming',
  },
  {
    id: 'oau',
    short: 'OAU',
    name: 'Obafemi Awolowo University',
    state: 'Osun State',
    live: false,
    meta: 'Campus mapping upcoming',
  },
  {
    id: 'unilorin',
    short: 'UNILORIN',
    name: 'University of Ilorin',
    state: 'Kwara State',
    live: false,
    meta: 'Campus mapping upcoming',
  },
  {
    id: 'eksu',
    short: 'EKSU',
    name: 'Ekiti State University',
    state: 'Ekiti State',
    live: false,
    meta: 'Campus mapping upcoming',
  },
  {
    id: 'futo',
    short: 'FUTO',
    name: 'Federal University of Technology, Owerri',
    state: 'Imo State',
    live: false,
    meta: 'Campus mapping upcoming',
  },
];

const CAMPUS_PHOTOS = [
  {
    name: 'T.I. Francis Building',
    src: '/images/landing/ti-francis.png',
    tiltClass: 'fanCard1',
  },
  {
    name: 'SLS Building',
    src: '/images/landing/sls-building.png',
    tiltClass: 'fanCard2',
  },
  {
    name: 'Senate Building',
    src: '/images/landing/senate-building.png',
    tiltClass: 'fanCard3',
  },
  {
    name: 'Albert Ilemobade Library',
    src: '/images/landing/library-building.png',
    tiltClass: 'fanCard4',
  },
];

const ESSENTIALS = [
  { label: 'Faculties', Icon: GraduationCap },
  { label: 'Lecture Halls', Icon: Building2 },
  { label: 'Hostels', Icon: Home },
  { label: 'Library', Icon: BookOpen },
  { label: 'ATMs & Banks', Icon: Landmark },
  { label: 'Printing Shops', Icon: Printer },
  { label: 'Student Affairs', Icon: Users },
  { label: 'Church', Icon: Church },
  { label: 'Mosque', Icon: Moon },
  { label: '+ more on the map', Icon: MapPin, accent: true },
];

const FAQS = [
  {
    q: 'What is UNIMAPS?',
    a: 'UNIMAPS is a campus navigation platform built for universities across Nigeria. It helps students, freshers, staff, and visitors search any campus building, hostel, or service, preview a real photo before arriving, and follow turn-by-turn walking directions.',
  },
  {
    q: 'Which universities are available?',
    a: 'FUTA (Federal University of Technology, Akure) is live today with 475+ mapped campus locations. FUNAAB, OAU, UNILORIN, EKSU, and FUTO are rolling out next, followed by UNILAG, UI, UNN, ABU, and UNIBEN.',
  },
  {
    q: 'Is there a mobile app?',
    a: 'You can use UNIMAPS right in your mobile or desktop browser today with full GPS tracking and voice directions. A dedicated native mobile app is rolling out soon for faster one-tap campus access.',
  },
  {
    q: 'Why UNIMAPS instead of Google Maps?',
    a: 'Google Maps often misses lecture theatres, student footpaths, local nicknames, and recent building photos on Nigerian campuses. UNIMAPS is mapped on the ground by students for how campuses actually work.',
  },
  {
    q: 'Is UNIMAPS free for students?',
    a: 'Yes — searching campus buildings, viewing photos, and navigating around campus in your browser is completely free for students and visitors.',
  },
];

const TICKER_ITEMS = [
  { text: 'Campus navigation across Nigeria', Icon: MapPin },
  { text: 'Free in your browser', Icon: Globe },
  { text: 'Mobile app rolling out soon', Icon: Smartphone },
  { text: 'Turn-by-turn campus routes', Icon: Route },
  { text: 'Recent destination photos', Icon: Camera },
  { text: 'FUTA · FUNAAB · OAU · UNILORIN · EKSU · FUTO', Icon: Sparkles },
];

export default function LandingPage({ onOpenMap }) {
  const [campusFilter, setCampusFilter] = useState('all'); // 'all' | 'live' | 'soon'
  const [openFaqIdx, setOpenFaqIdx] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleCampuses = CAMPUSES.filter((campus) => {
    if (campusFilter === 'live') return campus.live;
    if (campusFilter === 'soon') return !campus.live;
    return true;
  });

  function scrollToSection(id) {
    setMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className={styles.page}>
      {/* Floating Top Navbar */}
      <header className={styles.navOuter}>
        <div className={styles.navPill}>
          <a
            href="#top"
            className={styles.brand}
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <span className={styles.brandIcon} aria-hidden="true">
              <MapPin size={15} strokeWidth={2.4} />
            </span>
            <span className={styles.brandName}>UNIMAPS</span>
          </a>

          <nav className={styles.navLinks} aria-label="Landing navigation">
            <button type="button" onClick={() => scrollToSection('campuses')}>
              Campuses
            </button>
            <button type="button" onClick={() => scrollToSection('features')}>
              Features
            </button>
            <button type="button" onClick={() => scrollToSection('how-it-works')}>
              How it works
            </button>
            <button type="button" onClick={() => scrollToSection('faq')}>
              FAQ
            </button>
          </nav>

          <button
            type="button"
            className={styles.navCta}
            onClick={() => onOpenMap?.()}
          >
            Explore Campuses
          </button>

          <button
            type="button"
            className={styles.mobileMenuBtn}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className={styles.mobileDrawer}>
            <button type="button" onClick={() => scrollToSection('campuses')}>
              Campuses
            </button>
            <button type="button" onClick={() => scrollToSection('features')}>
              Features
            </button>
            <button type="button" onClick={() => scrollToSection('how-it-works')}>
              How it works
            </button>
            <button type="button" onClick={() => scrollToSection('faq')}>
              FAQ
            </button>
            <button
              type="button"
              className={styles.mobileDrawerCta}
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenMap?.();
              }}
            >
              Try FUTA Map
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="top" className={styles.hero}>
        <div className={styles.heroInner}>
          <span className={styles.heroBadge}>
            <MapPin size={13} strokeWidth={2.3} aria-hidden="true" />
            <span>Campus navigation across Nigeria</span>
          </span>

          <h1 className={styles.heroTitle}>
            Campus navigation for{' '}
            <span className={styles.heroTitleAccent}>every university.</span>
          </h1>

          <p className={styles.heroDesc}>
            Search any building, hostel, or campus service, see a recent photo
            before you arrive, and follow up-to-date walking directions built
            for Nigerian universities — not outdated Google Maps data.
          </p>

          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.primaryPillBtn}
              onClick={() => scrollToSection('campuses')}
            >
              <Compass size={16} strokeWidth={2.2} aria-hidden="true" />
              <span>Explore Campuses</span>
            </button>

            <button
              type="button"
              className={styles.secondaryPillBtn}
              onClick={() => scrollToSection('how-it-works')}
            >
              <Play size={14} strokeWidth={2.4} aria-hidden="true" />
              <span>See how it works</span>
            </button>
          </div>

          <p className={styles.heroCaption}>
            Free in your browser today · mobile app rolling out soon · built for
            Nigerian campuses
          </p>
        </div>

        {/* Browser Mockup Preview */}
        <div className={styles.browserWrap}>
          <div
            className={styles.browserFrame}
            role="button"
            tabIndex={0}
            aria-label="Open interactive FUTA campus map"
            onClick={() => onOpenMap?.()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpenMap?.();
              }
            }}
          >
            <div className={styles.browserBar}>
              <div className={styles.browserDots} aria-hidden="true">
                <span className={styles.dotRed} />
                <span className={styles.dotYellow} />
                <span className={styles.dotTeal} />
              </div>
              <div className={styles.browserUrl}>unimaps.ng/map</div>
              <div className={styles.browserStatus}>
                <span className={styles.statusDot} aria-hidden="true" />
                <span>Web · App soon</span>
              </div>
            </div>

            <div className={styles.browserCanvas}>
              <img
                src="/images/landing/campus-map-preview.png"
                alt="UNIMAPS campus map preview"
                className={styles.browserImg}
              />
              <div className={styles.browserScrim} aria-hidden="true" />

              <div className={styles.previewSearch}>
                <Search size={13} strokeWidth={2.2} aria-hidden="true" />
                <span>Search any building, hostel, or ATM…</span>
              </div>

              <span className={`${styles.previewPin} ${styles.pinTeal1}`} aria-hidden="true" />
              <span className={`${styles.previewPin} ${styles.pinViolet}`} aria-hidden="true" />
              <span className={`${styles.previewPin} ${styles.pinTeal2}`} aria-hidden="true" />

              <div className={styles.previewPill}>
                Verified campus routes &amp; photos
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ticker Strip */}
      <section className={styles.tickerSection} aria-label="Platform highlights">
        <div className={styles.tickerTrack}>
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
            <span key={`${item.text}-${idx}`} className={styles.tickerItem}>
              <item.Icon size={14} strokeWidth={2} className={styles.tickerIcon} aria-hidden="true" />
              <span>{item.text}</span>
              <span className={styles.tickerDot} aria-hidden="true" />
            </span>
          ))}
        </div>
      </section>

      {/* Campus Network */}
      <section id="campuses" className={styles.campusSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrowTeal}>Campus Network</span>
            <h2 className={styles.sectionHeading}>
              Built for universities across Nigeria.
            </h2>
            <p className={styles.sectionSub}>
              Every campus is mapped from the ground up with real footpaths,
              verified hostels, and recent photos. Try our live campus today or
              see which universities are rolling out next.
            </p>
          </div>

          <div className={styles.filterRow} role="tablist" aria-label="Filter campuses">
            {[
              { key: 'all', label: 'All (6)' },
              { key: 'live', label: 'Live now (1)' },
              { key: 'soon', label: 'Coming soon (5)' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={campusFilter === tab.key}
                className={`${styles.filterPill} ${
                  campusFilter === tab.key ? styles.filterPillActive : ''
                }`}
                onClick={() => setCampusFilter(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className={styles.campusGrid}>
            {visibleCampuses.map((campus) => (
              <article
                key={campus.id}
                className={`${styles.campusCard} ${
                  campus.live ? styles.campusCardLive : ''
                }`}
                onClick={campus.live ? () => onOpenMap?.() : undefined}
              >
                <div className={styles.campusCardTop}>
                  <div className={styles.campusHeadRow}>
                    <h3 className={styles.campusShort}>{campus.short}</h3>
                    {campus.live ? (
                      <span className={styles.liveBadge}>
                        <span className={styles.statusDot} aria-hidden="true" />
                        <span>Live now</span>
                      </span>
                    ) : (
                      <span className={styles.soonBadge}>Coming soon</span>
                    )}
                  </div>
                  <div className={styles.campusFullName}>{campus.name}</div>
                  <div className={styles.campusState}>{campus.state}</div>
                </div>

                <div className={styles.campusCardFoot}>
                  <span className={styles.campusMeta}>{campus.meta}</span>
                  {campus.live && (
                    <button
                      type="button"
                      className={styles.tryMapBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenMap?.();
                      }}
                    >
                      <span>Try FUTA Map</span>
                      <ArrowRight size={13} strokeWidth={2.4} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className={styles.roadmapBar}>
            <Globe size={16} strokeWidth={2} className={styles.roadmapIcon} aria-hidden="true" />
            <p className={styles.roadmapText}>
              Expanding across Nigerian states —{' '}
              <strong>UNILAG, UI, UNN, ABU, UNIBEN</strong> &amp; more major
              campuses on the roadmap.
            </p>
          </div>
        </div>
      </section>

      {/* Before / After Signpost Section */}
      <section className={styles.signpostSection}>
        <div className={styles.containerNarrow}>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrowTeal}>From signpost to search bar</span>
            <h2 className={styles.sectionHeading}>
              We took the campus map off the signpost.
            </h2>
            <p className={styles.sectionSub}>
              Most university campuses still rely on faded signboards fixed to a
              wall — printed once and never updated. UNIMAPS turns the whole
              campus into a searchable pocket map that stays current.
            </p>
          </div>

          <div className={styles.compareRow}>
            <div className={styles.compareCol}>
              <span className={styles.beforePill}>Before</span>
              <div className={styles.beforePhotos}>
                <img
                  src="/images/landing/signpost-before-1.png"
                  alt="Physical campus signpost"
                  className={styles.beforeImgLeft}
                />
                <img
                  src="/images/landing/signpost-before-2.png"
                  alt="Physical campus directory board"
                  className={styles.beforeImgRight}
                />
              </div>
              <p className={styles.compareCaption}>
                Static signboards &amp; word-of-mouth — only useful if you&apos;re
                already standing in front of one.
              </p>
            </div>

            <div className={styles.compareArrow} aria-hidden="true">
              <ArrowRight size={20} strokeWidth={2.2} />
            </div>

            <div className={styles.compareCol}>
              <span className={styles.afterPill}>After</span>
              <div
                className={styles.afterCard}
                role="button"
                tabIndex={0}
                onClick={() => onOpenMap?.()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenMap?.();
                  }
                }}
              >
                <img
                  src="/images/landing/campus-map-preview.png"
                  alt="UNIMAPS digital campus map"
                  className={styles.afterImg}
                />
                <div className={styles.afterSearchPill}>
                  <Search size={13} strokeWidth={2.2} aria-hidden="true" />
                  <span>Search any campus building…</span>
                </div>
              </div>
              <p className={styles.compareCaption}>
                One digital campus map, searchable from anywhere — always
                updated as schools grow.
              </p>
            </div>
          </div>

          <div className={styles.centerAction}>
            <button
              type="button"
              className={styles.primaryPillBtn}
              onClick={() => onOpenMap?.()}
            >
              <span>Explore Campuses</span>
              <ArrowRight size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.featuresSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrowViolet}>Built for campus life</span>
            <h2 className={styles.sectionHeading}>
              Everything you need to navigate any campus.
            </h2>
          </div>

          <div className={styles.featuresGrid}>
            <article className={styles.featureCard}>
              <span className={styles.featureIconBox} aria-hidden="true">
                <Camera size={20} strokeWidth={2} />
              </span>
              <h3 className={styles.featureTitle}>See it before you arrive</h3>
              <p className={styles.featureCopy}>
                Every location shows a recent photo, so you recognize the
                building the moment you get there — not a guess based on a blank
                pin.
              </p>
              <ul className={styles.featureList}>
                <li>
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                  <span>Recent photo per location</span>
                </li>
                <li>
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                  <span>Routes fresher than outdated Google Maps data</span>
                </li>
              </ul>
            </article>

            <article className={styles.featureCard}>
              <span className={styles.featureIconBox} aria-hidden="true">
                <Search size={20} strokeWidth={2} />
              </span>
              <h3 className={styles.featureTitle}>Find anything in seconds</h3>
              <p className={styles.featureCopy}>
                Search any faculty, lecture theatre, hostel, or ATM by name and
                get instant distance-aware results across mapped university
                grounds.
              </p>
              <ul className={styles.featureList}>
                <li>
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                  <span>Instant autocomplete</span>
                </li>
                <li>
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                  <span>Official names + local student nicknames</span>
                </li>
              </ul>
            </article>

            <article className={styles.featureCard}>
              <span className={styles.featureIconBox} aria-hidden="true">
                <Navigation size={20} strokeWidth={2} />
              </span>
              <h3 className={styles.featureTitle}>
                Directions built for how students move
              </h3>
              <p className={styles.featureCopy}>
                Walking or driving, get turn-by-turn routes with live GPS
                tracking and ETA — built around actual campus footpaths and
                gates.
              </p>
              <ul className={styles.featureList}>
                <li>
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                  <span>Campus footpaths, hostels &amp; roads</span>
                </li>
                <li>
                  <Check size={14} strokeWidth={2.5} aria-hidden="true" />
                  <span>Live GPS tracking &amp; ETA</span>
                </li>
              </ul>
            </article>
          </div>

          <div className={styles.mobileAppBanner}>
            <div className={styles.mobileAppLeft}>
              <span className={styles.featureIconBox} aria-hidden="true">
                <Smartphone size={20} strokeWidth={2} />
              </span>
              <div>
                <h3 className={styles.mobileAppTitle}>
                  Mobile app rolling out soon
                </h3>
                <p className={styles.mobileAppSub}>
                  Use UNIMAPS right in your browser today — a dedicated mobile
                  app is on the way for faster one-tap campus access.
                </p>
              </div>
            </div>
            <span className={styles.comingSoonViolet}>Coming soon</span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className={styles.howSection}>
        <div className={styles.containerMedium}>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrowViolet}>How it works</span>
            <h2 className={styles.sectionHeading}>See UNIMAPS in action.</h2>
            <p className={styles.sectionSub}>
              A 60-second look at searching buildings, following campus
              directions, and exploring with real photos.
            </p>
          </div>

          <button
            type="button"
            className={styles.videoCard}
            onClick={() => onOpenMap?.()}
          >
            <img
              src="/images/landing/campus-map-preview.png"
              alt="UNIMAPS walkthrough poster"
              className={styles.videoPoster}
            />
            <span className={styles.videoScrim} aria-hidden="true" />
            <span className={styles.videoCenter}>
              <span className={styles.playCircle} aria-hidden="true">
                <Play size={24} fill="currentColor" strokeWidth={2} />
              </span>
              <span className={styles.videoBadge}>Preview 60s walkthrough</span>
            </span>
          </button>

          <div className={styles.chapterRow}>
            <button
              type="button"
              className={styles.chapterPill}
              onClick={() => onOpenMap?.()}
            >
              0:05 Search a building
            </button>
            <button
              type="button"
              className={styles.chapterPill}
              onClick={() => onOpenMap?.()}
            >
              0:20 Get directions
            </button>
            <button
              type="button"
              className={styles.chapterPill}
              onClick={() => onOpenMap?.()}
            >
              0:45 Explore campus
            </button>
          </div>
        </div>
      </section>

      {/* Real Campus Photos Fan Gallery */}
      <section className={styles.photosSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrowViolet}>Real campus photos</span>
            <h2 className={styles.sectionHeading}>
              Recognize every building before you arrive.
            </h2>
            <p className={styles.sectionSub}>
              Verified on-ground photos of lecture halls, faculties, and
              libraries — so you recognize your destination immediately, not
              after three wrong turns.
            </p>
          </div>

          <div className={styles.fanGallery}>
            {CAMPUS_PHOTOS.map((item) => (
              <button
                key={item.name}
                type="button"
                className={`${styles.fanCard} ${styles[item.tiltClass]}`}
                onClick={() => onOpenMap?.()}
              >
                <img
                  src={item.src}
                  alt={item.name}
                  className={styles.fanImg}
                />
                <span className={styles.fanScrim} aria-hidden="true" />
                <span className={styles.fanLabel}>
                  <MapPin size={13} strokeWidth={2.2} aria-hidden="true" />
                  <span>{item.name}</span>
                </span>
              </button>
            ))}
          </div>

          <div className={styles.centerAction}>
            <button
              type="button"
              className={styles.textLinkBtn}
              onClick={() => onOpenMap?.()}
            >
              <span>Browse mapped campuses</span>
              <ArrowRight size={15} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Campus Essentials 10-Tile Grid */}
      <section className={styles.essentialsSection}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrowTeal}>Every campus essential</span>
            <h2 className={styles.sectionHeading}>
              The places students visit most.
            </h2>
            <p className={styles.sectionSub}>
              The everyday spots mapped across every UNIMAPS university.
            </p>
          </div>

          <div className={styles.essentialsGrid}>
            {ESSENTIALS.map(({ label, Icon, accent }) => (
              <button
                key={label}
                type="button"
                className={styles.essentialTile}
                onClick={() => onOpenMap?.()}
              >
                <span
                  className={`${styles.essentialIcon} ${
                    accent ? styles.essentialIconViolet : ''
                  }`}
                  aria-hidden="true"
                >
                  <Icon size={19} strokeWidth={2} />
                </span>
                <span
                  className={`${styles.essentialLabel} ${
                    accent ? styles.essentialLabelViolet : ''
                  }`}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Final Violet CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaArch} aria-hidden="true" />
        <div className={styles.ctaInner}>
          <span className={styles.ctaEyebrow}>Ready to explore?</span>
          <h2 className={styles.ctaHeading}>
            Campus navigation for every university.
          </h2>
          <p className={styles.ctaSub}>
            Instant campus search, verified building photos, and walking
            directions built for Nigerian universities — live in your browser
            today, with a mobile app rolling out soon.
          </p>
          <button
            type="button"
            className={styles.ctaWhiteBtn}
            onClick={() => onOpenMap?.()}
          >
            <Compass size={16} strokeWidth={2.2} aria-hidden="true" />
            <span>Explore Campuses</span>
          </button>
          <p className={styles.ctaCaption}>
            Free in your browser · Mobile app coming soon · Expanding across
            Nigeria
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className={styles.faqSection}>
        <div className={styles.containerFaq}>
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrowViolet}>FAQ</span>
            <h2 className={styles.sectionHeading}>
              Frequently asked questions.
            </h2>
          </div>

          <div className={styles.faqList}>
            {FAQS.map((item, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div
                  key={item.q}
                  className={`${styles.faqItem} ${
                    isOpen ? styles.faqItemOpen : ''
                  }`}
                >
                  <button
                    type="button"
                    className={styles.faqTrigger}
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                  >
                    <span>{item.q}</span>
                    <span
                      className={`${styles.faqPlus} ${
                        isOpen ? styles.faqPlusOpen : ''
                      }`}
                      aria-hidden="true"
                    >
                      <Plus size={15} strokeWidth={2.2} />
                    </span>
                  </button>
                  {isOpen && <p className={styles.faqAnswer}>{item.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrandCol}>
              <div className={styles.brand}>
                <span className={styles.brandIcon} aria-hidden="true">
                  <MapPin size={14} strokeWidth={2.4} />
                </span>
                <span className={styles.brandName}>UNIMAPS</span>
              </div>
              <p className={styles.footerTagline}>
                Campus navigation for every university.
              </p>
              <p className={styles.footerMuted}>
                Web today · Mobile app rolling out soon.
              </p>
            </div>

            <div className={styles.footerLinkCols}>
              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>Platform</div>
                <button type="button" onClick={() => scrollToSection('campuses')}>
                  Campuses
                </button>
                <button type="button" onClick={() => scrollToSection('features')}>
                  Features
                </button>
                <button type="button" onClick={() => scrollToSection('how-it-works')}>
                  How it works
                </button>
                <button type="button" onClick={() => scrollToSection('faq')}>
                  FAQ
                </button>
              </div>

              <div className={styles.footerCol}>
                <div className={styles.footerColTitle}>Legal</div>
                <a href="#privacy" onClick={(e) => e.preventDefault()}>
                  Privacy policy
                </a>
                <a href="#terms" onClick={(e) => e.preventDefault()}>
                  Terms of service
                </a>
                <a href="#cookies" onClick={(e) => e.preventDefault()}>
                  Cookie policy
                </a>
              </div>
            </div>

            <div className={styles.footerCtaCol}>
              <div className={styles.footerColTitle}>Get started</div>
              <p className={styles.footerTagline}>
                Free in your browser today. App coming soon.
              </p>
              <button
                type="button"
                className={styles.footerPillBtn}
                onClick={() => onOpenMap?.()}
              >
                <span>Explore Campuses</span>
                <ArrowRight size={14} strokeWidth={2.3} aria-hidden="true" />
              </button>

              <div className={styles.contactRow}>
                <span>Contact us</span>
                <a
                  href="mailto:hello@unimaps.ng"
                  className={styles.socialCircle}
                  aria-label="Email UNIMAPS"
                >
                  <Mail size={14} strokeWidth={2} />
                </a>
                <a
                  href="#top"
                  className={styles.socialCircle}
                  aria-label="UNIMAPS website"
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenMap?.();
                  }}
                >
                  <Globe size={14} strokeWidth={2} />
                </a>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <span>© 2026 UNIMAPS</span>
            <span>Campus navigation across Nigeria</span>
          </div>
        </div>

        <div className={styles.watermarkWrap} aria-hidden="true">
          <div className={styles.watermarkText}>UNIMAPS</div>
          <div className={styles.watermarkFade} />
        </div>
      </footer>
    </div>
  );
}
