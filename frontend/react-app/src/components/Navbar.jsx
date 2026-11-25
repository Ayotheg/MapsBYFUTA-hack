import { useEffect, useRef, useState } from 'react';
import {
  CirclePlus,
  CircleUser,
  Compass,
  Flag,
  Layers,
  Navigation,
  Plus,
  Rss,
  User,
  Users,
} from 'lucide-react';
import BrandLogo from './BrandLogo';
import styles from './Navbar.module.css';

const DESKTOP_ITEMS = [
  { key: 'layers', label: 'Layers', Icon: Layers },
  { key: 'explore', label: 'Explore', Icon: Compass },
  { key: 'signal', label: 'Signal', Icon: Rss },
  { key: 'navigate', label: 'Navigate', Icon: Navigation },
];

const MOBILE_TABS = [
  { key: 'explore', label: 'Explore', Icon: Compass },
  { key: 'signal', label: 'Signal', Icon: Rss },
  { key: 'navigate', label: 'Nav', Icon: Navigation, isPrimary: true },
  { key: 'suggest', label: 'Suggest', Icon: CirclePlus, isAction: true },
  { key: 'profile', label: 'Profile', Icon: CircleUser, isAction: true },
];

const NAV_MENU_ITEMS = [
  { key: 'navigate', label: 'Navigate', Icon: Navigation, tone: 'primary' },
  { key: 'meet', label: 'Meet a friend', Icon: Users, tone: 'primary' },
  { key: 'race', label: 'Race to a place', Icon: Flag, tone: 'teal' },
];

/**
 * Responsive navigation chrome for Maps By FUTA:
 * - Desktop (>=768px): fixed left vertical rail strip.
 * - Mobile (<768px): fixed bottom navigation bar.
 * Both share a floating Nav popover menu for Navigate / Meet a friend / Race to a place.
 */
export default function Navbar({
  activeTab: controlledActiveTab,
  onTabChange,
  onNavigateAction,
  onSuggestClick,
  onAuthClick,
  onLogoClick,
  user = null,
  guestNavRemaining = 3,
  navDot = false,
  profileDot = false,
  navActive = false,
  version = 'v1.0',
}) {
  const [internalTab, setInternalTab] = useState('layers');
  const activeTab =
    controlledActiveTab !== undefined ? controlledActiveTab : internalTab;

  const [navMenuOpen, setNavMenuOpen] = useState(false);
  const [desktopMenuTop, setDesktopMenuTop] = useState(null);
  const desktopNavBtnRef = useRef(null);
  const firstMenuItemRef = useRef(null);

  useEffect(() => {
    if (!navMenuOpen) return undefined;
    firstMenuItemRef.current?.focus();
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setNavMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navMenuOpen]);

  function selectTab(nextKey) {
    if (controlledActiveTab === undefined) {
      setInternalTab(nextKey);
    }
    onTabChange?.(nextKey);
  }

  function handleDesktopItemClick(key) {
    if (navActive) return;
    if (key === 'navigate') {
      const rect = desktopNavBtnRef.current?.getBoundingClientRect();
      if (rect) {
        setDesktopMenuTop(Math.max(16, rect.top + rect.height / 2 - 78));
      }
      setNavMenuOpen((open) => !open);
      return;
    }
    setNavMenuOpen(false);
    selectTab(activeTab === key ? null : key);
  }

  function handleMobileTabClick(tab) {
    if (navActive) return;
    if (tab.key === 'navigate') {
      setNavMenuOpen((open) => !open);
      return;
    }
    setNavMenuOpen(false);
    if (tab.isAction) {
      if (tab.key === 'suggest') onSuggestClick?.();
      else if (tab.key === 'profile') onAuthClick?.();
      return;
    }
    selectTab(activeTab === tab.key ? null : tab.key);
  }

  function handleMenuAction(actionKey) {
    setNavMenuOpen(false);
    selectTab('navigate');
    onNavigateAction?.(actionKey);
  }

  const userName = user?.name?.trim() || '';
  const firstName = userName ? userName.split(/\s+/)[0] : '';
  const showProfileDot = Boolean(user) || profileDot;

  return (
    <>
      {/* Desktop vertical left rail */}
      <aside className={styles.desktopRail} aria-label="Primary navigation">
        <button
          type="button"
          className={styles.logoBtn}
          aria-label="Maps By FUTA Home"
          onClick={() => {
            setNavMenuOpen(false);
            onLogoClick?.();
          }}
        >
          <BrandLogo variant="mark" size={30} />
        </button>

        <div className={styles.railDivider} aria-hidden="true" />

        <nav className={styles.railItems}>
          {DESKTOP_ITEMS.map(({ key, label, Icon }) => {
            const isActive =
              key === 'navigate'
                ? navMenuOpen || activeTab === 'navigate'
                : activeTab === key;

            return (
              <button
                key={key}
                ref={key === 'navigate' ? desktopNavBtnRef : undefined}
                type="button"
                className={`${styles.railBtn} ${isActive ? styles.railBtnActive : ''}`}
                aria-current={isActive ? 'page' : undefined}
                aria-expanded={key === 'navigate' ? navMenuOpen : undefined}
                disabled={navActive}
                onClick={() => handleDesktopItemClick(key)}
              >
                <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                {key === 'navigate' && navDot && (
                  <span className={styles.navDot} aria-hidden="true" />
                )}
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.railFooter}>
          <button
            type="button"
            className={styles.suggestBtn}
            disabled={navActive}
            onClick={() => {
              setNavMenuOpen(false);
              onSuggestClick?.();
            }}
          >
            <span className={styles.suggestIcon}>
              <Plus size={22} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <span className={styles.footerLabel}>Suggest</span>
          </button>

          <div className={styles.railDivider} aria-hidden="true" />

          <button
            type="button"
            className={styles.accountBtn}
            onClick={() => {
              setNavMenuOpen(false);
              onAuthClick?.();
            }}
          >
            <span className={styles.avatarRing}>
              <span className={styles.avatarInner}>
                {user?.avatarUrl ? (
                  <img
                    className={styles.avatarImg}
                    src={user.avatarUrl}
                    alt={firstName || 'Profile'}
                  />
                ) : firstName ? (
                  firstName.charAt(0).toUpperCase()
                ) : (
                  <User size={18} strokeWidth={2} aria-hidden="true" />
                )}
              </span>
              {!user && guestNavRemaining != null && (
                <span className={`${styles.guestBadge} tabular-nums`}>
                  {guestNavRemaining}
                </span>
              )}
            </span>
            <span className={styles.footerLabel}>{firstName || 'Sign in'}</span>
          </button>

          <span className={`${styles.version} tabular-nums`}>{version}</span>
        </div>
      </aside>

      {/* Mobile bottom bar */}
      <nav
        className={`${styles.mobileBar} ${navActive ? styles.mobileBarLocked : ''}`}
        aria-label="Mobile navigation"
      >
        <div className={styles.mobileTabs}>
          {MOBILE_TABS.map((tab) => {
            const isOpenNav = tab.key === 'navigate' && navMenuOpen;
            const isActive =
              tab.key === 'navigate'
                ? isOpenNav || activeTab === 'navigate'
                : !tab.isAction && activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                className={`${styles.mobileTab} ${
                  tab.isPrimary ? styles.mobileTabPrimary : ''
                } ${isActive ? styles.mobileTabActive : ''}`}
                aria-current={isActive ? 'page' : undefined}
                aria-expanded={tab.key === 'navigate' ? navMenuOpen : undefined}
                disabled={navActive}
                onClick={() => handleMobileTabClick(tab)}
              >
                <span className={styles.mobileIconWrap}>
                  <tab.Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                  {tab.key === 'profile' && showProfileDot && (
                    <span className={styles.profileDot} aria-hidden="true" />
                  )}
                  {tab.key === 'navigate' && navDot && (
                    <span className={styles.mobileNavDot} aria-hidden="true" />
                  )}
                </span>
                <span className={styles.mobileLabel}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Shared Nav popover menu */}
      {navMenuOpen && (
        <>
          <button
            type="button"
            className={styles.menuScrim}
            aria-label="Close navigation menu"
            onClick={() => setNavMenuOpen(false)}
          />
          <div
            role="menu"
            aria-label="Navigation modes"
            className={styles.navMenu}
            style={
              desktopMenuTop != null
                ? { '--menu-desktop-top': `${desktopMenuTop}px` }
                : undefined
            }
          >
            {NAV_MENU_ITEMS.map(({ key, label, Icon, tone }, index) => (
              <button
                key={key}
                ref={index === 0 ? firstMenuItemRef : undefined}
                type="button"
                role="menuitem"
                className={styles.navMenuItem}
                onClick={() => handleMenuAction(key)}
              >
                <Icon
                  size={18}
                  strokeWidth={2}
                  className={
                    tone === 'teal'
                      ? styles.menuIconTeal
                      : styles.menuIconPrimary
                  }
                  aria-hidden="true"
                />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
