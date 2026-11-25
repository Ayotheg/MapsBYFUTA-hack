import { useState } from 'react';
import { MapPin } from 'lucide-react';

const DEFAULT_SOURCES = {
  mark: '/images/logo-mark.png',
  'lockup-light': '/images/logo-wordmark-dark.png',
  'lockup-dark': '/images/logo-wordmark-white.png',
};

/**
 * Renders the Maps By FUTA logo from `/public/images/` if present,
 * falling back to a branded icon badge + display wordmark.
 */
export default function BrandLogo({
  variant = 'lockup',
  tone = 'light',
  size = 32,
  src,
  className = '',
}) {
  const key = variant === 'mark' ? 'mark' : `lockup-${tone}`;
  const resolvedSrc = src || DEFAULT_SOURCES[key];
  const [failedSrc, setFailedSrc] = useState(null);
  const failed = Boolean(resolvedSrc) && failedSrc === resolvedSrc;

  if (resolvedSrc && !failed) {
    return (
      <img
        src={resolvedSrc}
        alt="Maps By FUTA"
        className={className}
        style={{
          height: `${size}px`,
          width: variant === 'mark' ? `${size}px` : 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
        onError={() => setFailedSrc(resolvedSrc)}
      />
    );
  }

  const textColor =
    tone === 'dark' ? 'var(--color-white)' : 'var(--color-ink)';

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        color: textColor,
      }}
    >
      <span
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-white)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <MapPin size={Math.round(size * 0.56)} strokeWidth={2} aria-hidden="true" />
      </span>
      {variant === 'lockup' && (
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: `${Math.round(size * 0.58)}px`,
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          Maps By FUTA
        </span>
      )}
    </span>
  );
}
