'use client';

import React from 'react';
import { SkeletonCard, SkeletonKPICard, SkeletonLine } from './Skeleton';

type PageLoadingVariant = 'dashboard' | 'list' | 'detail' | 'application';

interface PageLoadingProps {
  variant?: PageLoadingVariant;
  title?: string;
  message?: string;
}

export function PageLoading({
  variant = 'dashboard',
  title = 'Preparing your workspace…',
  message = 'Loading the latest portal records and next steps.',
}: PageLoadingProps) {
  const isList = variant === 'list';
  const isDetail = variant === 'detail';
  const isApplication = variant === 'application';

  return (
    <main
      className={`page-loading page-loading--${variant}`}
      role="status"
      aria-busy="true"
      aria-label={title}
    >
      <section className="page-loading__hero" aria-hidden="true">
        <div>
          <SkeletonLine variant="caption" width="148px" />
          <div style={{ marginTop: 'var(--space-4)' }}>
            <SkeletonLine variant="title" width={isApplication ? '58%' : '46%'} />
          </div>
          <div className="page-loading__copy-lines">
            <SkeletonLine variant="body" width="82%" />
            <SkeletonLine variant="body-short" width="62%" />
          </div>
        </div>
        <div className="page-loading__hero-mark" />
      </section>

      <div className="page-loading__text">
        <strong>{title}</strong>
        <span>{message}</span>
      </div>

      {isApplication ? (
        <section className="page-loading__application" aria-hidden="true">
          <SkeletonCard bodyLines={1} showFooter />
          <SkeletonCard bodyLines={4} showFooter />
        </section>
      ) : isDetail ? (
        <section className="page-loading__detail" aria-hidden="true">
          <SkeletonCard bodyLines={5} showFooter />
          <SkeletonCard bodyLines={3} />
        </section>
      ) : (
        <>
          <section className="page-loading__metrics" aria-hidden="true">
            {[0, 1, 2, 3].map((item) => (
              <SkeletonKPICard key={item} />
            ))}
          </section>
          <section className={isList ? 'page-loading__list' : 'page-loading__dashboard'} aria-hidden="true">
            {[0, 1, 2].map((item) => (
              <SkeletonCard key={item} showAvatar bodyLines={isList ? 2 : 3} showFooter />
            ))}
          </section>
        </>
      )}
    </main>
  );
}

export default PageLoading;
