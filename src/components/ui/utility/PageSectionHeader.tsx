'use client';

import React from 'react';

/* ============================================================================
   PageSectionHeader
   Title (H2), optional subtitle, optional action button (right-aligned).
   Responsive: stacks on mobile via .section-header CSS class.
   Uses .section-header, .section-header__text, .section-header__title,
   .section-header__subtitle, .section-header__action from components.css.
   No hard-coded values — everything traces to a design token.
   ============================================================================ */

interface PageSectionHeaderProps {
  title: string;
  subtitle?: string;
  /** Right-aligned action slot — typically a Button component */
  action?: React.ReactNode;
  /** Render the title as a different heading level — default h2 */
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  className?: string;
}

export const PageSectionHeader: React.FC<PageSectionHeaderProps> = ({
  title,
  subtitle,
  action,
  as: Tag = 'h2',
  className = '',
}) => (
  <div className={`section-header${className ? ` ${className}` : ''}`}>
    <div className="section-header__text">
      <Tag className="section-header__title">{title}</Tag>
      {subtitle && (
        <p className="section-header__subtitle">{subtitle}</p>
      )}
    </div>

    {action && (
      <div className="section-header__action">
        {action}
      </div>
    )}
  </div>
);

export default PageSectionHeader;
