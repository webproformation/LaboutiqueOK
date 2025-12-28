'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase-client';
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
        await supabase.rpc('upsert_user_session', {
          p_session_id: sessionId!,
          p_user_id: user?.id || null,
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
        const { data, error } = await supabase
          .from('page_visits')
          .insert({
            user_id: user?.id || null,
            session_id: sessionIdRef.current!,
            page_path: pathname,
            page_title: document.title,
            referrer: document.referrer || null,
            user_agent: navigator.userAgent,
            device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
            browser: getBrowserName(),
            visited_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (!error && data) {
          visitIdRef.current = data.id;
        }
      } catch (error) {
        console.error('Error tracking page visit:', error);
      }
    };

    const updateTimeSpent = async () => {
      if (!visitIdRef.current) return;

      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);

      try {
        await supabase
          .from('page_visits')
          .update({
            time_spent_seconds: timeSpent,
            left_at: new Date().toISOString(),
          })
          .eq('id', visitIdRef.current);

        if (sessionIdRef.current) {
          const { data: session } = await supabase
            .from('user_sessions')
            .select('total_pages_viewed, total_time_seconds')
            .eq('session_id', sessionIdRef.current)
            .maybeSingle();

          if (session) {
            await supabase
              .from('user_sessions')
              .update({
                last_activity_at: new Date().toISOString(),
                total_pages_viewed: (session.total_pages_viewed || 0) + 1,
                total_time_seconds: (session.total_time_seconds || 0) + timeSpent,
              })
              .eq('session_id', sessionIdRef.current);
          }
        }
      } catch (error) {
        console.error('Error updating time spent:', error);
      }
    };

    trackPageVisit();

    const activityHandler = () => {
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('mousemove', activityHandler);
    window.addEventListener('keydown', activityHandler);
    window.addEventListener('scroll', activityHandler);
    window.addEventListener('click', activityHandler);

    const interval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityRef.current;
      if (timeSinceActivity < 30000) {
        updateTimeSpent();
      }
    }, 15000);

    const handleBeforeUnload = () => {
      updateTimeSpent();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      updateTimeSpent();
      clearInterval(interval);
      window.removeEventListener('mousemove', activityHandler);
      window.removeEventListener('keydown', activityHandler);
      window.removeEventListener('scroll', activityHandler);
      window.removeEventListener('click', activityHandler);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
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
