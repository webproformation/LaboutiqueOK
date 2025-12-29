'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const { user } = useAuth();
  const visitIdRef = useRef<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const lastActivityRef = useRef<number>(Date.now());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    sessionIdRef.current = sessionId;

    const createOrUpdateSession = async () => {
      try {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'upsert_session',
            session_id: sessionId!,
            last_activity: new Date().toISOString(),
            device_info: {
              user_agent: navigator.userAgent,
              device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            },
          }),
        });
      } catch (error) {
        console.error('Error managing session:', error);
      }
    };

    createOrUpdateSession();
  }, [user]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const trackPageVisit = async () => {
      startTimeRef.current = Date.now();
      lastActivityRef.current = Date.now();

      try {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'track_page_visit',
            path: pathname,
            session_id: sessionIdRef.current!,
          }),
        });
      } catch (error) {
        console.error('Error tracking page visit:', error);
      }
    };

    trackPageVisit();
  }, [pathname, user]);

  return null;
}

function getBrowserName(): string {
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Other';
}
