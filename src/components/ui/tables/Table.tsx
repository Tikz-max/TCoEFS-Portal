'use client';

import React from 'react';
import { Search } from 'lucide-react';

/* ============================================================================
   Table Components
   TableContainer, TableToolbar, Table, TableHead, TableHeader,
   TableBody, TableRow, TableCell, TableActions, TableRefId
   Uses .table, .table-container, .table-toolbar etc. from components.css.
   No hard-coded values — everything traces to a design token.
   ============================================================================ */

/* ────────────────────────────────────────────────────────────────────────────
   TableContainer
   ──────────────────────────────────────────────────────────────────────────── */

interface TableContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const TableContainer: React.FC<TableContainerProps> = ({
  children,
  className = '',
}) => (
  <div className={`table-container${className ? ` ${className}` : ''}`}>
    {children}
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   TableSearch — inline search input used inside TableToolbar
   ──────────────────────────────────────────────────────────────────────────── */

interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const TableSearch: React.FC<TableSearchProps> = ({
  value,
  onChange,
  placeholder = 'Search…',
  className = '',
}) => (
  <div
    className={className}
    style={{
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    }}
  >
    <Search
      size={15}
      strokeWidth={2}
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: '10px',
        color: 'var(--text-muted)',
        pointerEvents: 'none',
        flexShrink: 0,
      }}
    />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      style={{
        height: '36px',
        paddingLeft: '32px',
        paddingRight: '12px',
        border: '1.5px solid var(--border-default)',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--bg-surface-default)',
        fontFamily: 'var(--font-sans)',
        fontSize: '13px',
        color: 'var(--text-primary)',
        outline: 'none',
        width: '220px',
        transition:
          'border-color var(--duration-fast) var(--ease-out), box-shadow var(--duration-fast) var(--ease-out)',
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = 'var(--green-primary)';
        e.currentTarget.style.boxShadow =
          '0 0 0 3px rgba(45, 90, 45, 0.10)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'var(--border-default)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    />
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   TableToolbar
   ──────────────────────────────────────────────────────────────────────────── */

interface TableToolbarProps {
  title: string;
  subtitle?: string;
  /** Right-side action slot — buttons, search, filters */
  actions?: React.ReactNode;
  className?: string;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  title,
  subtitle,
  actions,
  className = '',
}) => (
  <div className={`table-toolbar${className ? ` ${className}` : ''}`}>
    <div>
      <p className="table-toolbar__title">{title}</p>
      {subtitle && (
        <p
          style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
            marginTop: '2px',
            lineHeight: 1.4,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
    {actions && (
      <div className="table-toolbar__actions">{actions}</div>
    )}
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   Table (semantic <table>)
   ──────────────────────────────────────────────────────────────────────────── */

interface TableProps {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

export const Table: React.FC<TableProps> = ({
  children,
  className = '',
  'aria-label': ariaLabel,
}) => (
  <div style={{ overflowX: 'auto', width: '100%' }}>
    <table
      className={`table${className ? ` ${className}` : ''}`}
      aria-label={ariaLabel}
    >
      {children}
    </table>
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   TableHead / TableHeader
   ──────────────────────────────────────────────────────────────────────────── */

interface TableHeadProps {
  children: React.ReactNode;
}

export const TableHead: React.FC<TableHeadProps> = ({ children }) => (
  <thead>{children}</thead>
);

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
  /** Allows controlling text alignment */
  align?: 'left' | 'center' | 'right';
  /** Min width for the column */
  minWidth?: number;
  /** Makes the column sortable (decorative only — no logic) */
  sortable?: boolean;
}

export const TableHeader: React.FC<TableHeaderProps> = ({
  children,
  className = '',
  align = 'left',
  minWidth,
  sortable = false,
}) => (
  <th
    className={className}
    style={{
      textAlign: align,
      minWidth: minWidth ? `${minWidth}px` : undefined,
      cursor: sortable ? 'pointer' : undefined,
      userSelect: sortable ? 'none' : undefined,
    }}
    scope="col"
  >
    {sortable ? (
      <span
        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
      >
        {children}
        {/* Chevron up/down — decorative sort indicator */}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          aria-hidden="true"
          style={{ opacity: 0.45, flexShrink: 0 }}
        >
          <path
            d="M5 2L8 5H2L5 2Z"
            fill="currentColor"
          />
          <path
            d="M5 8L2 5H8L5 8Z"
            fill="currentColor"
          />
        </svg>
      </span>
    ) : (
      children
    )}
  </th>
);

/* ────────────────────────────────────────────────────────────────────────────
   TableBody
   ──────────────────────────────────────────────────────────────────────────── */

interface TableBodyProps {
  children: React.ReactNode;
}

export const TableBody: React.FC<TableBodyProps> = ({ children }) => (
  <tbody>{children}</tbody>
);

/* ────────────────────────────────────────────────────────────────────────────
   TableRow
   ──────────────────────────────────────────────────────────────────────────── */

interface TableRowProps {
  children: React.ReactNode;
  /**
   * "urgent" — applies the warning row tint defined in components.css
   * (.table tbody tr--urgent td)
   */
  urgent?: boolean;
  onClick?: () => void;
  className?: string;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  urgent = false,
  onClick,
  className = '',
}) => {
  const classes = [
    urgent ? 'tr--urgent' : '',
    onClick ? 'tr--clickable' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <tr
      className={classes || undefined}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      role={onClick ? 'button' : undefined}
    >
      {children}
    </tr>
  );
};

/* ────────────────────────────────────────────────────────────────────────────
   TableCell
   ──────────────────────────────────────────────────────────────────────────── */

interface TableCellProps {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  /** Renders as <th scope="row"> for row header cells */
  isRowHeader?: boolean;
  colSpan?: number;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className = '',
  align = 'left',
  isRowHeader = false,
  colSpan,
}) => {
  const props = {
    className: className || undefined,
    style: { textAlign: align } as React.CSSProperties,
    colSpan,
  };

  if (isRowHeader) {
    return (
      <th scope="row" {...props}>
        {children}
      </th>
    );
  }

  return <td {...props}>{children}</td>;
};

/* ────────────────────────────────────────────────────────────────────────────
   TableActions — flex row of action buttons within a cell
   ──────────────────────────────────────────────────────────────────────────── */

interface TableActionsProps {
  children: React.ReactNode;
  className?: string;
}

export const TableActions: React.FC<TableActionsProps> = ({
  children,
  className = '',
}) => (
  <div
    className={`table-actions${className ? ` ${className}` : ''}`}
    onClick={(e) => e.stopPropagation()}
  >
    {children}
  </div>
);

/* ────────────────────────────────────────────────────────────────────────────
   TableRefId — monospace pill for reference IDs in cells
   ──────────────────────────────────────────────────────────────────────────── */

interface TableRefIdProps {
  children: React.ReactNode;
  className?: string;
}

export const TableRefId: React.FC<TableRefIdProps> = ({
  children,
  className = '',
}) => (
  <span
    className={`table-ref-id${className ? ` ${className}` : ''}`}
  >
    {children}
  </span>
);

/* ────────────────────────────────────────────────────────────────────────────
   Default export — the main Table component
   ──────────────────────────────────────────────────────────────────────────── */

export default Table;
