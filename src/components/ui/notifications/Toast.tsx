'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/* ============================================================================
   Toast Notification Components
   Toast, ToastContainer, useToast hook
   Uses .toast, .toast--{variant}, .toast-container from components.css.
   No hard-coded values — everything traces to a design token.
   ============================================================================ */

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number; // ms — default 5000, set to 0 for persistent
}

/* ────────────────────────────────────────────────────────────────────────────
   Toast Icon — per variant
   ──────────────────────────────────────────────────────────────────────────── */

const ToastIcon: React.FC<{ variant: ToastVariant }> = ({ variant }) => {
  const props = { size: 18, strokeWidth: 2, 'aria-hidden': true } as const;

  switch (variant) {
    case 'success': return <CheckCircle {...props} />;
    case 'error':   return <XCircle    {...props} />;
    case 'warning': return <AlertTriangle {...props} />;
    case 'info':    return <Info        {...props} />;
  }
};

/* ────────────────────────────────────────────────────────────────────────────
   aria-live region label per variant
   ──────────────────────────────────────────────────────────────────────────── */

const variantAriaRole: Record<ToastVariant, 'alert' | 'status'> = {
  success: 'status',
  error:   'alert',
  warning: 'alert',
  info:    'status',
};

/* ────────────────────────────────────────────────────────────────────────────
   Single Toast
   ──────────────────────────────────────────────────────────────────────────── */

interface ToastProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ item, onDismiss }) => {
  const { id, variant, title, message, duration = 5000 } = item;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [exiting, setExiting] = useState(false);

  const dismiss = useCallback(() => {
    setExiting(true);
    // Give CSS exit animation time before removing from DOM
    setTimeout(() => onDismiss(id), 240);
  }, [id, onDismiss]);

  useEffect(() => {
    if (duration === 0) return; // persistent toast
    timerRef.current = setTimeout(dismiss, duration);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration, dismiss]);

  /* Pause auto-dismiss on hover */
  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleMouseLeave = () => {
    if (duration === 0) return;
    timerRef.current = setTimeout(dismiss, duration);
  };

  return (
    <div
      className={`toast toast--${variant}`}
      role={variantAriaRole[variant]}
      aria-atomic="true"
      aria-live={variantAriaRole[variant] === 'alert' ? 'assertive' : 'polite'}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        animation: exiting
          ? 'toast-out 0.24s var(--ease-in) both'
          : undefined,
      }}
    >
      {/* Variant icon */}
      <div className="toast__icon" aria-hidden="true">
        <ToastIcon variant={variant} />
      </div>

      {/* Body */}
      <div className="toast__body">
        <p className="toast__title">{title}</p>
        {message && (
          <p className="toast__message">{message}</p>
        )}
      </div>

      {/* Dismiss */}
      <button
        type="button"
        className="toast__dismiss"
        onClick={dismiss}
        aria-label="Dismiss notification"
      >
        <X size={14} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   ToastContainer — fixed bottom-right stack
   ──────────────────────────────────────────────────────────────────────────── */

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="toast-container"
      aria-label="Notifications"
    >
      {toasts.map((item) => (
        <Toast key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   useToast — convenience hook for managing toast state
   Usage:
     const { toasts, toast, dismiss } = useToast();
     toast.success('Payment verified', 'Your RRR has been confirmed.');
   ──────────────────────────────────────────────────────────────────────────── */

let _idCounter = 0;
const genId = () => `toast-${++_idCounter}-${Date.now()}`;

export interface ToastControls {
  toasts: ToastItem[];
  dismiss: (id: string) => void;
  dismissAll: () => void;
  toast: {
    success: (title: string, message?: string, duration?: number) => string;
    error:   (title: string, message?: string, duration?: number) => string;
    warning: (title: string, message?: string, duration?: number) => string;
    info:    (title: string, message?: string, duration?: number) => string;
    custom:  (item: Omit<ToastItem, 'id'>) => string;
  };
}

export function useToast(): ToastControls {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const add = useCallback((item: Omit<ToastItem, 'id'>): string => {
    const id = genId();
    setToasts((prev) => [...prev, { ...item, id }]);
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const toast = {
    success: (title: string, message?: string, duration?: number) =>
      add({ variant: 'success', title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      add({ variant: 'error', title, message, duration }),
    warning: (title: string, message?: string, duration?: number) =>
      add({ variant: 'warning', title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      add({ variant: 'info', title, message, duration }),
    custom: (item: Omit<ToastItem, 'id'>) => add(item),
  };

  return { toasts, dismiss, dismissAll, toast };
}

export default Toast;
