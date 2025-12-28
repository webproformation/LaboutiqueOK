'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useLoyalty } from '@/context/LoyaltyContext';
import { useAuth } from '@/context/AuthContext';

export function usePageVisitTracker() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { trackPageVisit } = useLoyalty();
  const lastVisitedPath = useRef<string | null>(null);
  const visitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !pathname) return;

    if (lastVisitedPath.current === pathname) return;

    if (visitTimeoutRef.current) {
      clearTimeout(visitTimeoutRef.current);
    }

    visitTimeoutRef.current = setTimeout(() => {
      trackPageVisit(pathname);
      lastVisitedPath.current = pathname;
    }, 3000);

    return () => {
      if (visitTimeoutRef.current) {
        clearTimeout(visitTimeoutRef.current);
      }
    };
  }, [pathname, user, trackPageVisit]);
}
