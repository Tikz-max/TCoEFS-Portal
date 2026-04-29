'use client';

import React from 'react';
import { FileX, Inbox, SearchX, BookOpen, Users, CreditCard } from 'lucide-react';

/* ============================================================================
   EmptyState
   Centred icon circle (inset shadow), title (H3), message, optional CTA.
   Used in empty tables, no-applications state, no-courses state, etc.
   Uses .empty-state, .empty-state__icon, .empty-state__title,
   .empty-state__message from components.css.
   No hard-coded values — everything traces to a design token.
   ============================================================================ */

export type EmptyStatePreset =
  | 'default'
  | 'no-applications'
  | 'no-courses'
  | 'no-results'
  | 'no-payments'
  | 'no-users';

interface EmptyStateProps {
  /** Preset selects a contextually appropriate icon automatically */
  preset?: EmptyStatePreset;
  /** Override the icon with any React node (e.g. a Lucide icon) */
  icon?: React.ReactNode;
  title: string;
  message?: string;
  /** Optional CTA — renders below the message */
  action?: React.ReactNode;
  className?: string;
}

/* ── Default icon per preset ─────────────────────────────────────────────── */

const presetIcons: Record<EmptyStatePreset, React.ReactNode> = {
  'default':          <Inbox       size={26} strokeWidth={1.5} aria-hidden="true" />,
  'no-applications':  <FileX       size={26} strokeWidth={1.5} aria-hidden="true" />,
  'no-courses':       <BookOpen    size={26} strokeWidth={1.5} aria-hidden="true" />,
  'no-results':       <SearchX     size={26} strokeWidth={1.5} aria-hidden="true" />,
  'no-payments':      <CreditCard  size={26} strokeWidth={1.5} aria-hidden="true" />,
  'no-users':         <Users       size={26} strokeWidth={1.5} aria-hidden="true" />,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  preset = 'default',
  icon,
  title,
  message,
  action,
  className = '',
}) => {
  const resolvedIcon = icon ?? presetIcons[preset];

  return (
    <div
      className={`empty-state${className ? ` ${className}` : ''}`}
      role="status"
      aria-live="polite"
    >
      {/* Icon circle */}
      <div className="empty-state__icon" aria-hidden="true">
        {resolvedIcon}
      </div>

      {/* Title */}
      <h3 className="empty-state__title">{title}</h3>

      {/* Message */}
      {message && (
        <p className="empty-state__message">{message}</p>
      )}

      {/* Optional CTA */}
      {action && (
        <div style={{ marginTop: 'var(--space-2)' }}>
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
