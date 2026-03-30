'use client';

/**
 * PageTransition
 * ─────────────
 * Wraps page content and plays a subtle fade + slide-up animation on every
 * pathname change.  We avoid remounting children (which would trigger
 * refetches) by using a CSS class toggle with a forced reflow instead of
 * changing the React `key`.
 *
 * Usage:
 *   <PageTransition>{children}</PageTransition>
 */

import { ReactNode, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Remove class so removing→adding triggers the animation again
    el.classList.remove('page-enter');
    // Force a style reflow so the browser registers the removal
    void el.offsetHeight;
    el.classList.add('page-enter');
  }, [pathname]);

  return (
    <div ref={ref} className={`page-enter${className ? ` ${className}` : ''}`}>
      {children}
    </div>
  );
}
