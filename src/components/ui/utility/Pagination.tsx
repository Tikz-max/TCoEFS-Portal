'use client';

import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* ============================================================================
   Pagination
   Page number buttons, prev/next arrows, ellipsis for large page counts,
   active state (green bg), disabled state (opacity), optional results summary.
   Uses .pagination, .pagination__btn, .pagination__btn--active,
   .pagination__ellipsis, .pagination__summary from components.css.
   No hard-coded values — everything traces to a design token.
   ============================================================================ */

interface PaginationProps {
  currentPage: number;       // 1-indexed
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Show "Showing X – Y of Z results" summary text */
  showSummary?: boolean;
  /** Total number of result items — required when showSummary is true */
  totalItems?: number;
  /** Number of items per page — required when showSummary is true */
  itemsPerPage?: number;
  /** Max page buttons to show before collapsing to ellipsis — default 5 */
  siblingCount?: number;
  className?: string;
  'aria-label'?: string;
}

/* ────────────────────────────────────────────────────────────────────────────
   buildPageRange
   Returns an array of page numbers + "…" sentinel strings.
   Always shows: first page, last page, current ± siblingCount, ellipsis gaps.
   ──────────────────────────────────────────────────────────────────────────── */

const ELLIPSIS = '…' as const;
type PageItem = number | typeof ELLIPSIS;

function buildPageRange(
  current: number,
  total: number,
  siblingCount: number,
): PageItem[] {
  // Total visible page slots: siblings × 2 + current + first + last + up to 2 ellipses
  const totalSlots = siblingCount * 2 + 5;

  // If everything fits, just return [1 … total]
  if (total <= totalSlots) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const leftSibling  = Math.max(current - siblingCount, 1);
  const rightSibling = Math.min(current + siblingCount, total);

  const showLeftEllipsis  = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  const pages: PageItem[] = [];

  // Always show first page
  pages.push(1);

  if (showLeftEllipsis) {
    pages.push(ELLIPSIS);
  } else {
    // Fill in pages between 1 and leftSibling
    for (let p = 2; p < leftSibling; p++) {
      pages.push(p);
    }
  }

  // Sibling range around current
  for (let p = leftSibling; p <= rightSibling; p++) {
    if (p > 1 && p < total) {
      pages.push(p);
    }
  }

  if (showRightEllipsis) {
    pages.push(ELLIPSIS);
  } else {
    // Fill in pages between rightSibling and last
    for (let p = rightSibling + 1; p < total; p++) {
      pages.push(p);
    }
  }

  // Always show last page
  if (total > 1) pages.push(total);

  // Deduplicate while preserving order (first/last can overlap sibling range)
  const seen = new Set<number>();
  return pages.filter((p) => {
    if (p === ELLIPSIS) return true;
    if (seen.has(p as number)) return false;
    seen.add(p as number);
    return true;
  });
}

/* ────────────────────────────────────────────────────────────────────────────
   Pagination Component
   ──────────────────────────────────────────────────────────────────────────── */

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  showSummary    = false,
  totalItems,
  itemsPerPage   = 10,
  siblingCount   = 1,
  className      = '',
  'aria-label': ariaLabel = 'Pagination',
}) => {
  const pages = useMemo(
    () => buildPageRange(currentPage, totalPages, siblingCount),
    [currentPage, totalPages, siblingCount],
  );

  /* Results summary text */
  const summaryText = useMemo(() => {
    if (!showSummary || totalItems === undefined) return null;
    const start = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
    const end   = Math.min(currentPage * itemsPerPage, totalItems);
    return `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${totalItems.toLocaleString()} result${totalItems === 1 ? '' : 's'}`;
  }, [showSummary, currentPage, totalItems, itemsPerPage]);

  if (totalPages <= 1 && !showSummary) return null;

  const isFirst = currentPage <= 1;
  const isLast  = currentPage >= totalPages;

  /* Ellipsis instances get unique keys via a counter */
  let ellipsisCount = 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 'var(--space-3)',
      }}
      className={className}
    >
      {/* Summary — left side */}
      {summaryText && (
        <p className="pagination__summary" aria-live="polite" aria-atomic="true">
          {summaryText}
        </p>
      )}

      {/* Page controls — right side (or centred when no summary) */}
      {totalPages > 1 && (
        <nav
          className={`pagination${!summaryText ? ' ms-auto' : ''}`}
          aria-label={ariaLabel}
          style={!summaryText ? { marginLeft: 'auto' } : undefined}
        >
          {/* Previous */}
          <button
            type="button"
            className="pagination__btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={isFirst}
            aria-label="Previous page"
            aria-disabled={isFirst}
          >
            <ChevronLeft size={15} strokeWidth={2.5} aria-hidden="true" />
          </button>

          {/* Page number buttons + ellipses */}
          {pages.map((page) => {
            if (page === ELLIPSIS) {
              ellipsisCount += 1;
              return (
                <span
                  key={`ellipsis-${ellipsisCount}`}
                  className="pagination__ellipsis"
                  aria-hidden="true"
                >
                  {ELLIPSIS}
                </span>
              );
            }

            const pageNum  = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                type="button"
                className={`pagination__btn${isActive ? ' pagination__btn--active' : ''}`}
                onClick={() => !isActive && onPageChange(pageNum)}
                aria-label={`Page ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
                disabled={isActive}
              >
                {pageNum}
              </button>
            );
          })}

          {/* Next */}
          <button
            type="button"
            className="pagination__btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={isLast}
            aria-label="Next page"
            aria-disabled={isLast}
          >
            <ChevronRight size={15} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  );
};

export default Pagination;
