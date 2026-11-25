import { useEffect, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';

/**
 * Renders an image when `src` loads cleanly, and falls back to a styled
 * placeholder with a Lucide icon when `src` is missing or fails to load.
 */
export default function FallbackImage({
  src,
  alt = '',
  className = '',
  style,
  fallbackLabel,
  FallbackIcon = ImageIcon,
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt || fallbackLabel || 'Image placeholder'}
        className={className}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          backgroundColor: 'var(--color-surface-alt)',
          border: '1px dashed var(--color-border)',
          color: 'var(--color-text-muted)',
          padding: '16px',
          textAlign: 'center',
          ...style,
        }}
      >
        <FallbackIcon size={24} strokeWidth={2} aria-hidden="true" />
        {(fallbackLabel || alt) && (
          <span style={{ fontSize: '12px', lineHeight: 1.35 }}>
            {fallbackLabel || alt}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
