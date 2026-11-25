import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  GraduationCap,
  LogOut,
  Mail,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import styles from './AuthModal.module.css';

export default function AuthModal({
  open = false,
  user = null,
  onSignIn,
  onSignOut,
  onClose,
}) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function completeSignIn(payload) {
    setError('');
    setSubmitting(true);

    let signedInUser = {
      id: `usr-${Date.now().toString(36)}`,
      name: payload.name || payload.email.split('@')[0],
      email: payload.email.trim().toLowerCase(),
      department: payload.department || 'Campus Explorer',
    };

    try {
      const apiBase = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
      const res = await fetch(`${apiBase}/auth/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.user) signedInUser = json.user;
      }
    } catch {
      // Fallback gracefully to local session
    }

    setSubmitting(false);
    onSignIn?.(signedInUser);
    onClose?.();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    await completeSignIn({
      name: name.trim() || email.trim().split('@')[0],
      email: email.trim(),
      department: department.trim(),
    });
  }

  async function handleDemoGoogle() {
    await completeSignIn({
      name: 'Ayoola Student',
      email: 'student@unimaps.ng',
      department: 'Computer Science · 300L',
    });
  }

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <header className={styles.header}>
          <div>
            <h2 className={styles.title}>
              {user ? 'Your Profile' : mode === 'signup' ? 'Create Account' : 'Sign in to Unimaps'}
            </h2>
            <p className={styles.subtitle}>
              {user
                ? 'Unlimited walking navigation unlocked'
                : 'Save places, post reviews & unlock unlimited navigation'}
            </p>
          </div>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        {user ? (
          <div className={styles.profileBody}>
            <div className={styles.profileHeader}>
              <div className={styles.avatar}>
                {(user.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <div className={styles.profileName}>{user.name}</div>
                <div className={styles.profileEmail}>{user.email}</div>
                {user.department && (
                  <div className={styles.profileDept}>{user.department}</div>
                )}
              </div>
            </div>

            <div className={styles.perkBanner}>
              <CheckCircle2 size={16} />
              <span>Signed in · Unlimited turn-by-turn navigation active</span>
            </div>

            <button
              type="button"
              className={styles.signOutBtn}
              onClick={() => {
                onSignOut?.();
                onClose?.();
              }}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        ) : (
          <div className={styles.body}>
            <div className={styles.modeSwitch}>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === 'signin' ? styles.modeBtnActive : ''}`}
                onClick={() => {
                  setMode('signin');
                  setError('');
                }}
              >
                Sign in
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === 'signup' ? styles.modeBtnActive : ''}`}
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
              >
                Sign up
              </button>
            </div>

            <button
              type="button"
              className={styles.googleBtn}
              disabled={submitting}
              onClick={handleDemoGoogle}
            >
              <ShieldCheck size={16} />
              Continue as Campus Student (1-Click)
            </button>

            <div className={styles.divider}>
              <span>or with email</span>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {mode === 'signup' && (
                <div className={styles.field}>
                  <label htmlFor="auth-name">
                    <User size={12} /> Full Name
                  </label>
                  <input
                    id="auth-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tunde Adeyemi"
                    required
                  />
                </div>
              )}

              <div className={styles.field}>
                <label htmlFor="auth-email">
                  <Mail size={12} /> Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@student.edu.ng"
                  required
                />
              </div>

              {mode === 'signup' && (
                <div className={styles.field}>
                  <label htmlFor="auth-dept">
                    <GraduationCap size={12} /> Department / Level (optional)
                  </label>
                  <input
                    id="auth-dept"
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. CSC 200L"
                  />
                </div>
              )}

              <div className={styles.field}>
                <label htmlFor="auth-pass">Password</label>
                <input
                  id="auth-pass"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && <div className={styles.errorBox}>{error}</div>}

              <button
                type="submit"
                className={styles.primaryBtn}
                disabled={submitting}
              >
                {submitting
                  ? 'Signing in...'
                  : mode === 'signup'
                    ? 'Create account'
                    : 'Sign in'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
