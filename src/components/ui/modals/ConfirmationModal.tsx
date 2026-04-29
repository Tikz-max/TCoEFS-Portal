'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import { AlertTriangle, Trash2, Info, CheckCircle, X } from 'lucide-react';
import { Button } from '../buttons/Button';

/* ============================================================================
   ConfirmationModal
   Backdrop + blur, modal card with optional icon (danger/warning/info/success),
   title, message, cancel + confirm buttons.
   Uses .modal-backdrop, .modal, .modal__icon--{type}, .modal__title,
   .modal__message, .modal__actions, .modal__close from components.css.
   No hard-coded values — everything traces to a design token.
   ============================================================================ */

export type ModalIconType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmationModalProps {
  /** Controls visibility */
  open: boolean;
  /** Modal heading */
  title: string;
  /** Body copy — keep to one or two sentences */
  message: React.ReactNode;
  /** Optional semantic icon above the title */
  iconType?: ModalIconType;
  /** Confirm button label — defaults to "Confirm" */
  confirmLabel?: string;
  /** Cancel button label — defaults to "Cancel" */
  cancelLabel?: string;
  /** Whether the confirm action is destructive — uses btn-danger */
  destructive?: boolean;
  /** Loading state on the confirm button */
  confirmLoading?: boolean;
  /** Disables confirm button */
  confirmDisabled?: boolean;
  /** Called when user clicks Confirm */
  onConfirm: () => void;
  /** Called when user clicks Cancel or backdrop/Esc */
  onCancel: () => void;
  /** Optional extra className on the .modal card */
  className?: string;
}

/* ── Icon renderer ─────────────────────────────────────────────────────────── */

const ModalIconContent: React.FC<{ type: ModalIconType }> = ({ type }) => {
  const props = { size: 24, strokeWidth: 2, 'aria-hidden': true } as const;

  switch (type) {
    case 'danger':  return <Trash2         {...props} />;
    case 'warning': return <AlertTriangle  {...props} />;
    case 'info':    return <Info           {...props} />;
    case 'success': return <CheckCircle    {...props} />;
  }
};

/* ── Component ─────────────────────────────────────────────────────────────── */

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  title,
  message,
  iconType,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  destructive  = false,
  confirmLoading  = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
  className = '',
}) => {
  const modalRef     = useRef<HTMLDivElement>(null);
  const confirmRef   = useRef<HTMLButtonElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  /* Trap focus inside modal while open ──────────────────────────────────── */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }

      if (e.key !== 'Tab') return;

      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
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
    [open, onCancel],
  );

  /* Manage open / close effects ─────────────────────────────────────────── */
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      // Defer focus so the animation has a frame to start
      requestAnimationFrame(() => {
        confirmRef.current?.focus();
      });
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, handleKeyDown]);

  /* Prevent body scroll while modal is open ─────────────────────────────── */
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position   = 'fixed';
      document.body.style.top        = `-${scrollY}px`;
      document.body.style.width      = '100%';
      document.body.style.overflowY  = 'scroll';
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
    /* Backdrop */
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        // Dismiss only when clicking the backdrop itself — not the modal card
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      {/* Modal card */}
      <div
        ref={modalRef}
        className={`modal${className ? ` ${className}` : ''}`}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-message"
      >
        {/* Close × button */}
        <button
          type="button"
          className="modal__close"
          onClick={onCancel}
          aria-label="Close dialog"
        >
          <X size={18} strokeWidth={2.5} aria-hidden="true" />
        </button>

        {/* Optional semantic icon */}
        {iconType && (
          <div
            className={`modal__icon modal__icon--${iconType}`}
            aria-hidden="true"
          >
            <ModalIconContent type={iconType} />
          </div>
        )}

        {/* Title */}
        <h2 id="modal-title" className="modal__title">
          {title}
        </h2>

        {/* Message */}
        <p id="modal-message" className="modal__message">
          {message}
        </p>

        {/* Actions */}
        <div className="modal__actions">
          <Button
            variant="ghost"
            onClick={onCancel}
            type="button"
          >
            {cancelLabel}
          </Button>

          <Button
            ref={confirmRef}
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={confirmLoading}
            disabled={confirmDisabled}
            type="button"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
