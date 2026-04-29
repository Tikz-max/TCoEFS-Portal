'use client';

import React from 'react';
import { Check, Lock, FileText, AlertCircle, Clock } from 'lucide-react';

/* ============================================================================
   Progress Components
   StepProgress, LinearProgressBar, ProgressRing, DocumentChecklistItem
   Uses CSS classes from components.css — no hard-coded values.
   ============================================================================ */

/* ────────────────────────────────────────────────────────────────────────────
   Seven-Step Workflow Progress Indicator
   ──────────────────────────────────────────────────────────────────────────── */

export type StepState = 'complete' | 'active' | 'inactive';

export interface Step {
  label: string;
  state: StepState;
  stepNumber: number;
}

interface StepProgressProps {
  steps: Step[];
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({ steps, className = '' }) => (
  <nav
    className={`step-progress${className ? ` ${className}` : ''}`}
    aria-label="Application progress"
  >
    {steps.map((step, index) => (
      <div
        key={index}
        className={`step-progress__item step-progress__item--${step.state}`}
        aria-current={step.state === 'active' ? 'step' : undefined}
      >
        {/* Connector line — sits before the circle visually */}
        <div className="step-progress__connector" aria-hidden="true" />

        {/* Circle */}
        <div
          className="step-progress__circle"
          aria-label={`Step ${step.stepNumber}: ${step.label} — ${step.state}`}
        >
          {step.state === 'complete' ? (
            <Check
              size={16}
              strokeWidth={2.5}
              aria-hidden="true"
              style={{ animation: step.state === 'complete' ? 'check-pop var(--duration-medium) var(--ease-spring)' : undefined }}
            />
          ) : (
            <span aria-hidden="true">{step.stepNumber}</span>
          )}
        </div>

        {/* Label */}
        <span className="step-progress__label">{step.label}</span>
      </div>
    ))}
  </nav>
);

/* ────────────────────────────────────────────────────────────────────────────
   Linear Progress Bar
   ──────────────────────────────────────────────────────────────────────────── */

type ProgressVariant = 'green' | 'gold';
type ProgressThickness = 'thin' | 'default' | 'thick';

interface LinearProgressBarProps {
  value: number; // 0–100
  variant?: ProgressVariant;
  thickness?: ProgressThickness;
  label?: string;
  showLabel?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const LinearProgressBar: React.FC<LinearProgressBarProps> = ({
  value,
  variant = 'green',
  thickness = 'default',
  label,
  showLabel = false,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const clamped = Math.max(0, Math.min(100, value));

  const barClass = [
    'progress-bar',
    thickness === 'thin' ? 'progress-bar--thin' : '',
    thickness === 'thick' ? 'progress-bar--thick' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const fillClass = [
    'progress-bar__fill',
    variant === 'gold' ? 'progress-bar__fill--gold' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div>
      {(showLabel || label) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--space-2)',
          }}
        >
          {label && (
            <span
              style={{
                fontSize: 'var(--text-body-sm-size)',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              {label}
            </span>
          )}
          {showLabel && (
            <span
              style={{
                fontSize: 'var(--text-body-sm-size)',
                color: 'var(--text-primary)',
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.2px',
              }}
              aria-hidden="true"
            >
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div
        className={barClass}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? label ?? `Progress: ${clamped}%`}
      >
        <div className={fillClass} style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   Progress Ring (SVG)
   ──────────────────────────────────────────────────────────────────────────── */

interface ProgressRingProps {
  value: number; // 0–100
  size?: number; // px, default 72
  strokeWidth?: number;
  variant?: ProgressVariant;
  showLabel?: boolean;
  label?: string;
  className?: string;
  'aria-label'?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 72,
  strokeWidth = 5,
  variant = 'green',
  showLabel = true,
  label,
  className = '',
  'aria-label': ariaLabel,
}) => {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (clamped / 100) * circumference;

  const fillClass = [
    'progress-ring__fill',
    variant === 'gold' ? 'progress-ring__fill--gold' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`progress-ring${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel ?? `Progress ring: ${clamped}%`}
    >
      <svg
        className="progress-ring__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          className="progress-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          className={fillClass}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          style={{ transition: `stroke-dashoffset var(--duration-deliberate) var(--ease-out)` }}
        />
      </svg>

      {/* Centre label */}
      {showLabel && (
        <div className="progress-ring__label" aria-hidden="true">
          {label ?? `${clamped}%`}
        </div>
      )}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   Document Checklist Item
   ──────────────────────────────────────────────────────────────────────────── */

export type ChecklistItemState = 'complete' | 'missing' | 'optional';

interface ChecklistItemProps {
  state: ChecklistItemState;
  label: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const ChecklistIcon: React.FC<{ state: ChecklistItemState }> = ({ state }) => {
  const props = { size: 13, strokeWidth: 2.5, 'aria-hidden': true } as const;

  if (state === 'complete') return <Check {...props} />;
  if (state === 'missing')  return <AlertCircle {...props} />;
  return <Clock {...props} />;
};

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  state,
  label,
  hint,
  actionLabel,
  onAction,
  className = '',
}) => (
  <div
    className={`checklist-item checklist-item--${state}${className ? ` ${className}` : ''}`}
    role="listitem"
    aria-label={`${label}: ${state}`}
  >
    {/* State icon */}
    <div className="checklist-item__icon" aria-hidden="true">
      <ChecklistIcon state={state} />
    </div>

    {/* Text content */}
    <div className="checklist-item__content">
      <p className="checklist-item__label">{label}</p>
      {hint && <p className="checklist-item__hint">{hint}</p>}
    </div>

    {/* Optional action link */}
    {actionLabel && onAction && (
      <div className="checklist-item__action">
        <button
          className="btn btn-ghost btn-sm"
          type="button"
          onClick={onAction}
          style={{
            fontSize: '12px',
            height: '28px',
            padding: '0 var(--space-2)',
            color: state === 'missing' ? 'var(--status-error-text)' : 'var(--green-primary)',
          }}
        >
          {actionLabel}
        </button>
      </div>
    )}
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   Document Checklist container
   ──────────────────────────────────────────────────────────────────────────── */

interface ChecklistProps {
  items: Omit<ChecklistItemProps, 'className'>[];
  title?: string;
  className?: string;
}

export const DocumentChecklist: React.FC<ChecklistProps> = ({
  items,
  title,
  className = '',
}) => (
  <div className={`card${className ? ` ${className}` : ''}`} style={{ padding: 0, overflow: 'hidden' }}>
    {title && (
      <div
        style={{
          padding: 'var(--space-4) var(--space-4)',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <h4
          style={{
            fontSize: 'var(--text-h4-size)',
            fontWeight: 'var(--text-h4-weight)',
            color: 'var(--text-primary)',
            letterSpacing: 'var(--text-h4-spacing)',
          }}
        >
          {title}
        </h4>
      </div>
    )}
    <div role="list">
      {items.map((item, i) => (
        <ChecklistItem key={i} {...item} />
      ))}
    </div>
  </div>
);

export default StepProgress;
