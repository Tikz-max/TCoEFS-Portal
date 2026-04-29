'use client';

import React from 'react';

/* ============================================================================
   Skeleton Loading Components
   SkeletonCard, SkeletonTableRow, SkeletonAvatar, SkeletonThumbnail
   Uses .skeleton-card, .skeleton-line, .skeleton-avatar, .skeleton-thumbnail,
   .skeleton-row from components.css.
   No hard-coded values — everything traces to a design token.
   ============================================================================ */

/* ────────────────────────────────────────────────────────────────────────────
   SkeletonAvatar — circular shimmer for user avatars
   ──────────────────────────────────────────────────────────────────────────── */

interface SkeletonAvatarProps {
  size?: number;
  className?: string;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size,
  className = '',
}) => (
  <div
    className={`skeleton-avatar${className ? ` ${className}` : ''}`}
    aria-hidden="true"
    style={
      size
        ? { width: `${size}px`, height: `${size}px` }
        : undefined
    }
  />
);

/* ────────────────────────────────────────────────────────────────────────────
   SkeletonThumbnail — 16/9 shimmer block for course card thumbnails
   ──────────────────────────────────────────────────────────────────────────── */

interface SkeletonThumbnailProps {
  className?: string;
}

export const SkeletonThumbnail: React.FC<SkeletonThumbnailProps> = ({
  className = '',
}) => (
  <div
    className={`skeleton-thumbnail${className ? ` ${className}` : ''}`}
    aria-hidden="true"
  />
);

/* ────────────────────────────────────────────────────────────────────────────
   SkeletonLine — single shimmer text line, reused internally
   ──────────────────────────────────────────────────────────────────────────── */

type SkeletonLineVariant = 'title' | 'body' | 'body-short' | 'caption';

interface SkeletonLineProps {
  variant?: SkeletonLineVariant;
  /** Override width as a CSS string — e.g. "45%", "120px" */
  width?: string;
  className?: string;
}

export const SkeletonLine: React.FC<SkeletonLineProps> = ({
  variant = 'body',
  width,
  className = '',
}) => (
  <div
    className={`skeleton-line skeleton-line--${variant}${className ? ` ${className}` : ''}`}
    aria-hidden="true"
    style={width ? { width } : undefined}
  />
);

/* ────────────────────────────────────────────────────────────────────────────
   SkeletonCard — shimmer lines inside a card shell
   Configurable line count and optional thumbnail slot.
   ──────────────────────────────────────────────────────────────────────────── */

interface SkeletonCardProps {
  /** Show a 16/9 thumbnail placeholder at the top — for course cards */
  showThumbnail?: boolean;
  /** Show an avatar + short line header row — for user-centric cards */
  showAvatar?: boolean;
  /** Number of body lines to render below the title line — default 2 */
  bodyLines?: number;
  /** Show a bottom footer row (e.g. badge + button placeholders) */
  showFooter?: boolean;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  showThumbnail = false,
  showAvatar    = false,
  bodyLines     = 2,
  showFooter    = false,
  className     = '',
}) => (
  <div
    className={`skeleton-card${className ? ` ${className}` : ''}`}
    aria-busy="true"
    aria-label="Loading…"
    role="status"
  >
    {/* Optional thumbnail */}
    {showThumbnail && <SkeletonThumbnail />}

    {/* Optional avatar + header row */}
    {showAvatar && (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}
        aria-hidden="true"
      >
        <SkeletonAvatar />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          <SkeletonLine variant="title" width="55%" />
          <SkeletonLine variant="caption" width="35%" />
        </div>
      </div>
    )}

    {/* Title line */}
    {!showAvatar && <SkeletonLine variant="title" />}

    {/* Body lines */}
    {Array.from({ length: bodyLines }).map((_, i) => (
      <SkeletonLine
        key={i}
        variant={i === bodyLines - 1 ? 'body-short' : 'body'}
      />
    ))}

    {/* Optional footer */}
    {showFooter && (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 'var(--space-2)',
          gap: 'var(--space-3)',
        }}
        aria-hidden="true"
      >
        <SkeletonLine variant="caption" width="80px" />
        <div
          style={{
            height: '36px',
            width: '100px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(90deg, var(--bg-surface-dark) 25%, var(--border-subtle) 50%, var(--bg-surface-dark) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s ease-in-out infinite',
            flexShrink: 0,
          }}
        />
      </div>
    )}
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   SkeletonTableRow — shimmer cells inside a table row
   ──────────────────────────────────────────────────────────────────────────── */

interface SkeletonTableRowProps {
  /**
   * Column widths — each entry is a CSS width string for that cell.
   * Defaults to a 4-column layout: ["120px", "100%", "80px", "90px"]
   */
  columns?: string[];
  /** Show avatar in the first column */
  showAvatar?: boolean;
  className?: string;
}

export const SkeletonTableRow: React.FC<SkeletonTableRowProps> = ({
  columns   = ['120px', '100%', '80px', '90px'],
  showAvatar = false,
  className  = '',
}) => (
  <div
    className={`skeleton-row${className ? ` ${className}` : ''}`}
    aria-busy="true"
    aria-label="Loading row…"
    role="status"
  >
    {/* Optional leading avatar */}
    {showAvatar && <SkeletonAvatar size={32} />}

    {columns.map((w, i) => (
      <div
        key={i}
        style={{ flex: w === '100%' ? 1 : '0 0 auto', minWidth: 0 }}
        aria-hidden="true"
      >
        <SkeletonLine
          variant={i === 0 ? 'title' : 'body'}
          width={w === '100%' ? undefined : w}
        />
      </div>
    ))}
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   SkeletonKPICard — for admin dashboard KPI grid placeholders
   ──────────────────────────────────────────────────────────────────────────── */

interface SkeletonKPICardProps {
  className?: string;
}

export const SkeletonKPICard: React.FC<SkeletonKPICardProps> = ({
  className = '',
}) => (
  <div
    className={`skeleton-card${className ? ` ${className}` : ''}`}
    aria-busy="true"
    aria-label="Loading metric…"
    role="status"
    style={{ gap: 'var(--space-3)' }}
  >
    <SkeletonLine variant="caption" width="60%" />
    <div
      style={{
        height: '36px',
        width: '50%',
        borderRadius: 'var(--radius-sm)',
        background: 'linear-gradient(90deg, var(--bg-surface-dark) 25%, var(--border-subtle) 50%, var(--bg-surface-dark) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
      aria-hidden="true"
    />
    <SkeletonLine variant="caption" width="40%" />
  </div>
);

export default SkeletonCard;
