'use client';

import React from 'react';
import {
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  ShieldCheck,
  AlertCircle,
  BookOpen,
  Timer,
  Lock,
  Circle,
  PlayCircle,
  CheckSquare,
  XSquare,
  Award,
  Hourglass,
} from 'lucide-react';

/* ============================================================================
   Badge Component
   15 semantic status variants. No decorative use.
   Each variant maps to exactly one semantic state.
   Uses .badge, .badge--{variant} from components.css.
   ============================================================================ */

export type BadgeVariant =
  | 'pending'
  | 'review'
  | 'approved'
  | 'rejected'
  | 'verified'
  | 'incomplete'
  | 'open'
  | 'closing-soon'
  | 'closed'
  | 'awaiting'
  | 'not-started'
  | 'in-progress'
  | 'completed'
  | 'failed'
  | 'gold';

interface BadgeProps {
  variant: BadgeVariant;
  label?: string;
  showIcon?: boolean;
  className?: string;
  /** Override the display label. If not set, uses the default label for the variant. */
  children?: React.ReactNode;
}

/* Default display labels per variant */
const defaultLabels: Record<BadgeVariant, string> = {
  'pending':      'Pending',
  'review':       'Under Review',
  'approved':     'Approved',
  'rejected':     'Rejected',
  'verified':     'Verified',
  'incomplete':   'Incomplete',
  'open':         'Open',
  'closing-soon': 'Closing Soon',
  'closed':       'Closed',
  'awaiting':     'Awaiting Verification',
  'not-started':  'Not Started',
  'in-progress':  'In Progress',
  'completed':    'Completed',
  'failed':       'Failed',
  'gold':         'Certified',
};

/* Screen-reader-friendly full status name */
const ariaLabels: Record<BadgeVariant, string> = {
  'pending':      'Status: Pending',
  'review':       'Status: Under Review',
  'approved':     'Status: Approved',
  'rejected':     'Status: Rejected',
  'verified':     'Status: Verified',
  'incomplete':   'Status: Incomplete',
  'open':         'Status: Open',
  'closing-soon': 'Status: Closing Soon',
  'closed':       'Status: Closed',
  'awaiting':     'Status: Awaiting Verification',
  'not-started':  'Status: Not Started',
  'in-progress':  'Status: In Progress',
  'completed':    'Status: Completed',
  'failed':       'Status: Failed',
  'gold':         'Status: Certified',
};

/* Icon per variant — 12px for the badge scale */
const BadgeIcon: React.FC<{ variant: BadgeVariant }> = ({ variant }) => {
  const props = { size: 11, strokeWidth: 2.5, 'aria-hidden': true } as const;

  switch (variant) {
    case 'pending':      return <Clock {...props} />;
    case 'review':       return <Eye {...props} />;
    case 'approved':     return <CheckCircle {...props} />;
    case 'rejected':     return <XCircle {...props} />;
    case 'verified':     return <ShieldCheck {...props} />;
    case 'incomplete':   return <AlertCircle {...props} />;
    case 'open':         return <BookOpen {...props} />;
    case 'closing-soon': return <Timer {...props} />;
    case 'closed':       return <Lock {...props} />;
    case 'awaiting':     return <Hourglass {...props} />;
    case 'not-started':  return <Circle {...props} />;
    case 'in-progress':  return <PlayCircle {...props} />;
    case 'completed':    return <CheckSquare {...props} />;
    case 'failed':       return <XSquare {...props} />;
    case 'gold':         return <Award {...props} />;
    default:             return null;
  }
};

export const Badge: React.FC<BadgeProps> = ({
  variant,
  label,
  showIcon = true,
  className = '',
  children,
}) => {
  const displayLabel = children ?? label ?? defaultLabels[variant];
  const cssClass = `badge badge--${variant}${className ? ` ${className}` : ''}`;

  return (
    <span
      className={cssClass}
      aria-label={ariaLabels[variant]}
      role="status"
    >
      {showIcon && <BadgeIcon variant={variant} />}
      {displayLabel}
    </span>
  );
};

/* ──────────────────────────────────────────────────────────────────────────── */
/* Convenience named exports for common variants                                */

export const PendingBadge      = (p: Omit<BadgeProps, 'variant'>) => <Badge variant="pending"      {...p} />;
export const ReviewBadge       = (p: Omit<BadgeProps, 'variant'>) => <Badge variant="review"       {...p} />;
export const ApprovedBadge     = (p: Omit<BadgeProps, 'variant'>) => <Badge variant="approved"     {...p} />;
export const RejectedBadge     = (p: Omit<BadgeProps, 'variant'>) => <Badge variant="rejected"     {...p} />;
export const VerifiedBadge     = (p: Omit<BadgeProps, 'variant'>) => <Badge variant="verified"     {...p} />;
export const IncompleteBadge   = (p: Omit<BadgeProps, 'variant'>) => <Badge variant="incomplete"   {...p} />;
export const OpenBadge         = (p: Omit<BadgeProps, 'variant'>) => <Badge variant="open"         {...p} />;
export const ClosingSoonBadge  = (p: Omit<BadgeProps, 'variant'>) => <Badge variant="closing-soon" {...p} />;
export const ClosedBadge       = (p: Omit<BadgeProps, 'variant'>) => <Badge variant="closed"       {...p} />;
export const AwaitingBadge     = (p: Omit<BadgeProps, 'variant'>) => <Badge variant="awaiting"     {...p} />;
export const NotStartedBadge   = (p: Omit<BadgeProps, 'variant'>) => <Badge variant="not-started"  {...p} />;
export const InProgressBadge   = (p: Omit<BadgeProps, 'variant'>) => <Badge variant="in-progress"  {...p} />;
export const CompletedBadge    = (p: Omit<BadgeProps, 'variant'>) => <Badge variant="completed"    {...p} />;
export const FailedBadge       = (p: Omit<BadgeProps, 'variant'>) => <Badge variant="failed"       {...p} />;
export const GoldBadge         = (p: Omit<BadgeProps, 'variant'>) => <Badge variant="gold"         {...p} />;

export default Badge;
