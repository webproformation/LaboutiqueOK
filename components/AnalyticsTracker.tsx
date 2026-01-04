'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase-client';

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const { user } = useAuth();
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
        await supabase
          .from('user_sessions')
          .upsert({
            session_id: sessionId!,
            user_id: user?.id || null,
            started_at: new Date().toISOString(),
            last_activity_at: new Date().toISOString(),
          }, {
            onConflict: 'session_id',
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
        await supabase
          .from('page_visits')
          .insert({
            session_id: sessionIdRef.current!,
            user_id: user?.id || null,
            page_path: pathname,
            visited_at: new Date().toISOString(),
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
