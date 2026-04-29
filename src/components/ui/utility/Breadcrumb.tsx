'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

/* ============================================================================
   Breadcrumb
   items array with label + optional href. ChevronRight separators.
   Last item non-linked, font-weight 500.
   Uses .breadcrumb, .breadcrumb__item, .breadcrumb__link,
   .breadcrumb__separator from components.css.
   No hard-coded values — everything traces to a design token.
   ============================================================================ */

export interface BreadcrumbItem {
  label: string;
  /** If omitted, item renders as plain text (current page) */
  href?: string;
  /** Override default label with an icon (e.g. Home) */
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Show a Home icon as the first crumb prefix */
  showHomeIcon?: boolean;
  className?: string;
  'aria-label'?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items,
  showHomeIcon = false,
  className = '',
  'aria-label': ariaLabel = 'Breadcrumb',
}) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label={ariaLabel}>
      <ol
        className={`breadcrumb${className ? ` ${className}` : ''}`}
        role="list"
      >
        {/* Optional leading Home icon — purely decorative */}
        {showHomeIcon && (
          <li
            className="breadcrumb__item"
            aria-hidden="true"
            style={{ color: 'var(--text-muted)' }}
          >
            <Home
              size={13}
              strokeWidth={2}
              aria-hidden="true"
              style={{ flexShrink: 0 }}
            />
          </li>
        )}

        {items.map((item, index) => {
          const isLast    = index === items.length - 1;
          const isFirst   = index === 0;
          const showSep   = showHomeIcon ? true : !isFirst;

          return (
            <li
              key={index}
              className="breadcrumb__item"
              aria-current={isLast ? 'page' : undefined}
            >
              {/* Separator — hidden from screen readers */}
              {showSep && (
                <ChevronRight
                  size={13}
                  strokeWidth={2.5}
                  className="breadcrumb__separator"
                  aria-hidden="true"
                />
              )}

              {/* Icon slot (overrides label text when provided) */}
              {item.icon ? (
                isLast || !item.href ? (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                      color: isLast
                        ? 'var(--text-primary)'
                        : 'var(--text-secondary)',
                      fontWeight: isLast ? 500 : undefined,
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="breadcrumb__link"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--space-1)',
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )
              ) : isLast || !item.href ? (
                /* Current page — plain text, no link */
                <span>{item.label}</span>
              ) : (
                /* Ancestor page — linked */
                <Link href={item.href} className="breadcrumb__link">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
