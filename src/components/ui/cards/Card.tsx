'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Users,
  BookOpen,
  Award,
  Copy,
  Check,
  Download,
  AlertTriangle,
  MapPin,
  Calendar,
  ChevronRight,
  Play,
} from 'lucide-react';
import { Badge, type BadgeVariant } from '../badges/Badge';

/* ============================================================================
   Card Components
   All card variants defined in styles-new.md.
   Uses CSS classes from components.css — no hard-coded values.
   ============================================================================ */

/* ────────────────────────────────────────────────────────────────────────────
   Standard Content Card
   ──────────────────────────────────────────────────────────────────────────── */

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ children, className = '', style }) => (
  <div className={`card ${className}`} style={style}>
    {children}
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   Interactive Card
   ──────────────────────────────────────────────────────────────────────────── */

interface InteractiveCardProps extends CardProps {
  onClick?: () => void;
  href?: string;
  tabIndex?: number;
  'aria-label'?: string;
}

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  children,
  className = '',
  style,
  onClick,
  tabIndex = 0,
  'aria-label': ariaLabel,
}) => (
  <div
    className={`card-interactive ${className}`}
    style={style}
    onClick={onClick}
    tabIndex={tabIndex}
    role={onClick ? 'button' : undefined}
    aria-label={ariaLabel}
    onKeyDown={(e) => {
      if (onClick && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        onClick();
      }
    }}
  >
    {children}
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   KPI Card (Admin Dashboard)
   ──────────────────────────────────────────────────────────────────────────── */

export type KPIDelta = 'positive' | 'negative' | 'neutral';

interface KPICardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaType?: KPIDelta;
  icon?: React.ReactNode;
  iconBg?: string;
  className?: string;
}

const DeltaIcon: React.FC<{ type: KPIDelta }> = ({ type }) => {
  const props = { size: 12, strokeWidth: 2.5, 'aria-hidden': true } as const;
  if (type === 'positive') return <TrendingUp {...props} />;
  if (type === 'negative') return <TrendingDown {...props} />;
  return <Minus {...props} />;
};

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  delta,
  deltaType = 'neutral',
  icon,
  iconBg,
  className = '',
}) => (
  <div className={`card-kpi ${className}`}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
      <span className="card-kpi__label">{label}</span>
      {icon && (
        <div
          className="card-kpi__icon"
          style={{
            background: iconBg ?? 'var(--green-whisper)',
            color: 'var(--green-primary)',
          }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
    </div>
    <span className="card-kpi__value" aria-live="polite">
      {value}
    </span>
    {delta && (
      <span className={`card-kpi__delta card-kpi__delta--${deltaType}`}>
        <DeltaIcon type={deltaType} />
        {delta}
      </span>
    )}
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   Programme / Training Card
   ──────────────────────────────────────────────────────────────────────────── */

interface ProgrammeMetaItem {
  icon?: React.ReactNode;
  label: string;
}

interface ProgrammeCardProps {
  category: string;
  title: string;
  description: string;
  meta: ProgrammeMetaItem[];
  badge?: BadgeVariant;
  badgeLabel?: string;
  ctaLabel?: string;
  onCTA?: () => void;
  onClick?: () => void;
  className?: string;
}

export const ProgrammeCard: React.FC<ProgrammeCardProps> = ({
  category,
  title,
  description,
  meta,
  badge,
  badgeLabel,
  ctaLabel = 'View Details',
  onCTA,
  onClick,
  className = '',
}) => (
  <div className={`card-programme ${className}`} onClick={onClick} tabIndex={0} role="article">
    <span className="card-programme__category">{category}</span>

    <h3 className="card-programme__title">{title}</h3>

    <div className="card-programme__meta">
      {meta.map((item, i) => (
        <span key={i} className="card-programme__meta-item">
          {item.icon && <span aria-hidden="true" style={{ display: 'flex', flexShrink: 0 }}>{item.icon}</span>}
          {item.label}
        </span>
      ))}
    </div>

    <p className="card-programme__description">{description}</p>

    <div className="card-programme__footer">
      {badge ? (
        <Badge variant={badge} label={badgeLabel} />
      ) : (
        <span />
      )}
      <button
        className="btn btn-ghost btn-sm"
        onClick={(e) => {
          e.stopPropagation();
          onCTA?.();
        }}
        type="button"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-1)' }}
      >
        {ctaLabel}
        <ChevronRight size={14} aria-hidden="true" />
      </button>
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   Course Card (E-Learning)
   ──────────────────────────────────────────────────────────────────────────── */

interface CourseCardProps {
  thumbnailSrc?: string;
  thumbnailAlt?: string;
  category: string;
  title: string;
  instructor?: string;
  duration?: string;
  moduleCount?: number;
  progress?: number; // 0–100
  badge?: BadgeVariant;
  badgeLabel?: string;
  onClick?: () => void;
  className?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  thumbnailSrc,
  thumbnailAlt = '',
  category,
  title,
  instructor,
  duration,
  moduleCount,
  progress,
  badge,
  badgeLabel,
  onClick,
  className = '',
}) => (
  <div className={`card-course ${className}`} onClick={onClick} tabIndex={0} role="article">
    {thumbnailSrc ? (
      <img
        src={thumbnailSrc}
        alt={thumbnailAlt}
        className="card-course__thumbnail"
      />
    ) : (
      <div className="card-course__thumbnail-placeholder" aria-hidden="true">
        <Play size={32} color="rgba(255,255,255,0.6)" />
      </div>
    )}

    <div className="card-course__body">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-2)' }}>
        <span className="card-course__category">{category}</span>
        {badge && <Badge variant={badge} label={badgeLabel} showIcon={false} />}
      </div>

      <h3 className="card-course__title">{title}</h3>

      <div className="card-course__meta">
        {instructor && (
          <span className="card-course__meta-item">
            <Users size={12} aria-hidden="true" />
            {instructor}
          </span>
        )}
        {duration && (
          <span className="card-course__meta-item">
            <Clock size={12} aria-hidden="true" />
            {duration}
          </span>
        )}
        {moduleCount !== undefined && (
          <span className="card-course__meta-item">
            <BookOpen size={12} aria-hidden="true" />
            {moduleCount} modules
          </span>
        )}
      </div>

      {progress !== undefined && (
        <>
          <div className="card-course__progress-label">
            <span>Progress</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{progress}%</span>
          </div>
          <div
            className="card-course__progress-bar"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Course progress: ${progress}%`}
          >
            <div
              className="card-course__progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}
    </div>
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   Payment Reference Card
   ──────────────────────────────────────────────────────────────────────────── */

interface PaymentDetailRow {
  key: string;
  value: string;
  isAmount?: boolean;
}

interface PaymentReferenceCardProps {
  rrr: string;
  details: PaymentDetailRow[];
  warningText?: string;
  onDownload?: () => void;
  onDone?: () => void;
  className?: string;
}

export const PaymentReferenceCard: React.FC<PaymentReferenceCardProps> = ({
  rrr,
  details,
  warningText,
  onDownload,
  onDone,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(rrr);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text visually
    }
  };

  return (
    <div className={`card-reference ${className}`}>
      {/* Header */}
      <div>
        <p className="card-reference__label">Remita Retrieval Reference</p>
        <p style={{ fontSize: 'var(--text-body-sm-size)', color: 'var(--text-secondary)', marginTop: 'var(--space-1)', lineHeight: 1.5 }}>
          Present this number at any bank or use it for internet/mobile banking
        </p>
      </div>

      {/* RRR display */}
      <div className="card-reference__id-wrapper">
        <span className="card-reference__id" aria-label={`Reference number: ${rrr}`}>
          {rrr}
        </span>
        <button
          className={`card-reference__copy-btn${copied ? ' card-reference__copy-btn--copied' : ''}`}
          onClick={handleCopy}
          type="button"
          aria-label={copied ? 'Copied to clipboard' : 'Copy reference number'}
        >
          {copied ? (
            <>
              <Check size={13} aria-hidden="true" />
              Copied!
            </>
          ) : (
            <>
              <Copy size={13} aria-hidden="true" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Detail rows */}
      <div className="card-reference__details">
        {details.map((row, i) => (
          <div key={i} className="card-reference__detail-row">
            <span className="card-reference__detail-key">{row.key}</span>
            {row.isAmount ? (
              <span className="card-reference__amount">{row.value}</span>
            ) : (
              <span className="card-reference__detail-value">{row.value}</span>
            )}
          </div>
        ))}
      </div>

      {/* Warning */}
      {warningText && (
        <div className="card-reference__warning">
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <span>{warningText}</span>
        </div>
      )}

      {/* Actions */}
      <div className="card-reference__actions">
        {onDownload && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={onDownload}
            type="button"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <Download size={14} aria-hidden="true" />
            Download Invoice
          </button>
        )}
        {onDone && (
          <button
            className="btn btn-primary btn-sm"
            onClick={onDone}
            type="button"
          >
            I Have Paid
          </button>
        )}
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   Certificate Card
   ──────────────────────────────────────────────────────────────────────────── */

interface CertificateCardProps {
  courseTitle: string;
  recipientName: string;
  issuedDate: string;
  onDownload?: () => void;
  className?: string;
}

export const CertificateCard: React.FC<CertificateCardProps> = ({
  courseTitle,
  recipientName,
  issuedDate,
  onDownload,
  className = '',
}) => (
  <div className={`card-certificate ${className}`}>
    {/* Seal */}
    <div className="card-certificate__seal" aria-hidden="true">
      <Award size={28} strokeWidth={1.5} />
    </div>

    <span className="card-certificate__issued-label">Certificate of Completion</span>

    <div className="card-certificate__divider" aria-hidden="true" />

    <h3 className="card-certificate__title">{courseTitle}</h3>

    <p className="card-certificate__recipient">
      Awarded to <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{recipientName}</strong>
    </p>

    <p className="card-certificate__date">Issued {issuedDate}</p>

    {onDownload && (
      <button
        className="card-certificate__download"
        onClick={onDownload}
        type="button"
        aria-label={`Download certificate for ${courseTitle}`}
      >
        <Download size={16} aria-hidden="true" />
        Download Certificate
      </button>
    )}
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   Auth Card
   ──────────────────────────────────────────────────────────────────────────── */

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, className = '' }) => (
  <div className={`card-auth ${className}`}>
    {children}
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   Default export — generic Card
   ──────────────────────────────────────────────────────────────────────────── */

export default Card;
