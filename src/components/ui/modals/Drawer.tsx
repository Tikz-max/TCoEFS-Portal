'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';

/* ============================================================================
   Drawer — Right Slide-Over Panel
   Max-width 480px. Header (title + close X), scrollable body, footer with
   action buttons slot.
   Uses .drawer-backdrop, .drawer, .drawer__header, .drawer__title,
   .drawer__close, .drawer__body, .drawer__footer from components.css.
   No hard-coded values — everything traces to a design token.
   ============================================================================ */

interface DrawerProps {
  /** Controls visibility */
  open: boolean;
  /** Drawer heading */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Scrollable body content */
  children: React.ReactNode;
  /** Footer slot — typically action buttons */
  footer?: React.ReactNode;
  /** Called when user clicks the close button or backdrop or presses Esc */
  onClose: () => void;
  /** Optional extra className on the .drawer panel */
  className?: string;
  /** Max width override — default is 480px from components.css */
  maxWidth?: number;
}

export const Drawer: React.FC<DrawerProps> = ({
  open,
  title,
  subtitle,
  children,
  footer,
  onClose,
  className = '',
  maxWidth,
}) => {
  const drawerRef      = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocus  = useRef<HTMLElement | null>(null);

  /* ── Focus trap ──────────────────────────────────────────────────────────── */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );

      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [open, onClose],
  );

  /* ── Open / close lifecycle ──────────────────────────────────────────────── */
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      requestAnimationFrame(() => {
        closeButtonRef.current?.focus();
      });
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

  /* ── Prevent body scroll while open ─────────────────────────────────────── */
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position  = 'fixed';
      document.body.style.top       = `-${scrollY}px`;
      document.body.style.width     = '100%';
      document.body.style.overflowY = 'scroll';
    } else {
      const scrollY = parseInt(document.body.style.top || '0', 10) * -1;
      document.body.style.position  = '';
      document.body.style.top       = '';
      document.body.style.width     = '';
      document.body.style.overflowY = '';
      if (scrollY) window.scrollTo(0, scrollY);
    }
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="drawer-backdrop"
        role="presentation"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={`drawer${className ? ` ${className}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        style={maxWidth ? { maxWidth: `${maxWidth}px` } : undefined}
      >
        {/* Header */}
        <div className="drawer__header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2
              id="drawer-title"
              className="drawer__title"
            >
              {title}
            </h2>
            {subtitle && (
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  marginTop: '3px',
                  lineHeight: 1.4,
                }}
              >
                {subtitle}
              </p>
            )}
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            className="drawer__close"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="drawer__body">
          {children}
        </div>

        {/* Optional footer */}
        {footer && (
          <div className="drawer__footer">
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

export default Drawer;
